import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";
import type { ApiResponse } from "@/types";

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse<ApiResponse<T>> {
  return ok(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function apiError(
  message: string,
  status = 400,
  code?: string,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: message, code }, { status });
}

export function fromAppError(error: AppError): NextResponse<ApiResponse<never>> {
  return apiError(error.message, error.statusCode, error.code);
}

/**
 * Wraps a route handler with consistent error handling.
 * Usage: export const GET = withErrorHandler(async (req) => { ... })
 */
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>,
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return fromAppError(error);
      }
      console.error("[API Error]", error);
      return apiError("An unexpected error occurred", 500, "INTERNAL_ERROR");
    }
  };
}
