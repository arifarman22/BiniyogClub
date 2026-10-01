"use server";

import { walletService } from "@/server/services/wallet.service";
import {
  depositSchema,
  withdrawalRequestSchema,
  approveWithdrawalSchema,
  adjustmentSchema,
} from "@/validations/wallet";
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
  console.error("[wallet action]", error);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Actions ──────────────────────────────────────────────────────────────────

export async function recordDepositAction(
  formData: unknown,
): Promise<ActionResult<{ paymentId: string }>> {
  const parsed = depositSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const { payment } = await walletService.recordDeposit(session, parsed.data);
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/transactions");
    return { success: true, data: { paymentId: payment.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function requestWithdrawalAction(
  formData: unknown,
): Promise<ActionResult<{ withdrawalId: string }>> {
  const parsed = withdrawalRequestSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const { withdrawal } = await walletService.requestWithdrawal(session, parsed.data);
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/transactions");
    return { success: true, data: { withdrawalId: withdrawal.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function cancelWithdrawalAction(
  withdrawalId: string,
): Promise<ActionResult<void>> {
  if (!withdrawalId) return { success: false, error: "Withdrawal ID required" };
  try {
    const session = await requireSession();
    await walletService.cancelWithdrawal(session, withdrawalId);
    revalidatePath("/dashboard/wallet");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function approveWithdrawalAction(
  formData: unknown,
): Promise<ActionResult<void>> {
  const parsed = approveWithdrawalSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await walletService.approveWithdrawal(session, parsed.data);
    revalidatePath("/admin/withdrawals");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function completeWithdrawalAction(
  withdrawalId: string,
): Promise<ActionResult<void>> {
  if (!withdrawalId) return { success: false, error: "Withdrawal ID required" };

  try {
    const session = await requireSession();
    await walletService.completeWithdrawal(session, withdrawalId);
    revalidatePath("/admin/withdrawals");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function rejectWithdrawalAction(
  withdrawalId: string,
  reason: string,
): Promise<ActionResult<void>> {
  if (!withdrawalId || !reason) {
    return { success: false, error: "Withdrawal ID and reason required" };
  }

  try {
    const session = await requireSession();
    await walletService.rejectWithdrawal(session, withdrawalId, reason);
    revalidatePath("/admin/withdrawals");
    revalidatePath("/dashboard/wallet");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function adjustBalanceAction(
  formData: unknown,
): Promise<ActionResult<void>> {
  const parsed = adjustmentSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await walletService.adjustBalance(session, parsed.data);
    revalidatePath("/admin/wallets");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

export async function reconcileWalletAction(): Promise<
  ActionResult<{ trueBalance: number; cachedBalance: number; discrepancy: number; isBalanced: boolean }>
> {
  try {
    const session = await requireSession();
    const result = await walletService.reconcile(session);
    return { success: true, data: result };
  } catch (error) {
    return serviceError(error);
  }
}
