"use server";

import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { requireSession } from "@/lib/auth/session";
import { AppError, NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
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
// The investor picks a payment option — bank, cheque, cash, or a combination of
// two (bank + cash, bank + cheque, cheque + cash). Each part is one submission
// row; the parts share a batchId and finance reviews the batch as a whole.

export type PaymentPartInput = {
  paymentMethod: string;
  amountBdt: number;
  bankAccountId?: string | null;   // projectBankAccount id — required for BANK_TRANSFER
  cashReceivedBy?: string | null;  // required for CASH
  transactionRef?: string;         // optional for CASH
  proofFileUrl?: string;           // optional for CASH
  proofMimeType?: string;
  notes?: string;
};

export async function submitPaymentPartsAction(data: {
  investmentId: string;
  parts: PaymentPartInput[];
}): Promise<ActionResult<{ batchId: string; submissionIds: string[] }>> {
  try {
    const session = await requireSession();
    const { getPaymentProgress } = await import("@/server/services/payment-progress");
    const { PAYMENT_METHODS, MAX_PAYMENT_PARTS, CASH_RECEIVERS, METHOD_META, toPaisa } = await import(
      "@/lib/payments/split-payment"
    );

    const investment = await db.investment.findUnique({
      where: { id: data.investmentId },
      select: { id: true, status: true, projectId: true, investorProfile: { select: { userId: true } } },
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

    const parts = data.parts ?? [];
    if (parts.length === 0) throw new ValidationError("Choose a payment option");
    if (parts.length > MAX_PAYMENT_PARTS) throw new ValidationError(`A payment can combine at most ${MAX_PAYMENT_PARTS} methods`);
    if (new Set(parts.map((p) => p.paymentMethod)).size !== parts.length) {
      throw new ValidationError("Each method can appear only once in a combined payment");
    }

    const bankIds = new Set<string>();
    parts.forEach((p) => {
      const meta = METHOD_META[p.paymentMethod];
      const n = parts.length > 1 ? `${meta?.label ?? "Payment"}: ` : "";
      if (!(PAYMENT_METHODS as readonly string[]).includes(p.paymentMethod)) throw new ValidationError("Choose a valid payment method");
      if (!(p.amountBdt > 0)) throw new ValidationError(`${n}amount must be greater than 0`);
      if (meta.refRequired && !p.transactionRef?.trim()) throw new ValidationError(`${n}${meta.refLabel.toLowerCase()} is required`);
      if (meta.proofRequired && !p.proofFileUrl?.trim()) throw new ValidationError(`${n}proof file is required`);
      if (p.paymentMethod === "BANK_TRANSFER") {
        if (!p.bankAccountId) throw new ValidationError(`${n}select the bank account you paid into`);
        bankIds.add(p.bankAccountId);
      }
      if (p.paymentMethod === "CASH" && !CASH_RECEIVERS.some((r) => r.value === p.cashReceivedBy)) {
        throw new ValidationError(`${n}select who received the cash`);
      }
    });

    if (bankIds.size > 0) {
      const valid = await db.projectBankAccount.count({
        where: { id: { in: [...bankIds] }, projectId: investment.projectId, isActive: true },
      });
      if (valid !== bankIds.size) throw new ValidationError("Invalid bank account selected");
    }

    const batchId = crypto.randomUUID();

    const submissionIds = await db.$transaction(async (tx) => {
      // The batch must cover exactly what is still owed (amount − approved − under review).
      const progress = await getPaymentProgress(data.investmentId, tx);
      const partsTotal = parts.reduce((s, p) => s + toPaisa(p.amountBdt), 0);
      if (toPaisa(progress.outstanding) === 0) {
        throw new ValidationError("A payment for the full amount is already under review");
      }
      if (partsTotal !== toPaisa(progress.outstanding)) {
        throw new ValidationError(
          `The amounts must add up to ৳${progress.outstanding.toLocaleString("en-BD")} (you entered ৳${(partsTotal / 100).toLocaleString("en-BD")})`,
        );
      }

      const ids: string[] = [];
      for (const p of parts) {
        const row = await tx.manualPaymentSubmission.create({
          data: {
            investmentId: data.investmentId,
            submittedBy: session.id,
            batchId,
            amountBdt: toPaisa(p.amountBdt) / 100,
            bankAccountId: p.paymentMethod === "BANK_TRANSFER" ? p.bankAccountId ?? null : null,
            cashReceivedBy: p.paymentMethod === "CASH" ? p.cashReceivedBy ?? null : null,
            paymentMethod: p.paymentMethod,
            transactionRef: p.transactionRef?.trim() || (p.paymentMethod === "CASH" ? "CASH" : ""),
            proofFileUrl: p.proofFileUrl?.trim() ?? "",
            proofMimeType: p.proofMimeType ?? "",
            notes: p.notes?.trim() || null,
          },
          select: { id: true },
        });
        ids.push(row.id);
      }
      return ids;
    }, { timeout: 15000 });

    const financeUsers = await db.user.findMany({
      where: { role: { in: ["FINANCE_OFFICER", "ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
      select: { id: true },
    });
    if (financeUsers.length > 0) {
      const label = parts.map((p) => METHOD_META[p.paymentMethod]?.label ?? p.paymentMethod).join(" + ");
      await db.notification.createMany({
        data: financeUsers.map((u) => ({
          userId: u.id,
          type: "PAYMENT_RECEIVED" as const,
          title: `New Payment Submission (${label})`,
          body: `An investor has submitted a ${label} payment for investment ${data.investmentId}. Please review.`,
          data: { batchId, submissionIds, investmentId: data.investmentId },
        })),
      });
    }

    revalidatePath("/dashboard/investments");
    revalidatePath("/admin/payments/manual");
    return { success: true, data: { batchId, submissionIds } };
  } catch (e) { return svcErr(e); }
}

/** Single-method payment covering everything still owed. */
export async function submitManualPaymentAction(data: {
  investmentId: string;
  bankAccountId?: string | null;
  paymentMethod: string;
  transactionRef: string;
  proofFileUrl: string;
  proofMimeType: string;
  notes?: string;
}): Promise<ActionResult<{ submissionId: string }>> {
  try {
    const { getPaymentProgress } = await import("@/server/services/payment-progress");
    const { outstanding } = await getPaymentProgress(data.investmentId);
    const result = await submitPaymentPartsAction({
      investmentId: data.investmentId,
      parts: [{ ...data, amountBdt: outstanding }],
    });
    if (!result.success) return result;
    return { success: true, data: { submissionId: result.data.submissionIds[0] } };
  } catch (e) { return svcErr(e); }
}

// ─── Finance Officer / Admin: Review a payment batch ─────────────────────────
// Approving or rejecting any part acts on its whole batch (all parts submitted
// together). The investment activates once approved payments cover its amount.

/** Pending submission ids in the same batch as `submissionId` (legacy rows are their own batch). */
async function pendingBatchIds(submissionId: string) {
  const sub = await db.manualPaymentSubmission.findUnique({
    where: { id: submissionId },
    select: { id: true, status: true, batchId: true, investmentId: true, submittedBy: true },
  });
  if (!sub) throw new NotFoundError("Submission");
  if (!["SUBMITTED", "UNDER_REVIEW"].includes(sub.status)) {
    throw new ValidationError(`Submission is already ${sub.status}`);
  }
  const rows = sub.batchId
    ? await db.manualPaymentSubmission.findMany({
        where: { batchId: sub.batchId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        select: { id: true, amountBdt: true, transactionRef: true },
      })
    : [{ id: sub.id, ...(await db.manualPaymentSubmission.findUniqueOrThrow({ where: { id: sub.id }, select: { amountBdt: true, transactionRef: true } })) }];
  return { sub, rows };
}

export async function approveManualPaymentAction(
  submissionId: string,
): Promise<ActionResult<{ receiptNumber: string | null; activated: boolean; message: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);
    const { getPaymentProgress } = await import("@/server/services/payment-progress");
    const { toPaisa } = await import("@/lib/payments/split-payment");

    const { sub, rows } = await pendingBatchIds(submissionId);
    const batchIds = rows.map((r) => r.id);
    const batchBdt = rows.reduce((s, r) => s + Number(r.amountBdt), 0);

    const inv = await db.investment.findUnique({
      where: { id: sub.investmentId },
      select: {
        id: true,
        status: true,
        amountBdt: true,
        projectId: true,
        investorProfile: { select: { userId: true, user: { select: { id: true } } } },
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
    const fmt = (n: number) => `৳${n.toLocaleString("en-BD")}`;

    // Would this batch complete the payment? Checked again inside the transaction.
    const before = await getPaymentProgress(inv.id);
    if (toPaisa(before.approved) + toPaisa(batchBdt) >= toPaisa(amountBdt)) {
      const remaining = Number(inv.project.fundingGoalBdt) - Number(inv.project.fundedAmountBdt);
      if (amountBdt > remaining) {
        throw new ValidationError("Project capacity exceeded. Cannot approve this investment.");
      }
    }

    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    const receiptNumber = `BC-${ts}-${rand}`;

    const activated = await db.$transaction(async (tx) => {
      const claimed = await tx.manualPaymentSubmission.updateMany({
        where: { id: { in: batchIds }, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
        data: { status: "APPROVED", reviewedBy: session.id, reviewedAt: now },
      });
      if (claimed.count !== batchIds.length) throw new ValidationError("This payment was already reviewed");

      const progress = await getPaymentProgress(inv.id, tx);
      if (!progress.isFullyApproved) {
        await tx.notification.create({
          data: {
            userId: investorUserId,
            type: "PAYMENT_RECEIVED",
            title: "Payment Verified",
            body: `${fmt(batchBdt)} of your ${fmt(amountBdt)} investment in ${inv.project.title} has been verified. ${fmt(amountBdt - progress.approved)} is still to be paid.`,
            data: { investmentId: inv.id, submissionIds: batchIds },
          },
        });
        return false;
      }

      // Fully paid — activate investment + increment project funded amount atomically
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
      const refs = progress.parts.filter((p) => p.status === "APPROVED").map((p) => p.transactionRef).join(", ");
      await tx.payment.updateMany({
        where: {
          wallet: { userId: investorUserId },
          status: "PENDING",
          direction: "INBOUND",
          amountBdt: inv.amountBdt,
        },
        data: { status: "COMPLETED", externalReference: refs.slice(0, 255), processedAt: now },
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
          body: `Your payment has been verified. Your investment is now active. Receipt: ${receiptNumber}`,
          data: { investmentId: inv.id, receiptNumber },
        },
      });
      return true;
    }, { timeout: 15000 });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/payments/manual");
    revalidatePath("/admin/investments");
    revalidatePath("/dashboard/investments");

    if (!activated) {
      const progressNow = await getPaymentProgress(inv.id);
      return {
        success: true,
        data: {
          receiptNumber: null,
          activated: false,
          message: `Approved — ${fmt(progressNow.approved)} of ${fmt(amountBdt)} verified`,
        },
      };
    }

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
      metadata: { approvedBy: session.id, transactionRef: rows.map((r) => r.transactionRef).join(", ") },
    });

    // Generate receipt PDF after the response is sent. A bare un-awaited promise
    // gets killed when the serverless function freezes, so use after().
    after(() =>
      documentService
        .generateInvestmentDocuments(inv.id)
        .catch((err) => console.error("[approveManualPayment] document generation failed:", err)),
    );

    return {
      success: true,
      data: { receiptNumber, activated: true, message: `Approved — investment active. Receipt: ${receiptNumber}` },
    };
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

    const { sub, rows } = await pendingBatchIds(submissionId);

    await db.manualPaymentSubmission.updateMany({
      where: { id: { in: rows.map((r) => r.id) }, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
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
        userId: sub.submittedBy,
        type: "PAYMENT_FAILED",
        title: "Payment Proof Rejected",
        body: `Your payment was rejected. Reason: ${reason}. Please resubmit with correct details.`,
        data: { investmentId: sub.investmentId, submissionId },
      },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/payments/manual");
    revalidatePath("/dashboard/investments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function markUnderReviewAction(submissionId: string): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const { rows } = await pendingBatchIds(submissionId);
    await db.manualPaymentSubmission.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { status: "UNDER_REVIEW", reviewedBy: session.id },
    });

    revalidatePath("/admin/payments");
    revalidatePath("/admin/payments/manual");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}
