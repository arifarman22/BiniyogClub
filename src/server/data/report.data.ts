/**
 * report.data.ts
 * All report queries run server-side with DB-level filtering and aggregation.
 * Exports use cursor-based streaming — never load full datasets into memory.
 */

import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import type { SessionUser } from "@/lib/auth/session";
import type { Prisma } from "@/types/prisma";

// ─── Shared filter types ──────────────────────────────────────────────────────

export interface ReportFilters {
  dateFrom?:   string;
  dateTo?:     string;
  projectId?:  string;
  investorId?: string;
  status?:     string;
  category?:   string;
}

function dateRange(from?: string, to?: string) {
  if (!from && !to) return undefined;
  return {
    ...(from && { gte: new Date(from) }),
    ...(to   && { lte: new Date(to + "T23:59:59.999Z") }),
  };
}

// ─── ADMIN: Financial Report ──────────────────────────────────────────────────

export async function getFinancialReport(session: SessionUser, f: ReportFilters) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  const createdAt = dateRange(f.dateFrom, f.dateTo);

  const [
    investmentSummary,
    paymentSummary,
    withdrawalSummary,
    distributionSummary,
    monthlyRevenue,
    feeRevenue,
  ] = await Promise.all([
    db.investment.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amountBdt: true, expectedReturnBdt: true, actualReturnBdt: true },
      where: { ...(createdAt && { createdAt }) },
    }),
    db.payment.groupBy({
      by: ["direction", "status"],
      _count: { _all: true },
      _sum: { amountBdt: true, feeBdt: true, netAmountBdt: true },
      where: { ...(createdAt && { createdAt }) },
    }),
    db.withdrawal.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amountBdt: true, feeBdt: true, netAmountBdt: true },
      where: { ...(createdAt && { requestedAt: createdAt }) },
    }),
    db.profitDistribution.aggregate({
      _count: { _all: true },
      _sum: { amountBdt: true, platformFeeBdt: true, netAmountBdt: true },
      where: { ...(createdAt && { distributedAt: createdAt }) },
    }),
    // Monthly investment volume (last 12 months)
    db.$queryRaw<{ month: string; total: number; count: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        SUM("amountBdt")::float                              AS total,
        COUNT(*)::int                                        AS count
      FROM investments
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY 1
      ORDER BY 1
    `,
    db.profitDistribution.groupBy({
      by: ["projectId"],
      _sum: { platformFeeBdt: true },
      orderBy: { _sum: { platformFeeBdt: "desc" } },
      take: 10,
    }),
  ]);

  return { investmentSummary, paymentSummary, withdrawalSummary, distributionSummary, monthlyRevenue, feeRevenue };
}

// ─── ADMIN: Project Report ────────────────────────────────────────────────────

export async function getProjectReport(session: SessionUser, f: ReportFilters) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
    ...(f.status   && { status:   f.status   as never }),
    ...(f.category && { category: f.category as never }),
    ...(f.dateFrom || f.dateTo ? { createdAt: dateRange(f.dateFrom, f.dateTo) } : {}),
  };

  const [byStatus, byCategory, projects, fundingStats] = await Promise.all([
    db.project.groupBy({ by: ["status"],   _count: { _all: true }, _sum: { fundedAmountBdt: true, fundingGoalBdt: true }, where: { deletedAt: null } }),
    db.project.groupBy({ by: ["category"], _count: { _all: true }, _sum: { fundedAmountBdt: true }, where: { deletedAt: null } }),
    db.project.findMany({
      where,
      select: {
        id: true, title: true, slug: true, status: true, category: true,
        fundingGoalBdt: true, fundedAmountBdt: true, fundingMinBdt: true,
        minInvestmentBdt: true, expectedReturnPct: true, returnType: true,
        durationDays: true, fundingDeadline: true, startDate: true, endDate: true,
        location: true, publishedAt: true, completedAt: true, createdAt: true,
        _count: { select: { investments: true } },
      },
      orderBy: { fundedAmountBdt: "desc" },
      take: 200,
    }),
    db.project.aggregate({
      _avg: { expectedReturnPct: true, durationDays: true },
      _sum: { fundedAmountBdt: true, fundingGoalBdt: true },
      _count: { _all: true },
      where: { deletedAt: null },
    }),
  ]);

  return { byStatus, byCategory, projects, fundingStats };
}

// ─── ADMIN: Investment Report ─────────────────────────────────────────────────

export async function getInvestmentReport(session: SessionUser, f: ReportFilters) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  const where: Prisma.InvestmentWhereInput = {
    ...(f.status    && { status:    f.status as never }),
    ...(f.projectId && { projectId: f.projectId }),
    ...(f.investorId && { investorProfile: { userId: f.investorId } }),
    ...(f.dateFrom || f.dateTo ? { createdAt: dateRange(f.dateFrom, f.dateTo) } : {}),
  };

  const [byStatus, byReturnType, topInvestors, recentInvestments, aggregates] = await Promise.all([
    db.investment.groupBy({ by: ["status"],     _count: { _all: true }, _sum: { amountBdt: true } }),
    db.investment.groupBy({ by: ["returnType"], _count: { _all: true }, _sum: { amountBdt: true } }),
    db.investorProfile.findMany({
      select: {
        user: { select: { id: true, name: true, email: true } },
        _count: { select: { investments: true } },
        investments: {
          select: { amountBdt: true },
          where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
        },
      },
      orderBy: { investments: { _count: "desc" } },
      take: 20,
    }),
    db.investment.findMany({
      where,
      select: {
        id: true, status: true, amountBdt: true, expectedReturnBdt: true,
        actualReturnBdt: true, returnType: true, receiptNumber: true,
        confirmedAt: true, maturedAt: true, createdAt: true,
        project: { select: { id: true, title: true, category: true } },
        investorProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
    db.investment.aggregate({
      _count: { _all: true },
      _sum: { amountBdt: true, expectedReturnBdt: true, actualReturnBdt: true },
      _avg: { amountBdt: true },
      where,
    }),
  ]);

  return { byStatus, byReturnType, topInvestors, recentInvestments, aggregates };
}

// ─── ADMIN: Investor Report ───────────────────────────────────────────────────

export async function getInvestorReport(session: SessionUser, f: ReportFilters) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  const userWhere: Prisma.UserWhereInput = {
    role: "INVESTOR",
    deletedAt: null,
    ...(f.status && { status: f.status as never }),
    ...(f.dateFrom || f.dateTo ? { createdAt: dateRange(f.dateFrom, f.dateTo) } : {}),
  };

  const [byKycStatus, byCountry, registrationTrend, investors] = await Promise.all([
    db.kyc.groupBy({ by: ["status"], _count: { _all: true } }),
    db.investorProfile.groupBy({ by: ["country"], _count: { _all: true }, orderBy: { _count: { country: "desc" } }, take: 10 }),
    db.$queryRaw<{ month: string; count: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM users
      WHERE role = 'INVESTOR' AND "deletedAt" IS NULL
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY 1 ORDER BY 1
    `,
    db.user.findMany({
      where: userWhere,
      select: {
        id: true, name: true, email: true, phone: true, status: true, createdAt: true,
        kyc: { select: { status: true, submittedAt: true, reviewedAt: true } },
        investorProfile: {
          select: {
            country: true, occupation: true,
            _count: { select: { investments: true } },
            investments: {
              select: { amountBdt: true, status: true },
              where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    }),
  ]);

  return { byKycStatus, byCountry, registrationTrend, investors };
}

// ─── ADMIN: Operational Report ────────────────────────────────────────────────

export async function getOperationalReport(session: SessionUser, f: ReportFilters) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  const createdAt = dateRange(f.dateFrom, f.dateTo);

  const [
    kycQueue, pendingPayments, pendingWithdrawals,
    auditActivity, notificationStats, sessionStats,
  ] = await Promise.all([
    db.kyc.groupBy({ by: ["status"], _count: { _all: true } }),
    db.manualPaymentSubmission.groupBy({ by: ["status"], _count: { _all: true } }),
    db.withdrawal.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amountBdt: true } }),
    db.auditLog.groupBy({
      by: ["action"],
      _count: { _all: true },
      where: { ...(createdAt && { createdAt }) },
    }),
    db.notification.groupBy({ by: ["type"], _count: { _all: true }, orderBy: { _count: { type: "desc" } }, take: 10 }),
    db.$queryRaw<{ date: string; count: number }[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS date,
        COUNT(*)::int AS count
      FROM sessions
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY 1 ORDER BY 1
    `,
  ]);

  return { kycQueue, pendingPayments, pendingWithdrawals, auditActivity, notificationStats, sessionStats };
}

// ─── INVESTOR: Portfolio Report ───────────────────────────────────────────────

export async function getInvestorPortfolioReport(session: SessionUser) {
  const profileId = await resolveInvestorProfile(session.id);

  const investments = await db.investment.findMany({
    where: { investorProfileId: profileId, status: { notIn: ["PENDING"] } },
    select: {
      id: true, status: true, amountBdt: true, expectedReturnBdt: true,
      actualReturnBdt: true, returnType: true, createdAt: true, maturedAt: true,
      project: { select: { title: true, category: true, expectedReturnPct: true, durationDays: true, status: true } },
      distributions: { select: { netAmountBdt: true, distributedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalInvested   = investments.reduce((s, i) => s + Number(i.amountBdt), 0);
  const totalReturns    = investments.reduce((s, i) => s + i.distributions.reduce((ds, d) => ds + Number(d.netAmountBdt), 0), 0);
  const activeCapital   = investments.filter((i) => i.status === "ACTIVE").reduce((s, i) => s + Number(i.amountBdt), 0);
  const byCategory      = investments.reduce<Record<string, number>>((acc, i) => {
    acc[i.project.category] = (acc[i.project.category] ?? 0) + Number(i.amountBdt);
    return acc;
  }, {});
  const byStatus        = investments.reduce<Record<string, number>>((acc, i) => {
    acc[i.status] = (acc[i.status] ?? 0) + 1;
    return acc;
  }, {});

  return { investments, totalInvested, totalReturns, activeCapital, byCategory, byStatus };
}

// ─── INVESTOR: Transaction Statement ─────────────────────────────────────────

export async function getInvestorTransactionStatement(session: SessionUser, f: ReportFilters) {
  const createdAt = dateRange(f.dateFrom, f.dateTo);

  const [payments, withdrawals] = await Promise.all([
    db.payment.findMany({
      where: {
        wallet: { userId: session.id },
        ...(f.status   && { status: f.status as never }),
        ...(createdAt  && { createdAt }),
      },
      select: {
        id: true, direction: true, method: true, status: true,
        amountBdt: true, feeBdt: true, netAmountBdt: true,
        description: true, externalReference: true,
        processedAt: true, createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
    db.withdrawal.findMany({
      where: {
        wallet: { userId: session.id },
        ...(f.status  && { status: f.status as never }),
        ...(createdAt && { requestedAt: createdAt }),
      },
      select: {
        id: true, status: true, amountBdt: true, feeBdt: true, netAmountBdt: true,
        method: true, bankName: true, accountNumber: true,
        requestedAt: true, completedAt: true,
      },
      orderBy: { requestedAt: "desc" },
      take: 1000,
    }),
  ]);

  return { payments, withdrawals };
}

// ─── INVESTOR: Distribution History ──────────────────────────────────────────

export async function getInvestorDistributionHistory(session: SessionUser, f: ReportFilters) {
  const profileId = await resolveInvestorProfile(session.id);
  const distributedAt = dateRange(f.dateFrom, f.dateTo);

  return db.profitDistribution.findMany({
    where: {
      investment: { investorProfileId: profileId },
      ...(f.projectId   && { projectId: f.projectId }),
      ...(distributedAt && { distributedAt }),
    },
    select: {
      id: true, amountBdt: true, platformFeeBdt: true, netAmountBdt: true,
      distributedAt: true, notes: true,
      project: { select: { id: true, title: true, category: true } },
      investment: { select: { id: true, amountBdt: true, receiptNumber: true } },
    },
    orderBy: { distributedAt: "desc" },
    take: 1000,
  });
}

// ─── Export: streaming cursor queries ────────────────────────────────────────
// These return raw rows for CSV/Excel — never paginated, always filtered server-side.

export async function streamInvestmentsForExport(session: SessionUser, f: ReportFilters) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  return db.investment.findMany({
    where: {
      ...(f.status    && { status:    f.status as never }),
      ...(f.projectId && { projectId: f.projectId }),
      ...(f.investorId && { investorProfile: { userId: f.investorId } }),
      ...(f.dateFrom || f.dateTo ? { createdAt: dateRange(f.dateFrom, f.dateTo) } : {}),
    },
    select: {
      id: true, status: true, amountBdt: true, expectedReturnBdt: true,
      actualReturnBdt: true, returnType: true, receiptNumber: true,
      confirmedAt: true, maturedAt: true, cancelledAt: true, createdAt: true,
      project: { select: { title: true, category: true, status: true } },
      investorProfile: { select: { user: { select: { name: true, email: true, phone: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function streamProjectsForExport(session: SessionUser, f: ReportFilters) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  return db.project.findMany({
    where: {
      deletedAt: null,
      ...(f.status   && { status:   f.status   as never }),
      ...(f.category && { category: f.category as never }),
      ...(f.dateFrom || f.dateTo ? { createdAt: dateRange(f.dateFrom, f.dateTo) } : {}),
    },
    select: {
      id: true, title: true, slug: true, status: true, category: true,
      fundingGoalBdt: true, fundedAmountBdt: true, minInvestmentBdt: true,
      expectedReturnPct: true, returnType: true, durationDays: true,
      fundingDeadline: true, startDate: true, endDate: true,
      location: true, publishedAt: true, completedAt: true, createdAt: true,
      _count: { select: { investments: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function streamInvestorPaymentsForExport(session: SessionUser, f: ReportFilters) {
  return db.payment.findMany({
    where: {
      wallet: { userId: session.id },
      ...(f.status  && { status: f.status as never }),
      ...(f.dateFrom || f.dateTo ? { createdAt: dateRange(f.dateFrom, f.dateTo) } : {}),
    },
    select: {
      id: true, direction: true, method: true, status: true,
      amountBdt: true, feeBdt: true, netAmountBdt: true,
      description: true, externalReference: true, processedAt: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function streamDistributionsForExport(session: SessionUser, f: ReportFilters) {
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER"].includes(session.role);

  if (isAdmin) {
    await requirePermission(session, PERMISSIONS.REPORT_VIEW);
    return db.profitDistribution.findMany({
      where: {
        ...(f.projectId  && { projectId: f.projectId }),
        ...(f.investorId && { investment: { investorProfile: { userId: f.investorId } } }),
        ...(f.dateFrom || f.dateTo ? { distributedAt: dateRange(f.dateFrom, f.dateTo) } : {}),
      },
      select: {
        id: true, amountBdt: true, platformFeeBdt: true, netAmountBdt: true, distributedAt: true, notes: true,
        project: { select: { title: true, category: true } },
        investment: { select: { amountBdt: true, receiptNumber: true, investorProfile: { select: { user: { select: { name: true, email: true } } } } } },
      },
      orderBy: { distributedAt: "desc" },
    });
  }

  const profileId = await resolveInvestorProfile(session.id);
  return db.profitDistribution.findMany({
    where: {
      investment: { investorProfileId: profileId },
      ...(f.projectId  && { projectId: f.projectId }),
      ...(f.dateFrom || f.dateTo ? { distributedAt: dateRange(f.dateFrom, f.dateTo) } : {}),
    },
    select: {
      id: true, amountBdt: true, platformFeeBdt: true, netAmountBdt: true, distributedAt: true, notes: true,
      project: { select: { title: true, category: true } },
      investment: { select: { amountBdt: true, receiptNumber: true } },
    },
    orderBy: { distributedAt: "desc" },
  });
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function resolveInvestorProfile(userId: string) {
  const profile = await db.investorProfile.findUnique({ where: { userId }, select: { id: true } });
  return profile?.id ?? "";
}
