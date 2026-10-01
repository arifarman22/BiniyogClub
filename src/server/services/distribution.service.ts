/**
 * distribution.service.ts
 *
 * Project profit distribution engine.
 *
 * Workflow:
 *   1. Finance staff configures a DistributionRule per project (investorSharePct, platformFeePct)
 *   2. Staff creates a DRAFT batch: enters totalRevenueBdt + totalExpensesBdt
 *   3. Service calculates per-investor line items proportionally to principal
 *   4. Staff previews the batch, then submits for approval (PENDING_APPROVAL)
 *   5. Approver (ADMIN / SUPER_ADMIN) approves → APPROVED
 *   6. Finance posts → POSTED: ledger entries written, investments matured, notifications sent
 *   7. To correct: void the batch (VOIDED) + create a new one — records never deleted
 *
 * Immutability guarantees:
 *   - ruleSnapshot is frozen at calculation time; rule changes don't affect posted batches
 *   - POSTED line items are never updated; voiding creates a reversal via ledgerService
 *   - Full AuditLog entry written at every status transition
 */

import { db } from "@/lib/db/prisma";
import { ledgerService } from "@/server/services/ledger.service";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { NotFoundError, ValidationError, ConflictError, ForbiddenError } from "@/lib/errors";
import { applyPct, subtractBdt, addBdt, assertPositiveBdt, roundBdt } from "@/lib/financial/money";
import type { SessionUser } from "@/lib/auth/session";

// ─── Internal helpers ─────────────────────────────────────────────────────────

function auditLog(
  actorId: string,
  action: "CREATE" | "UPDATE" | "APPROVE" | "REJECT" | "VOID",
  entityId: string,
  before: object | null,
  after: object,
) {
  return db.auditLog.create({
    data: { actorId, action, entityType: "DistributionBatch", entityId, before, after },
  });
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const distributionService = {

  // ── Rule management ──────────────────────────────────────────────────────────

  async upsertRule(
    session: SessionUser,
    projectId: string,
    input: { investorSharePct: number; platformFeePct: number; notes?: string },
  ) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_CREATE);

    if (input.investorSharePct <= 0 || input.investorSharePct > 100)
      throw new ValidationError("investorSharePct must be between 0 and 100");
    if (input.platformFeePct < 0 || input.platformFeePct >= 100)
      throw new ValidationError("platformFeePct must be between 0 and 100");

    const project = await db.project.findUnique({ where: { id: projectId }, select: { id: true, status: true } });
    if (!project) throw new NotFoundError("Project");

    const existing = await db.distributionRule.findUnique({ where: { projectId } });

    if (existing) {
      // Block edits if a POSTED batch references this rule
      const postedBatch = await db.distributionBatch.findFirst({
        where: { ruleId: existing.id, status: "POSTED" },
        select: { id: true },
      });
      if (postedBatch) {
        throw new ConflictError(
          "Cannot modify a rule that has posted batches. Create a new batch with updated figures instead.",
        );
      }
      return db.distributionRule.update({
        where: { projectId },
        data: {
          investorSharePct: input.investorSharePct,
          platformFeePct: input.platformFeePct,
          notes: input.notes ?? null,
          updatedBy: session.id,
        },
      });
    }

    return db.distributionRule.create({
      data: {
        projectId,
        investorSharePct: input.investorSharePct,
        platformFeePct: input.platformFeePct,
        notes: input.notes ?? null,
        createdBy: session.id,
      },
    });
  },

  async getRule(session: SessionUser, projectId: string) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_VIEW);
    return db.distributionRule.findUnique({ where: { projectId } });
  },

  // ── Batch: calculate & create DRAFT ──────────────────────────────────────────

  async calculate(
    session: SessionUser,
    input: {
      projectId: string;
      totalRevenueBdt: number;
      totalExpensesBdt: number;
      notes?: string;
    },
  ) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_CREATE);

    assertPositiveBdt(input.totalRevenueBdt, "Total revenue");
    if (input.totalExpensesBdt < 0) throw new ValidationError("Expenses cannot be negative");
    if (input.totalExpensesBdt >= input.totalRevenueBdt)
      throw new ValidationError("Expenses must be less than revenue");

    const rule = await db.distributionRule.findUnique({ where: { projectId: input.projectId } });
    if (!rule) throw new NotFoundError("Distribution rule for this project");

    const project = await db.project.findUnique({
      where: { id: input.projectId },
      select: { id: true, title: true, status: true },
    });
    if (!project) throw new NotFoundError("Project");
    if (!["ACTIVE", "COMPLETED"].includes(project.status))
      throw new ValidationError(`Project must be ACTIVE or COMPLETED to distribute (status: ${project.status})`);

    // Fetch all ACTIVE investments for this project
    const investments = await db.investment.findMany({
      where: { projectId: input.projectId, status: "ACTIVE" },
      select: {
        id: true,
        amountBdt: true,
        investorProfile: { select: { userId: true } },
      },
    });
    if (investments.length === 0)
      throw new ValidationError("No active investments found for this project");

    // ── Core calculation ──────────────────────────────────────────────────────
    const investorSharePct = Number(rule.investorSharePct);
    const platformFeePct   = Number(rule.platformFeePct);

    const netRevenueBdt  = roundBdt(subtractBdt(input.totalRevenueBdt, input.totalExpensesBdt));
    const investorPoolBdt = roundBdt(applyPct(netRevenueBdt, investorSharePct));

    // Total principal across all active investments
    const totalPrincipal = investments.reduce((s, inv) => addBdt(s, Number(inv.amountBdt)), 0);

    // Per-investor proportional allocation
    const lineItems = investments.map((inv) => {
      const principal      = Number(inv.amountBdt);
      const sharePct       = roundBdt((principal / totalPrincipal) * 100);
      const grossAmountBdt = roundBdt(applyPct(investorPoolBdt, sharePct));
      const platformFeeBdt = roundBdt(applyPct(grossAmountBdt, platformFeePct));
      const netAmountBdt   = roundBdt(subtractBdt(grossAmountBdt, platformFeeBdt));

      return {
        investmentId:    inv.id,
        investorUserId:  inv.investorProfile.userId,
        investorSharePct: sharePct,
        principalBdt:    principal,
        grossAmountBdt,
        platformFeeBdt,
        netAmountBdt,
      };
    });

    const totalGrossBdt = roundBdt(lineItems.reduce((s, l) => addBdt(s, l.grossAmountBdt), 0));
    const totalFeeBdt   = roundBdt(lineItems.reduce((s, l) => addBdt(s, l.platformFeeBdt), 0));
    const totalNetBdt   = roundBdt(lineItems.reduce((s, l) => addBdt(s, l.netAmountBdt), 0));

    // Snapshot the rule at calculation time — immutable audit record
    const ruleSnapshot = {
      ruleId:          rule.id,
      investorSharePct,
      platformFeePct,
      capturedAt:      new Date().toISOString(),
    };

    // Persist as DRAFT batch
    const batch = await db.$transaction(async (tx) => {
      const b = await tx.distributionBatch.create({
        data: {
          projectId:       input.projectId,
          ruleId:          rule.id,
          status:          "DRAFT",
          ruleSnapshot,
          totalRevenueBdt: input.totalRevenueBdt,
          totalExpensesBdt: input.totalExpensesBdt,
          netRevenueBdt,
          investorPoolBdt,
          totalGrossBdt,
          totalFeeBdt,
          totalNetBdt,
          notes:           input.notes ?? null,
          createdBy:       session.id,
          lineItems: {
            create: lineItems,
          },
        },
        include: { lineItems: true },
      });

      await auditLog(session.id, "CREATE", b.id, null, {
        status: "DRAFT", projectId: input.projectId, totalNetBdt, lineCount: lineItems.length,
      });

      return b;
    });

    return batch;
  },

  // ── Submit for approval ───────────────────────────────────────────────────────

  async submit(session: SessionUser, batchId: string) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_CREATE);

    const batch = await db.distributionBatch.findUnique({
      where: { id: batchId },
      select: { id: true, status: true, createdBy: true, projectId: true },
    });
    if (!batch) throw new NotFoundError("Distribution batch");
    if (batch.status !== "DRAFT")
      throw new ValidationError(`Batch must be DRAFT to submit (current: ${batch.status})`);
    if (batch.createdBy !== session.id)
      throw new ForbiddenError("Only the creator can submit this batch");

    return db.$transaction(async (tx) => {
      const updated = await tx.distributionBatch.update({
        where: { id: batchId },
        data: { status: "PENDING_APPROVAL", submittedBy: session.id, submittedAt: new Date() },
      });
      await auditLog(session.id, "UPDATE", batchId, { status: "DRAFT" }, { status: "PENDING_APPROVAL" });
      return updated;
    });
  },

  // ── Approve ───────────────────────────────────────────────────────────────────

  async approve(session: SessionUser, batchId: string) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_APPROVE);

    const batch = await db.distributionBatch.findUnique({
      where: { id: batchId },
      select: { id: true, status: true, submittedBy: true },
    });
    if (!batch) throw new NotFoundError("Distribution batch");
    if (batch.status !== "PENDING_APPROVAL")
      throw new ValidationError(`Batch must be PENDING_APPROVAL to approve (current: ${batch.status})`);
    // Prevent self-approval
    if (batch.submittedBy === session.id)
      throw new ForbiddenError("The submitter cannot approve their own batch");

    return db.$transaction(async (tx) => {
      const updated = await tx.distributionBatch.update({
        where: { id: batchId },
        data: { status: "APPROVED", approvedBy: session.id, approvedAt: new Date() },
      });
      await auditLog(session.id, "APPROVE", batchId, { status: "PENDING_APPROVAL" }, { status: "APPROVED" });
      return updated;
    });
  },

  // ── Reject back to DRAFT ──────────────────────────────────────────────────────

  async reject(session: SessionUser, batchId: string, reason: string) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_APPROVE);
    if (!reason?.trim()) throw new ValidationError("Rejection reason is required");

    const batch = await db.distributionBatch.findUnique({
      where: { id: batchId },
      select: { id: true, status: true },
    });
    if (!batch) throw new NotFoundError("Distribution batch");
    if (batch.status !== "PENDING_APPROVAL")
      throw new ValidationError(`Batch must be PENDING_APPROVAL to reject (current: ${batch.status})`);

    return db.$transaction(async (tx) => {
      const updated = await tx.distributionBatch.update({
        where: { id: batchId },
        data: {
          status:      "DRAFT",
          approvedBy:  null,
          approvedAt:  null,
          submittedBy: null,
          submittedAt: null,
          notes:       reason.trim(),
        },
      });
      await auditLog(session.id, "REJECT", batchId, { status: "PENDING_APPROVAL" }, { status: "DRAFT", rejectionReason: reason });
      return updated;
    });
  },

  // ── Post to ledger ────────────────────────────────────────────────────────────

  async post(session: SessionUser, batchId: string) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_POST);

    const batch = await db.distributionBatch.findUnique({
      where: { id: batchId },
      include: {
        lineItems: true,
        project:   { select: { id: true, title: true } },
      },
    });
    if (!batch) throw new NotFoundError("Distribution batch");
    if (batch.status !== "APPROVED")
      throw new ValidationError(`Batch must be APPROVED to post (current: ${batch.status})`);

    const now = new Date();

    // Post each line item: one ledger entry per investor
    for (const line of batch.lineItems) {
      // Resolve investor userId from investorProfile
      const profile = await db.investorProfile.findFirst({
        where: { investments: { some: { id: line.investmentId } } },
        select: { userId: true },
      });
      if (!profile) throw new NotFoundError(`Investor profile for investment ${line.investmentId}`);

      const idempotencyKey = `dist-${batchId}-${line.id}`;
      const feeKey         = `dist-fee-${batchId}-${line.id}`;

      // Net payout: escrow → investor wallet
      await ledgerService.recordDistribution(profile.userId, Number(line.netAmountBdt), {
        investmentId:   line.investmentId,
        idempotencyKey,
        projectTitle:   batch.project.title,
        metadata: {
          batchId,
          lineItemId:    line.id,
          grossAmountBdt: Number(line.grossAmountBdt),
          platformFeeBdt: Number(line.platformFeeBdt),
        },
      });

      // Platform fee: escrow → revenue wallet
      if (Number(line.platformFeeBdt) > 0) {
        await ledgerService.recordPlatformFee(Number(line.platformFeeBdt), {
          investmentId:   line.investmentId,
          idempotencyKey: feeKey,
          description:    `Distribution platform fee: ${batch.project.title}`,
          metadata:       { batchId, lineItemId: line.id },
        });
      }

      // Resolve the ledger tx id for the line item record
      const ledgerTx = await db.ledgerTransaction.findUnique({
        where: { idempotencyKey },
        select: { id: true },
      });

      // Mark line item POSTED
      await db.distributionLineItem.update({
        where: { id: line.id },
        data: {
          status:             "POSTED",
          ledgerTransactionId: ledgerTx?.id ?? null,
          postedAt:           now,
        },
      });

      // Mature the investment
      await db.investment.update({
        where: { id: line.investmentId },
        data: {
          status:         "MATURED",
          maturedAt:      now,
          actualReturnBdt: Number(line.netAmountBdt),
        },
      });

      // Also write a legacy ProfitDistribution record for backward compatibility
      await db.profitDistribution.create({
        data: {
          projectId:     batch.projectId,
          investmentId:  line.investmentId,
          amountBdt:     line.grossAmountBdt,
          platformFeeBdt: line.platformFeeBdt,
          netAmountBdt:  line.netAmountBdt,
          distributedAt: now,
          notes:         `Batch ${batchId}`,
        },
      });

      // Notify investor
      await db.notification.create({
        data: {
          userId: line.investorUserId,
          type:   "DISTRIBUTION_POSTED",
          title:  "Profit Distribution Credited",
          body:   `৳${Number(line.netAmountBdt).toLocaleString("en-BD")} has been credited to your wallet from ${batch.project.title}.`,
          data:   { batchId, lineItemId: line.id, netAmountBdt: Number(line.netAmountBdt) },
        },
      });
    }

    // Mark batch POSTED
    const posted = await db.distributionBatch.update({
      where: { id: batchId },
      data: { status: "POSTED", postedBy: session.id, postedAt: now },
    });

    await auditLog(session.id, "UPDATE", batchId, { status: "APPROVED" }, { status: "POSTED", postedAt: now });

    return posted;
  },

  // ── Void a posted batch ───────────────────────────────────────────────────────

  async void(session: SessionUser, batchId: string, reason: string) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_VOID);
    if (!reason?.trim()) throw new ValidationError("Void reason is required");

    const batch = await db.distributionBatch.findUnique({
      where: { id: batchId },
      include: { lineItems: true },
    });
    if (!batch) throw new NotFoundError("Distribution batch");
    if (batch.status !== "POSTED")
      throw new ValidationError(`Only POSTED batches can be voided (current: ${batch.status})`);

    const now = new Date();

    // Reverse each posted line item's ledger entries
    for (const line of batch.lineItems) {
      if (line.status !== "POSTED" || !line.ledgerTransactionId) continue;

      const reversalKey    = `void-dist-${batchId}-${line.id}`;
      const feeReversalKey = `void-dist-fee-${batchId}-${line.id}`;

      await ledgerService.voidAndReverse(line.ledgerTransactionId, reason, reversalKey);

      // Reverse fee entry if it exists
      const feeTx = await db.ledgerTransaction.findUnique({
        where: { idempotencyKey: `dist-fee-${batchId}-${line.id}` },
        select: { id: true },
      });
      if (feeTx) {
        await ledgerService.voidAndReverse(feeTx.id, reason, feeReversalKey);
      }

      // Mark line item VOIDED
      await db.distributionLineItem.update({
        where: { id: line.id },
        data: { status: "VOIDED", voidedAt: now },
      });

      // Revert investment back to ACTIVE
      await db.investment.update({
        where: { id: line.investmentId },
        data: { status: "ACTIVE", maturedAt: null, actualReturnBdt: null },
      });
    }

    const voided = await db.distributionBatch.update({
      where: { id: batchId },
      data: { status: "VOIDED", voidedBy: session.id, voidedAt: now, voidReason: reason.trim() },
    });

    await auditLog(session.id, "VOID", batchId, { status: "POSTED" }, { status: "VOIDED", reason });

    return voided;
  },

  // ── Queries ───────────────────────────────────────────────────────────────────

  async getBatch(session: SessionUser, batchId: string) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_VIEW);
    const batch = await db.distributionBatch.findUnique({
      where: { id: batchId },
      include: {
        project:  { select: { id: true, title: true, slug: true, status: true } },
        rule:     true,
        lineItems: {
          include: {
            investment: {
              select: {
                id: true, amountBdt: true, receiptNumber: true,
                investorProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
              },
            },
          },
          orderBy: { grossAmountBdt: "desc" },
        },
      },
    });
    if (!batch) throw new NotFoundError("Distribution batch");
    return batch;
  },

  async listBatches(
    session: SessionUser,
    opts: { projectId?: string; status?: string; page?: number },
  ) {
    await requirePermission(session, PERMISSIONS.DISTRIBUTION_VIEW);
    const { projectId, status, page = 1 } = opts;
    const PAGE_SIZE = 20;

    const where = {
      ...(projectId && { projectId }),
      ...(status && { status: status as never }),
    };

    const [items, total] = await Promise.all([
      db.distributionBatch.findMany({
        where,
        select: {
          id: true, status: true, totalRevenueBdt: true, totalExpensesBdt: true,
          netRevenueBdt: true, investorPoolBdt: true, totalNetBdt: true,
          notes: true, createdAt: true, postedAt: true, voidedAt: true,
          createdBy: true, approvedBy: true, postedBy: true,
          project: { select: { id: true, title: true, slug: true } },
          _count: { select: { lineItems: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.distributionBatch.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
  },
};
