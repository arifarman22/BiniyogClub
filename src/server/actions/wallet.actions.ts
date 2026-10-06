"use server";

import { walletService } from "@/server/services/wallet.service";
import { documentService } from "@/server/services/document.service";
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

export async function submitDepositRequestAction(
  input: { walletId: string; amountBdt: number; paymentMethod: string; transactionRef: string; proofFileUrl: string },
): Promise<ActionResult<{ paymentId: string }>> {
  if (!input.walletId || !input.amountBdt || !input.transactionRef || !input.proofFileUrl) {
    return { success: false, error: "All fields are required" };
  }
  try {
    const session = await requireSession();
    const { db } = await import("@/lib/db/prisma");

    // Verify wallet belongs to session user
    const wallet = await db.wallet.findUnique({ where: { id: input.walletId }, select: { userId: true } });
    if (!wallet || wallet.userId !== session.id) return { success: false, error: "Wallet not found" };

    // Create a PENDING payment record — admin will confirm and post ledger entry
    const payment = await db.payment.create({
      data: {
        walletId: input.walletId,
        direction: "INBOUND",
        method: input.paymentMethod as "BANK_TRANSFER" | "MOBILE_BANKING" | "CARD" | "WALLET",
        status: "PENDING",
        amountBdt: input.amountBdt,
        feeBdt: 0,
        netAmountBdt: input.amountBdt,
        currency: "BDT",
        externalReference: input.transactionRef,
        description: `Deposit request — ${input.paymentMethod.replace("_", " ")}`,
        gatewayResponse: { proofFileUrl: input.proofFileUrl, transactionRef: input.transactionRef },
      },
      select: { id: true },
    });

    revalidatePath("/dashboard/wallet");
    return { success: true, data: { paymentId: payment.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function investFromWalletAction(
  input: { projectId: string; amountBdt: number; idempotencyKey: string },
): Promise<ActionResult<{ investmentId: string; receiptNumber: string }>> {
  if (!input.projectId || !input.amountBdt || !input.idempotencyKey) {
    return { success: false, error: "Invalid request" };
  }
  try {
    const session = await requireSession();
    const result = await walletService.investFromWallet(session, input);

    // Generate investment receipt PDF (fire-and-forget)
    documentService
      .generateInvestmentReceipt(result.investmentId)
      .catch((err) => console.error("[wallet invest] receipt generation failed:", err));

    revalidatePath("/dashboard/investments");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/transactions");
    return { success: true, data: { investmentId: result.investmentId, receiptNumber: result.receiptNumber } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function confirmDepositAction(
  paymentId: string,
): Promise<ActionResult<void>> {
  if (!paymentId) return { success: false, error: "Payment ID required" };
  try {
    const session = await requireSession();
    await walletService.confirmDeposit(session, paymentId);
    revalidatePath("/admin/deposits");
    revalidatePath("/admin/payments");
    revalidatePath("/dashboard/wallet");
    revalidatePath("/dashboard/deposits");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}
