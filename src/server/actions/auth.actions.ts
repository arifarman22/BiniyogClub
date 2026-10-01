"use server";

import { authService } from "@/server/services/auth.service";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  otpSchema,
} from "@/validations/auth";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

// ─── Result type ──────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string; fieldErrors?: Record<string, string> };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationError(issues: { path: (string | number | symbol)[]; message: string }[]): ActionResult {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    success: false,
    error: issues[0]?.message ?? "Validation failed",
    code: "VALIDATION_ERROR",
    fieldErrors,
  };
}

function serviceError(error: unknown): ActionResult {
  if (error instanceof AppError) {
    return { success: false, error: error.message, code: error.code };
  }
  // Never leak internal error details to the client
  console.error("[action error]", error instanceof Error ? error.message : error);
  return { success: false, error: "An unexpected error occurred. Please try again." };
}

async function getRequestMeta() {
  const h = await headers();
  return {
    userAgent: h.get("user-agent") ?? undefined,
    ipAddress: (h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined)
      ?.split(",")[0]
      ?.trim(),
  };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function registerAction(formData: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { confirmPassword: _confirm, ...input } = parsed.data;
    await authService.register({ ...input, role: input.role as "INVESTOR" });
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function loginAction(formData: unknown): Promise<ActionResult<{ role: string }>> {
  const parsed = loginSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues) as ActionResult<{ role: string }>;

  try {
    const meta = await getRequestMeta();
    const user = await authService.login(parsed.data, meta);
    return { success: true, data: { role: user.role } };
  } catch (error) {
    return serviceError(error) as ActionResult<{ role: string }>;
  }
}

export async function logoutAction(): Promise<void> {
  await authService.logout();
  redirect("/auth/login");
}

export async function logoutAllAction(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    await authService.logoutAll(session.id);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function verifyEmailAction(token: string): Promise<ActionResult> {
  if (!token || typeof token !== "string") {
    return { success: false, error: "Invalid verification token", code: "INVALID_TOKEN" };
  }

  try {
    await authService.verifyEmail(token);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function resendVerificationEmailAction(): Promise<ActionResult> {
  try {
    const session = await requireSession();
    if (session.emailVerified) {
      return { success: false, error: "Email is already verified", code: "ALREADY_VERIFIED" };
    }
    await authService.sendVerificationEmail(session.id, session.email, session.name);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function forgotPasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  // Always succeed — prevents email enumeration
  await authService.sendPasswordReset(parsed.data.email).catch((err) =>
    console.error("[action] forgot password email failed:", err),
  );

  return { success: true, data: undefined };
}

export async function resetPasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    await authService.resetPassword(parsed.data.token, parsed.data.password);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function changePasswordAction(formData: unknown): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await authService.changePassword(
      session.id,
      parsed.data.currentPassword,
      parsed.data.newPassword,
    );
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function verifyOtpAction(userId: string, formData: unknown): Promise<ActionResult> {
  if (!userId || typeof userId !== "string") {
    return { success: false, error: "Invalid request", code: "VALIDATION_ERROR" };
  }

  const parsed = otpSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    await authService.verifyOtp(userId, parsed.data.otp);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}
