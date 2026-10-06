"use server";

import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { requireSession } from "@/lib/auth/session";
import { AppError, NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { documentService } from "@/server/services/document.service";
import type { ActionResult } from "./auth.actions";

function svcErr<T>(e: unknown): ActionResult<T> {
  if (e instanceof AppError) return { success: false, error: e.message, code: e.code };
  const msg = e instanceof Error ? e.message : String(e);
  console.error("[manual-payment action]", e);
  return { success: false, error: msg };
}

// ─── Bank Account Management (Admin / Finance Officer) ────────────────────────

export async function createBankAccountAction(data: {
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  branchName?: string;
  swiftCode?: string;
  iban?: string;
  mobileNumber?: string;
  email?: string;
  branchAddress?: string;
  instructions?: string;
  isDefault?: boolean;
  displayOrder?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    if (!data.bankName?.trim() || !data.accountName?.trim() || !data.accountNumber?.trim()) {
      return { success: false, error: "Bank name, account name, and account number are required" };
    }

    // If setting as default, unset all others first
    if (data.isDefault) {
      await db.bankAccount.updateMany({ data: { isDefault: false } });
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
    swiftCode?: string;
    iban?: string;
    mobileNumber?: string;
    email?: string;
    branchAddress?: string;
    instructions?: string;
    isActive?: boolean;
    isDefault?: boolean;
    displayOrder?: number;
  },
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const account = await db.bankAccount.findUnique({ where: { id }, select: { id: true } });
    if (!account) throw new NotFoundError("Bank account");

    // If setting as default, unset all others first
    if (data.isDefault) {
      await db.bankAccount.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
    }

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
  bankAccountId?: string | null;  // projectBankAccount id — optional for non-bank-transfer
  paymentMethod: string;
  transactionRef: string;
  proofFileUrl: string;
  proofMimeType: string;
  notes?: string;
}): Promise<ActionResult<{ submissionId: string }>> {
  try {
    const session = await requireSession();

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

    const existing = await db.manualPaymentSubmission.findFirst({
      where: { investmentId: data.investmentId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      select: { id: true },
    });
    if (existing) {
      throw new ValidationError("A payment proof submission is already pending review for this investment");
    }

    // For bank transfer, validate the selected project bank account
    if (data.paymentMethod === "BANK_TRANSFER") {
      if (!data.bankAccountId) throw new ValidationError("Please select a bank account for bank transfer");
      const bankAccount = await db.projectBankAccount.findUnique({
        where: { id: data.bankAccountId },
        select: { id: true, isActive: true },
      });
      if (!bankAccount || !bankAccount.isActive) throw new ValidationError("Invalid bank account selected");
    }

    if (!data.transactionRef?.trim()) throw new ValidationError("Transaction reference is required");
    if (!data.proofFileUrl?.trim()) throw new ValidationError("Payment proof file is required");

    const submission = await db.manualPaymentSubmission.create({
      data: {
        investmentId: data.investmentId,
        submittedBy: session.id,
        amountBdt: Number(investment.amountBdt),
        bankAccountId: data.bankAccountId ?? null,
        paymentMethod: data.paymentMethod,
        transactionRef: data.transactionRef.trim(),
        proofFileUrl: data.proofFileUrl,
        proofMimeType: data.proofMimeType,
        notes: data.notes?.trim() || null,
      },
      select: { id: true },
    });

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
        amountBdt: true,
      },
    });
    if (!submission) throw new NotFoundError("Submission");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
      throw new ValidationError(`Submission is already ${submission.status}`);
    }

    const inv = await db.investment.findUnique({
      where: { id: submission.investmentId },
      select: {
        id: true,
        status: true,
        amountBdt: true,
        projectId: true,
        investorProfile: {
          select: {
            userId: true,
            user: { select: { id: true } },
          },
        },
        project: { select: { title: true, fundingGoalBdt: true, fundedAmountBdt: true, status: true } },
      },
    });
    if (!inv) throw new NotFoundError("Investment");
    if (inv.status !== "PAYMENT_PENDING") {
      throw new ValidationError(`Investment must be PAYMENT_PENDING to approve (current: ${inv.status})`);
    }

    const amountBdt = Number(inv.amountBdt);
    const investorUserId = inv.investorProfile.user.id;
    const now = new Date();

    // Check project capacity
    const remaining = Number(inv.project.fundingGoalBdt) - Number(inv.project.fundedAmountBdt);
    if (amountBdt > remaining) {
      throw new ValidationError("Project capacity exceeded. Cannot approve this investment.");
    }

    // Generate receipt
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const receiptNumber = `BC-${ts}-${rand}`;

    // Activate investment + increment project funded amount atomically
    await db.$transaction(async (tx) => {
      await tx.investment.update({
        where: { id: inv.id },
        data: { status: "ACTIVE", confirmedAt: now, activatedAt: now, receiptNumber },
      });

      const updatedProject = await tx.project.update({
        where: { id: inv.projectId },
        data: { fundedAmountBdt: { increment: amountBdt } },
        select: { status: true, fundingGoalBdt: true, fundedAmountBdt: true },
      });
      if (
        Number(updatedProject.fundedAmountBdt) >= Number(updatedProject.fundingGoalBdt) &&
        updatedProject.status === "FUNDRAISING"
      ) {
        await tx.project.update({ where: { id: inv.projectId }, data: { status: "FUNDED" } });
      }

      // Mark the pending payment record as completed
      await tx.payment.updateMany({
        where: {
          wallet: { userId: investorUserId },
          status: "PENDING",
          direction: "INBOUND",
          amountBdt: inv.amountBdt,
        },
        data: { status: "COMPLETED", externalReference: submission.transactionRef, processedAt: now },
      });

      await tx.manualPaymentSubmission.update({
        where: { id: submissionId },
        data: { status: "APPROVED", reviewedBy: session.id, reviewedAt: now },
      });

      await tx.investmentContract.upsert({
        where: { investmentId: inv.id },
        create: {
          investmentId: inv.id,
          status: "DRAFT",
          templateVersion: "v1.0",
          terms: {
            amountBdt,
            projectTitle: inv.project.title,
            investorId: investorUserId,
            activatedAt: now.toISOString(),
          },
        },
        update: {},
      });

      await tx.notification.create({
        data: {
          userId: investorUserId,
          type: "INVESTMENT_CONFIRMED",
          title: "Payment Verified — Investment Active",
          body: `Your manual payment has been verified. Your investment is now active. Receipt: ${receiptNumber}`,
          data: { investmentId: inv.id, receiptNumber },
        },
      });
    }, { timeout: 15000 });

    // Post INVESTMENT_FUNDING ledger entry outside the transaction.
    // For manual (external) payments the money arrives from outside the platform,
    // so we debit PLATFORM_REVENUE (external inflow contra) and credit PLATFORM_ESCROW
    // — the same pattern as a deposit credit, but routed to escrow since it is
    // an investment commitment, not a wallet top-up.
    const { ledgerService } = await import("@/server/services/ledger.service");
    const { generateIdempotencyKey, IDEMPOTENCY_PREFIXES } = await import("@/lib/financial/idempotency");
    await ledgerService.recordInvestmentFundingExternal(amountBdt, {
      investmentId: inv.id,
      idempotencyKey: generateIdempotencyKey(IDEMPOTENCY_PREFIXES.INVESTMENT),
      projectTitle: inv.project.title,
      metadata: { approvedBy: session.id, transactionRef: submission.transactionRef },
    });

    // Generate receipt PDF (fire-and-forget)
    documentService
      .generateInvestmentReceipt(submission.investmentId)
      .catch((err) => console.error("[approveManualPayment] receipt generation failed:", err));

    revalidatePath("/admin/payments");
    revalidatePath("/admin/payments/manual");
    revalidatePath("/admin/investments");
    revalidatePath("/dashboard/investments");
    return { success: true, data: { receiptNumber } };
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
