"use server";

import { investmentService } from "@/server/services/investment.service";
import {
  createInvestmentSchema,
  confirmPaymentSchema,
  cancelInvestmentSchema,
} from "@/validations/investment";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationError<T>(
  issues: { path: (string | number | symbol)[]; message: string }[],
): ActionResult<T> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path.join("."));
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    success: false,
    error: issues[0]?.message ?? "Validation failed",
    code: "VALIDATION_ERROR",
    fieldErrors,
  };
}

function serviceError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) return { success: false, error: error.message, code: error.code };
  console.error("[investment action]", error);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function createInvestmentAction(
  formData: unknown,
): Promise<ActionResult<{ investmentId: string; idempotent: boolean }>> {
  const parsed = createInvestmentSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const { investment, idempotent } = await investmentService.create(session, parsed.data);

    revalidatePath("/dashboard/investments");
    revalidatePath(`/projects/${parsed.data.projectId}`);

    return { success: true, data: { investmentId: investment.id, idempotent } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function initiatePaymentAction(
  investmentId: string,
  paymentMethod: string,
): Promise<ActionResult<{ paymentId: string }>> {
  if (!investmentId) return { success: false, error: "Investment ID required" };

  try {
    const session = await requireSession();
    const { payment } = await investmentService.initiatePayment(
      session,
      investmentId,
      paymentMethod,
    );

    revalidatePath("/dashboard/investments");
    revalidatePath("/dashboard/transactions");

    return { success: true, data: { paymentId: payment.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function confirmPaymentAction(
  formData: unknown,
): Promise<ActionResult<{ receiptNumber: string }>> {
  const parsed = confirmPaymentSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const result = await investmentService.confirmPayment(session, parsed.data);

    // Notify investor (fire-and-forget — failure must not affect the response)
    const inv = await investmentService.getById(session, parsed.data.investmentId);
    investmentService
      .notifyInvestor(inv.investorProfile.user.id, inv.id, result.receiptNumber)
      .catch((err) => console.error("[investment] notification failed:", err));

    revalidatePath("/dashboard/investments");
    revalidatePath("/dashboard/transactions");
    revalidatePath("/admin/projects");

    return { success: true, data: { receiptNumber: result.receiptNumber } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function cancelInvestmentAction(
  formData: unknown,
): Promise<ActionResult<void>> {
  const parsed = cancelInvestmentSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await investmentService.cancel(session, parsed.data);

    revalidatePath("/dashboard/investments");
    revalidatePath("/admin/projects");

    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function matureInvestmentAction(
  investmentId: string,
  actualReturnBdt: number,
): Promise<ActionResult<void>> {
  if (!investmentId) return { success: false, error: "Investment ID required" };

  try {
    const session = await requireSession();
    await investmentService.mature(session, investmentId, actualReturnBdt);

    revalidatePath("/admin/projects");
    revalidatePath("/dashboard/investments");

    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function completeInvestmentAction(
  investmentId: string,
): Promise<ActionResult<void>> {
  if (!investmentId) return { success: false, error: "Investment ID required" };

  try {
    const session = await requireSession();
    await investmentService.complete(session, investmentId);

    revalidatePath("/admin/projects");
    revalidatePath("/dashboard/investments");

    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}
