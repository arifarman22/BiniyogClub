"use server";

import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { requireSession } from "@/lib/auth/session";
import { AppError, NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { investmentService } from "@/server/services/investment.service";
import type { ActionResult } from "./auth.actions";

function svcErr<T>(e: unknown): ActionResult<T> {
  if (e instanceof AppError) return { success: false, error: e.message, code: e.code };
  console.error("[manual-payment action]", e);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Bank Account Management (Admin / Finance Officer) ────────────────────────

export async function createBankAccountAction(data: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  branchName?: string;
  instructions?: string;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    if (!data.bankName?.trim() || !data.accountName?.trim() || !data.accountNumber?.trim()) {
      return { success: false, error: "Bank name, account name, and account number are required" };
    }

    const account = await db.bankAccount.create({
      data: { ...data, createdBy: session.id },
      select: { id: true },
    });

    revalidatePath("/admin/payments");
    return { success: true, data: { id: account.id } };
  } catch (e) { return svcErr(e); }
}

export async function updateBankAccountAction(
  id: string,
  data: {
    bankName?: string;
    accountName?: string;
    accountNumber?: string;
    routingNumber?: string;
    branchName?: string;
    instructions?: string;
    isActive?: boolean;
  },
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const account = await db.bankAccount.findUnique({ where: { id }, select: { id: true } });
    if (!account) throw new NotFoundError("Bank account");

    await db.bankAccount.update({ where: { id }, data });
    revalidatePath("/admin/payments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function deleteBankAccountAction(id: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    await db.bankAccount.update({ where: { id }, data: { isActive: false } });
    revalidatePath("/admin/payments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

// ─── Investor: Submit Proof of Payment ───────────────────────────────────────

export async function submitManualPaymentAction(data: {
  investmentId: string;
  bankAccountId: string;
  transactionRef: string;
  proofFileUrl: string;
  proofMimeType: string;
  notes?: string;
}): Promise<ActionResult<{ submissionId: string }>> {
  try {
    const session = await requireSession();

    // Verify investment belongs to this investor and is in PAYMENT_PENDING
    const investment = await db.investment.findUnique({
      where: { id: data.investmentId },
      select: {
        id: true,
        status: true,
        amountBdt: true,
        investorProfile: { select: { userId: true } },
      },
    });

    if (!investment) throw new NotFoundError("Investment");
    if (investment.investorProfile.userId !== session.id) {
      throw new ForbiddenError("You do not have access to this investment");
    }
    if (investment.status !== "PAYMENT_PENDING") {
      throw new ValidationError(
        `Investment must be in PAYMENT_PENDING status to submit payment proof (current: ${investment.status})`,
      );
    }

    // Check no pending submission already exists
    const existing = await db.manualPaymentSubmission.findFirst({
      where: {
        investmentId: data.investmentId,
        status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
      },
      select: { id: true },
    });
    if (existing) {
      throw new ValidationError("A payment proof submission is already pending review for this investment");
    }

    const bankAccount = await db.bankAccount.findUnique({
      where: { id: data.bankAccountId },
      select: { id: true, isActive: true },
    });
    if (!bankAccount || !bankAccount.isActive) {
      throw new ValidationError("Invalid bank account selected");
    }

    if (!data.transactionRef?.trim()) {
      throw new ValidationError("Transaction reference is required");
    }
    if (!data.proofFileUrl?.trim()) {
      throw new ValidationError("Payment proof file is required");
    }

    const submission = await db.manualPaymentSubmission.create({
      data: {
        investmentId: data.investmentId,
        submittedBy: session.id,
        amountBdt: Number(investment.amountBdt),
        bankAccountId: data.bankAccountId,
        transactionRef: data.transactionRef.trim(),
        proofFileUrl: data.proofFileUrl,
        proofMimeType: data.proofMimeType,
        notes: data.notes?.trim() || null,
      },
      select: { id: true },
    });

    // Notify finance officers
    const financeUsers = await db.user.findMany({
      where: { role: { in: ["FINANCE_OFFICER", "ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
      select: { id: true },
    });
    if (financeUsers.length > 0) {
      await db.notification.createMany({
        data: financeUsers.map((u) => ({
          userId: u.id,
          type: "PAYMENT_RECEIVED" as const,
          title: "New Manual Payment Submission",
          body: `An investor has submitted payment proof for investment ${data.investmentId}. Please review.`,
          data: { submissionId: submission.id, investmentId: data.investmentId },
        })),
      });
    }

    revalidatePath("/dashboard/investments");
    return { success: true, data: { submissionId: submission.id } };
  } catch (e) { return svcErr(e); }
}

// ─── Finance Officer: Review Submission ──────────────────────────────────────

export async function approveManualPaymentAction(
  submissionId: string,
): Promise<ActionResult<{ receiptNumber: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const submission = await db.manualPaymentSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        status: true,
        investmentId: true,
        submittedBy: true,
        transactionRef: true,
      },
    });
    if (!submission) throw new NotFoundError("Submission");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
      throw new ValidationError(`Submission is already ${submission.status}`);
    }

    // Confirm the investment first — if this fails, submission stays reviewable
    const result = await investmentService.confirmPayment(session, {
      investmentId: submission.investmentId,
      externalReference: submission.transactionRef,
    });

    // Mark submission approved — non-fatal if this fails (investment is already confirmed)
    try {
      await db.manualPaymentSubmission.update({
        where: { id: submissionId },
        data: { status: "APPROVED", reviewedBy: session.id, reviewedAt: new Date() },
      });
    } catch (updateErr) {
      console.error("[approveManualPayment] Failed to mark submission APPROVED", updateErr);
    }

    // Notify investor — non-fatal
    try {
      const investment = await db.investment.findUnique({
        where: { id: submission.investmentId },
        select: { investorProfile: { select: { userId: true } } },
      });
      if (investment) {
        await db.notification.create({
          data: {
            userId: investment.investorProfile.userId,
            type: "INVESTMENT_CONFIRMED",
            title: "Payment Verified — Investment Active",
            body: `Your manual payment has been verified. Your investment is now active. Receipt: ${result.receiptNumber}`,
            data: { investmentId: submission.investmentId, receiptNumber: result.receiptNumber },
          },
        });
      }
    } catch (notifyErr) {
      console.error("[approveManualPayment] Failed to send investor notification", notifyErr);
    }

    revalidatePath("/admin/payments");
    revalidatePath("/dashboard/investments");
    return { success: true, data: { receiptNumber: result.receiptNumber } };
  } catch (e) { return svcErr(e); }
}

export async function rejectManualPaymentAction(
  submissionId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    if (!reason?.trim()) return { success: false, error: "Rejection reason is required" };

    const submission = await db.manualPaymentSubmission.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true, investmentId: true, submittedBy: true },
    });
    if (!submission) throw new NotFoundError("Submission");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
      throw new ValidationError(`Submission is already ${submission.status}`);
    }

    await db.manualPaymentSubmission.update({
      where: { id: submissionId },
      data: {
        status: "REJECTED",
        reviewedBy: session.id,
        reviewedAt: new Date(),
        rejectionReason: reason.trim(),
      },
    });

    // Notify investor so they can resubmit
    await db.notification.create({
      data: {
        userId: submission.submittedBy,
        type: "PAYMENT_FAILED",
        title: "Payment Proof Rejected",
        body: `Your payment proof was rejected. Reason: ${reason}. Please resubmit with correct details.`,
        data: { investmentId: submission.investmentId, submissionId },
      },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/dashboard/investments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function markUnderReviewAction(submissionId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    await db.manualPaymentSubmission.update({
      where: { id: submissionId },
      data: { status: "UNDER_REVIEW", reviewedBy: session.id },
    });

    revalidatePath("/admin/payments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}
