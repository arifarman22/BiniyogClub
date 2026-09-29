"use server";

import { db } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { AppError, NotFoundError, ValidationError, ForbiddenError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";

function svcErr<T>(e: unknown): ActionResult<T> {
  if (e instanceof AppError) return { success: false, error: e.message, code: e.code };
  console.error("[group-investment action]", e);
  return { success: false, error: "An unexpected error occurred." };
}

function receiptNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `GRP-${ts}-${rand}`;
}

// ─── Investor: express interest / create group investment ─────────────────────

export async function createGroupInvestmentAction(data: {
  tierId: string;
  amountBdt: number;
  plotNumber?: string;
  sharePercentage?: number;
  notes?: string;
}): Promise<ActionResult<{ groupInvestmentId: string }>> {
  try {
    const session = await requireSession();

    // KYC check
    const kyc = await db.kyc.findUnique({
      where: { userId: session.id },
      select: { status: true },
    });
    if (!kyc || kyc.status !== "VERIFIED") {
      throw new ValidationError(
        "KYC verification required. Please complete and get your KYC approved before investing.",
      );
    }

    const tier = await db.groupTier.findUnique({
      where: { id: data.tierId },
      select: { id: true, isActive: true, minAmountBdt: true, maxAmountBdt: true, type: true, availableUnits: true },
    });
    if (!tier || !tier.isActive) throw new NotFoundError("Tier");

    if (data.amountBdt < Number(tier.minAmountBdt)) {
      throw new ValidationError(`Minimum investment is ৳${Number(tier.minAmountBdt).toLocaleString("en-BD")}`);
    }
    if (tier.maxAmountBdt && data.amountBdt > Number(tier.maxAmountBdt)) {
      throw new ValidationError(`Maximum investment is ৳${Number(tier.maxAmountBdt).toLocaleString("en-BD")}`);
    }
    if (tier.type === "PLOT_BOOKING" && tier.availableUnits !== null && tier.availableUnits <= 0) {
      throw new ValidationError("No plots available at this time");
    }

    // Check no active investment in same tier
    const existing = await db.groupInvestment.findFirst({
      where: { tierId: data.tierId, investorUserId: session.id, status: { notIn: ["CANCELLED"] } },
      select: { id: true },
    });
    if (existing) throw new ValidationError("You already have an active investment in this tier");

    const inv = await db.groupInvestment.create({
      data: {
        tierId: data.tierId,
        investorUserId: session.id,
        status: "PAYMENT_PENDING",
        amountBdt: data.amountBdt,
        plotNumber: data.plotNumber,
        sharePercentage: data.sharePercentage,
        notes: data.notes,
      },
      select: { id: true },
    });

    revalidatePath("/dashboard/groups");
    return { success: true, data: { groupInvestmentId: inv.id } };
  } catch (e) { return svcErr(e); }
}

// ─── Investor: submit payment proof ──────────────────────────────────────────

export async function submitGroupPaymentProofAction(data: {
  groupInvestmentId: string;
  bankAccountId: string;
  transactionRef: string;
  proofFileUrl: string;
  proofMimeType: string;
  notes?: string;
}): Promise<ActionResult<{ submissionId: string }>> {
  try {
    const session = await requireSession();

    const inv = await db.groupInvestment.findUnique({
      where: { id: data.groupInvestmentId },
      select: { id: true, status: true, amountBdt: true, investorUserId: true },
    });
    if (!inv) throw new NotFoundError("Group investment");
    if (inv.investorUserId !== session.id) throw new ForbiddenError("Access denied");
    if (inv.status !== "PAYMENT_PENDING") {
      throw new ValidationError(`Cannot submit proof for investment in status: ${inv.status}`);
    }

    const existing = await db.groupInvestmentPayment.findFirst({
      where: { groupInvestmentId: data.groupInvestmentId, status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
      select: { id: true },
    });
    if (existing) throw new ValidationError("A proof submission is already pending review");

    const submission = await db.groupInvestmentPayment.create({
      data: {
        groupInvestmentId: data.groupInvestmentId,
        submittedBy: session.id,
        amountBdt: Number(inv.amountBdt),
        bankAccountId: data.bankAccountId,
        transactionRef: data.transactionRef.trim(),
        proofFileUrl: data.proofFileUrl,
        proofMimeType: data.proofMimeType,
        notes: data.notes?.trim() || null,
      },
      select: { id: true },
    });

    // Notify finance team
    const financeUsers = await db.user.findMany({
      where: { role: { in: ["FINANCE_OFFICER", "ADMIN", "SUPER_ADMIN"] }, status: "ACTIVE" },
      select: { id: true },
    });
    if (financeUsers.length > 0) {
      await db.notification.createMany({
        data: financeUsers.map((u) => ({
          userId: u.id,
          type: "PAYMENT_RECEIVED" as const,
          title: "New Group Investment Payment Proof",
          body: `Payment proof submitted for group investment ${data.groupInvestmentId}`,
          data: { submissionId: submission.id, groupInvestmentId: data.groupInvestmentId },
        })),
      });
    }

    revalidatePath("/dashboard/groups");
    return { success: true, data: { submissionId: submission.id } };
  } catch (e) { return svcErr(e); }
}

// ─── Admin: approve group investment payment ──────────────────────────────────

export async function approveGroupPaymentAction(
  submissionId: string,
): Promise<ActionResult<{ receiptNumber: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    const submission = await db.groupInvestmentPayment.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true, groupInvestmentId: true, submittedBy: true },
    });
    if (!submission) throw new NotFoundError("Submission");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
      throw new ValidationError(`Submission is already ${submission.status}`);
    }

    const receipt = receiptNumber();
    const now = new Date();

    await db.$transaction([
      db.groupInvestmentPayment.update({
        where: { id: submissionId },
        data: { status: "APPROVED", reviewedBy: session.id, reviewedAt: now },
      }),
      db.groupInvestment.update({
        where: { id: submission.groupInvestmentId },
        data: { status: "ACTIVE", confirmedAt: now, receiptNumber: receipt },
      }),
    ]);

    // Notify investor
    await db.notification.create({
      data: {
        userId: submission.submittedBy,
        type: "INVESTMENT_CONFIRMED",
        title: "Group Investment Confirmed",
        body: `Your group investment payment has been verified and is now active. Receipt: ${receipt}`,
        data: { groupInvestmentId: submission.groupInvestmentId, receiptNumber: receipt },
      },
    });

    revalidatePath("/admin/groups");
    revalidatePath("/dashboard/groups");
    return { success: true, data: { receiptNumber: receipt } };
  } catch (e) { return svcErr(e); }
}

export async function rejectGroupPaymentAction(
  submissionId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PAYMENT_VERIFY);

    if (!reason?.trim()) return { success: false, error: "Rejection reason is required" };

    const submission = await db.groupInvestmentPayment.findUnique({
      where: { id: submissionId },
      select: { id: true, status: true, submittedBy: true, groupInvestmentId: true },
    });
    if (!submission) throw new NotFoundError("Submission");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(submission.status)) {
      throw new ValidationError(`Submission is already ${submission.status}`);
    }

    await db.groupInvestmentPayment.update({
      where: { id: submissionId },
      data: { status: "REJECTED", reviewedBy: session.id, reviewedAt: new Date(), rejectionReason: reason.trim() },
    });

    await db.notification.create({
      data: {
        userId: submission.submittedBy,
        type: "PAYMENT_FAILED",
        title: "Group Investment Proof Rejected",
        body: `Your payment proof was rejected. Reason: ${reason}. Please resubmit.`,
        data: { groupInvestmentId: submission.groupInvestmentId },
      },
    });

    revalidatePath("/admin/groups");
    revalidatePath("/dashboard/groups");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function cancelGroupInvestmentAction(
  groupInvestmentId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();

    const inv = await db.groupInvestment.findUnique({
      where: { id: groupInvestmentId },
      select: { id: true, status: true, investorUserId: true },
    });
    if (!inv) throw new NotFoundError("Group investment");
    if (inv.investorUserId !== session.id) throw new ForbiddenError("Access denied");
    if (!["PENDING", "PAYMENT_PENDING"].includes(inv.status)) {
      throw new ValidationError("Cannot cancel an active or completed investment");
    }

    await db.groupInvestment.update({
      where: { id: groupInvestmentId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    revalidatePath("/dashboard/groups");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}
