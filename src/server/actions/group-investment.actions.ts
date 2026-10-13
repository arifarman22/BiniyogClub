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
      select: {
        id: true, isActive: true, minAmountBdt: true, maxAmountBdt: true, type: true, availableUnits: true,
        bankAccount: { select: { isActive: true } },
        entity: { select: { isActive: true, group: { select: { isActive: true } } } },
      },
    });
    if (!tier || !tier.isActive) throw new NotFoundError("Tier");
    if (!tier.entity.isActive) throw new ValidationError("This investment opportunity is not currently active.");
    if (!tier.entity.group.isActive) throw new ValidationError("This group is not currently active.");
    if (!tier.bankAccount?.isActive) {
      throw new ValidationError("Payment details for this tier are not available yet. Please check back soon.");
    }

    if (data.amountBdt < Number(tier.minAmountBdt)) {
      throw new ValidationError(`Minimum investment is ৳${Number(tier.minAmountBdt).toLocaleString("en-BD")}`);
    }
    if (tier.maxAmountBdt && data.amountBdt > Number(tier.maxAmountBdt)) {
      throw new ValidationError(`Maximum investment is ৳${Number(tier.maxAmountBdt).toLocaleString("en-BD")}`);
    }
    if (tier.type === "PLOT_BOOKING" && tier.availableUnits !== null && tier.availableUnits <= 0) {
      throw new ValidationError("No plots available at this time");
    }

    // Investors may hold several investments in the same tier; each one is
    // paid, reviewed and activated on its own.

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
      select: { id: true, status: true, amountBdt: true, investorUserId: true, tier: { select: { bankAccountId: true } } },
    });
    if (!inv) throw new NotFoundError("Group investment");
    if (inv.investorUserId !== session.id) throw new ForbiddenError("Access denied");
    if (inv.status !== "PAYMENT_PENDING") {
      throw new ValidationError(`Cannot submit proof for investment in status: ${inv.status}`);
    }
    // Investors must pay into the account the admin assigned to this tier.
    if (inv.tier.bankAccountId && data.bankAccountId !== inv.tier.bankAccountId) {
      throw new ValidationError("Please pay into the bank account shown for this tier.");
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

// ─── Admin: manage business groups, entities and tiers ──────────────────────
// Super Admin, Admin and Project Manager hold group.manage. Every write
// revalidates the whole public /groups tree so the website reflects it.

const TIER_TYPES = ["INVESTOR", "SHAREHOLDER", "DIRECTORSHIP", "PLOT_BOOKING", "LAND_SHARE"] as const;
type TierTypeValue = (typeof TIER_TYPES)[number];

function revalidateGroups() {
  revalidatePath("/admin/groups");
  revalidatePath("/groups", "layout");
  revalidatePath("/");
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "entity";
}

async function uniqueEntitySlug(name: string) {
  const base = slugify(name);
  for (let i = 0; ; i++) {
    const slug = i === 0 ? base : `${base}-${i + 1}`;
    const clash = await db.groupEntity.findUnique({ where: { slug }, select: { id: true } });
    if (!clash) return slug;
  }
}

function optionalUrl(v: string | null | undefined) {
  const s = v?.trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s) && !s.startsWith("/")) throw new ValidationError("Image must be a full URL or a site path");
  return s;
}

export async function updateGroupAction(
  groupId: string,
  data: {
    name?: string;
    tagline?: string | null;
    description?: string;
    coverUrl?: string | null;
    logoUrl?: string | null;
    isActive?: boolean;
  },
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.GROUP_MANAGE);
    const group = await db.businessGroup.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) throw new NotFoundError("Business group");
    if (data.name !== undefined && !data.name.trim()) throw new ValidationError("Group name is required");

    await db.businessGroup.update({
      where: { id: groupId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...("tagline" in data && { tagline: data.tagline?.trim() || null }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...("coverUrl" in data && { coverUrl: optionalUrl(data.coverUrl) }),
        ...("logoUrl" in data && { logoUrl: optionalUrl(data.logoUrl) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    revalidateGroups();
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

type EntityInput = { name: string; description: string; isActive: boolean };

export async function createGroupEntityAction(
  groupId: string,
  data: EntityInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.GROUP_MANAGE);
    if (!data.name.trim()) throw new ValidationError("Entity name is required");
    const group = await db.businessGroup.findUnique({ where: { id: groupId }, select: { id: true } });
    if (!group) throw new NotFoundError("Business group");

    const entity = await db.groupEntity.create({
      data: {
        groupId,
        name: data.name.trim(),
        slug: await uniqueEntitySlug(data.name),
        description: data.description.trim(),
        isActive: data.isActive,
      },
      select: { id: true },
    });
    revalidateGroups();
    return { success: true, data: entity };
  } catch (e) { return svcErr(e); }
}

export async function updateGroupEntityAction(
  entityId: string,
  data: Partial<EntityInput>,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.GROUP_MANAGE);
    const entity = await db.groupEntity.findUnique({ where: { id: entityId }, select: { id: true } });
    if (!entity) throw new NotFoundError("Group entity");
    if (data.name !== undefined && !data.name.trim()) throw new ValidationError("Entity name is required");

    await db.groupEntity.update({
      where: { id: entityId },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    revalidateGroups();
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export type TierInput = {
  type: TierTypeValue;
  name: string;
  description: string;
  benefits: string[];
  minAmountBdt: number;
  maxAmountBdt: number | null;
  expectedReturnPct: number | null;
  durationMonths: number | null;
  plotSizeSqft: number | null;
  pricePerSqftBdt: number | null;
  totalUnits: number | null;
  availableUnits: number | null;
  sortOrder: number;
  bankAccountId: string | null;
  isActive: boolean;
};

async function validateTier(data: TierInput) {
  if (!TIER_TYPES.includes(data.type)) throw new ValidationError("Invalid tier type");
  if (!data.name.trim()) throw new ValidationError("Tier name is required");
  if (!(data.minAmountBdt > 0)) throw new ValidationError("Minimum amount must be greater than 0");
  if (data.maxAmountBdt != null && data.maxAmountBdt < data.minAmountBdt) {
    throw new ValidationError("Maximum amount cannot be less than the minimum");
  }
  if (data.expectedReturnPct != null && (data.expectedReturnPct < 0 || data.expectedReturnPct > 100)) {
    throw new ValidationError("Expected return must be between 0 and 100%");
  }
  if (data.totalUnits != null && data.availableUnits != null && data.availableUnits > data.totalUnits) {
    throw new ValidationError("Available units cannot exceed total units");
  }
  if (data.bankAccountId) {
    const bank = await db.bankAccount.findUnique({ where: { id: data.bankAccountId }, select: { isActive: true } });
    if (!bank || !bank.isActive) throw new ValidationError("Selected bank account is not active");
  }
}

function tierData(data: TierInput) {
  return {
    type: data.type,
    name: data.name.trim(),
    description: data.description.trim(),
    benefits: data.benefits.map((b) => b.trim()).filter(Boolean),
    minAmountBdt: data.minAmountBdt,
    maxAmountBdt: data.maxAmountBdt,
    expectedReturnPct: data.expectedReturnPct,
    durationMonths: data.durationMonths,
    plotSizeSqft: data.plotSizeSqft,
    pricePerSqftBdt: data.pricePerSqftBdt,
    totalUnits: data.totalUnits,
    availableUnits: data.availableUnits,
    sortOrder: data.sortOrder,
    bankAccountId: data.bankAccountId || null,
    isActive: data.isActive,
  };
}

export async function createGroupTierAction(
  entityId: string,
  data: TierInput,
): Promise<ActionResult<{ id: string }>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.GROUP_MANAGE);
    const entity = await db.groupEntity.findUnique({ where: { id: entityId }, select: { id: true } });
    if (!entity) throw new NotFoundError("Group entity");
    await validateTier(data);

    const tier = await db.groupTier.create({ data: { entityId, ...tierData(data) }, select: { id: true } });
    revalidateGroups();
    return { success: true, data: tier };
  } catch (e) { return svcErr(e); }
}

export async function updateGroupTierAction(
  tierId: string,
  data: TierInput,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.GROUP_MANAGE);
    const tier = await db.groupTier.findUnique({ where: { id: tierId }, select: { id: true } });
    if (!tier) throw new NotFoundError("Tier");
    await validateTier(data);

    await db.groupTier.update({ where: { id: tierId }, data: tierData(data) });
    revalidateGroups();
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

// ─── Admin: cancel group investment ──────────────────────────────────────────

export async function cancelGroupInvestmentAdminAction(
  groupInvestmentId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.INVESTMENT_APPROVE);

    const inv = await db.groupInvestment.findUnique({
      where: { id: groupInvestmentId },
      select: { id: true, status: true, investorUserId: true },
    });
    if (!inv) throw new NotFoundError("Group investment");
    if (["CANCELLED", "COMPLETED"].includes(inv.status)) {
      throw new ValidationError(`Cannot cancel investment in status: ${inv.status}`);
    }

    await db.groupInvestment.update({
      where: { id: groupInvestmentId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });

    await db.notification.create({
      data: {
        userId: inv.investorUserId,
        type: "INVESTMENT_CONFIRMED",
        title: "Group Investment Cancelled",
        body: `Your group investment has been cancelled by admin. Reason: ${reason}`,
        data: { groupInvestmentId },
      },
    });

    revalidatePath("/admin/groups");
    revalidatePath("/dashboard/groups");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

// ─── Admin: complete group investment ────────────────────────────────────────

export async function completeGroupInvestmentAction(
  groupInvestmentId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.INVESTMENT_APPROVE);

    const inv = await db.groupInvestment.findUnique({
      where: { id: groupInvestmentId },
      select: { id: true, status: true, investorUserId: true },
    });
    if (!inv) throw new NotFoundError("Group investment");
    if (inv.status !== "ACTIVE") {
      throw new ValidationError(`Investment must be ACTIVE to complete (current: ${inv.status})`);
    }

    await db.groupInvestment.update({
      where: { id: groupInvestmentId },
      data: { status: "COMPLETED" },
    });

    await db.notification.create({
      data: {
        userId: inv.investorUserId,
        type: "INVESTMENT_CONFIRMED",
        title: "Group Investment Completed",
        body: "Your group investment has been marked as completed.",
        data: { groupInvestmentId },
      },
    });

    revalidatePath("/admin/groups");
    revalidatePath("/dashboard/groups");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}
