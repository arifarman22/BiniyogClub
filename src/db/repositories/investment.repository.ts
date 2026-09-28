import { db } from "@/lib/db/prisma";
import type { InvestmentStatus, Prisma } from "@/types/prisma";

// ─── Select shapes ────────────────────────────────────────────────────────────

export const investmentDetailSelect = {
  id: true,
  investorProfileId: true,
  projectId: true,
  status: true,
  amountBdt: true,
  expectedReturnBdt: true,
  actualReturnBdt: true,
  returnType: true,
  idempotencyKey: true,
  receiptNumber: true,
  paymentPendingAt: true,
  confirmedAt: true,
  activatedAt: true,
  maturedAt: true,
  cancelledAt: true,
  refundedAt: true,
  completedAt: true,
  cancellationReason: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      fundingGoalBdt: true,
      fundedAmountBdt: true,
      minInvestmentBdt: true,
      maxInvestmentBdt: true,
      expectedReturnPct: true,
      returnType: true,
      durationDays: true,
      fundingDeadline: true,
    },
  },
  investorProfile: {
    select: {
      id: true,
      userId: true,
      user: { select: { id: true, name: true, email: true } },
    },
  },
  contract: { select: { id: true, status: true, signedAt: true } },
} satisfies Prisma.InvestmentSelect;

// ─── Repository ───────────────────────────────────────────────────────────────

export const investmentRepository = {
  async findById(id: string) {
    return db.investment.findUnique({
      where: { id },
      select: investmentDetailSelect,
    });
  },

  async findByIdempotencyKey(key: string) {
    return db.investment.findUnique({
      where: { idempotencyKey: key },
      select: investmentDetailSelect,
    });
  },

  async findByInvestorAndProject(investorProfileId: string, projectId: string) {
    return db.investment.findFirst({
      where: {
        investorProfileId,
        projectId,
        status: { notIn: ["CANCELLED", "REFUNDED"] },
      },
      select: { id: true, status: true },
    });
  },

  async create(data: {
    investorProfileId: string;
    projectId: string;
    amountBdt: number;
    expectedReturnBdt: number;
    returnType: string;
    idempotencyKey: string;
  }) {
    return db.investment.create({
      data: {
        investorProfileId: data.investorProfileId,
        projectId: data.projectId,
        amountBdt: data.amountBdt,
        expectedReturnBdt: data.expectedReturnBdt,
        returnType: data.returnType as Prisma.InvestmentCreateInput["returnType"],
        idempotencyKey: data.idempotencyKey,
        status: "PENDING",
      },
      select: investmentDetailSelect,
    });
  },

  async updateStatus(
    id: string,
    status: InvestmentStatus,
    extra?: Prisma.InvestmentUpdateInput,
  ) {
    return db.investment.update({
      where: { id },
      data: { status, ...extra },
      select: investmentDetailSelect,
    });
  },

  /**
   * Atomically increment fundedAmountBdt on the project.
   * Returns the updated project so callers can check if fully funded.
   * Must be called inside a Prisma transaction.
   */
  async incrementProjectFunding(
    tx: Prisma.TransactionClient,
    projectId: string,
    amountBdt: number,
  ) {
    return tx.project.update({
      where: { id: projectId },
      data: { fundedAmountBdt: { increment: amountBdt } },
      select: {
        id: true,
        status: true,
        fundingGoalBdt: true,
        fundedAmountBdt: true,
      },
    });
  },

  /**
   * Atomically decrement fundedAmountBdt (for cancellations/refunds).
   * Must be called inside a Prisma transaction.
   */
  async decrementProjectFunding(
    tx: Prisma.TransactionClient,
    projectId: string,
    amountBdt: number,
  ) {
    return tx.project.update({
      where: { id: projectId },
      data: { fundedAmountBdt: { decrement: amountBdt } },
      select: { id: true, fundedAmountBdt: true },
    });
  },
};
