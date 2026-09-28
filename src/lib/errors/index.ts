export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "RATE_LIMITED";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly statusCode: number = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Authentication required") {
    super("UNAUTHORIZED", message, 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Insufficient permissions") {
    super("FORBIDDEN", message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super("NOT_FOUND", `${resource} not found`, 404);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super("CONFLICT", message, 409);
    this.name = "ConflictError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super("VALIDATION_ERROR", message, 422);
    this.name = "ValidationError";
  }
}

export class EmailNotVerifiedError extends AppError {
  constructor() {
    super("EMAIL_NOT_VERIFIED", "Please verify your email address before continuing", 403);
    this.name = "EmailNotVerifiedError";
  }
}

export class InvalidTokenError extends AppError {
  constructor() {
    super("INVALID_TOKEN", "Invalid or expired token", 400);
    this.name = "InvalidTokenError";
  }
}
