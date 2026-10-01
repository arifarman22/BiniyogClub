import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { projectRepository } from "@/db/repositories/project.repository";
import type { SessionUser } from "@/lib/auth/session";
import type { ProjectFilters, ProjectSort } from "@/db/repositories/project.repository";

const PAGE_SIZE = 20;
const skip = (page: number) => (page - 1) * PAGE_SIZE;

// ─── Dashboard KPIs ───────────────────────────────────────────────────────────

export async function getAdminDashboardKpis(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.USER_VIEW);

  const [
    totalUsers, totalInvestors,
    activeProjects, pendingKyc, pendingWithdrawals,
    activeInvestments, investmentSum, nearMaturity,
  ] = await Promise.all([
    db.user.count({ where: { deletedAt: null } }),
    db.investorProfile.count(),
    db.project.count({ where: { status: { in: ["FUNDRAISING", "FUNDED", "ACTIVE"] }, deletedAt: null } }),
    db.kyc.count({ where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } } }),
    db.withdrawal.count({ where: { status: { in: ["PENDING", "APPROVED"] } } }),
    db.investment.count({ where: { status: "ACTIVE" } }),
    db.investment.aggregate({ where: { status: { in: ["ACTIVE", "MATURED", "COMPLETED"] } }, _sum: { amountBdt: true } }),
    db.project.count({
      where: {
        status: "ACTIVE",
        endDate: { lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        deletedAt: null,
      },
    }),
  ]);

  return {
    totalUsers, totalInvestors,
    activeProjects, pendingKyc, pendingWithdrawals,
    activeInvestments,
    totalInvestmentBdt: Number(investmentSum._sum.amountBdt ?? 0),
    projectsNearMaturity: nearMaturity,
  };
}

export async function getAdminRecentActivity(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.USER_VIEW);

  const [recentUsers, recentInvestments, recentWithdrawals] = await Promise.all([
    db.user.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.investment.findMany({
      select: {
        id: true, amountBdt: true, status: true, createdAt: true,
        investorProfile: { select: { user: { select: { name: true } } } },
        project: { select: { title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.withdrawal.findMany({
      where: { status: { in: ["PENDING", "APPROVED"] } },
      select: {
        id: true, amountBdt: true, status: true, requestedAt: true, method: true,
        wallet: { select: { user: { select: { name: true } } } },
      },
      orderBy: { requestedAt: "desc" },
      take: 5,
    }),
  ]);

  return { recentUsers, recentInvestments, recentWithdrawals };
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function getAdminUsers(
  session: SessionUser,
  opts: { search?: string; role?: string; status?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.USER_VIEW);
  const { search, role, status, page = 1 } = opts;

  const where = {
    deletedAt: null,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role: role as never }),
    ...(status && { status: status as never }),
  };

  const [items, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, status: true, emailVerified: true,
        createdAt: true, updatedAt: true,
        kyc: { select: { status: true } },
        _count: { select: { sessions: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.user.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getAdminUserById(session: SessionUser, id: string) {
  await requirePermission(session, PERMISSIONS.USER_VIEW);
  return db.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true,
      role: true, status: true, emailVerified: true, phoneVerified: true,
      avatarUrl: true, createdAt: true, updatedAt: true, deletedAt: true,
      kyc: { select: { id: true, status: true, submittedAt: true, reviewedAt: true } },
      investorProfile: { select: { id: true, occupation: true, country: true } },
      _count: { select: { sessions: true, auditLogs: true } },
    },
  });
}

// ─── Investors ────────────────────────────────────────────────────────────────

export async function getAdminInvestors(
  session: SessionUser,
  opts: { search?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.USER_VIEW);
  const { search, page = 1 } = opts;

  const where = {
    ...(search && {
      user: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
  };

  const [items, total] = await Promise.all([
    db.investorProfile.findMany({
      where,
      select: {
        id: true, occupation: true, country: true, createdAt: true,
        user: { select: { id: true, name: true, email: true, phone: true, status: true } },
        _count: { select: { investments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.investorProfile.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getAdminProjects(
  filters: ProjectFilters = {},
  sort: ProjectSort = "newest",
  page = 1,
  limit = PAGE_SIZE,
) {
  return projectRepository.findMany({ ...filters, includeDeleted: false }, sort, page, limit);
}

export async function getAdminProjectById(id: string) {
  return projectRepository.findById(id);
}

export async function getProjectStatusCounts() {
  return projectRepository.countByStatus();
}

// ─── Investments ──────────────────────────────────────────────────────────────

export async function getAdminInvestments(
  session: SessionUser,
  opts: { search?: string; status?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.INVESTMENT_VIEW);
  const { search, status, page = 1 } = opts;

  const where = {
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { investorProfile: { user: { name: { contains: search, mode: "insensitive" as const } } } },
        { investorProfile: { user: { email: { contains: search, mode: "insensitive" as const } } } },
        { project: { title: { contains: search, mode: "insensitive" as const } } },
        { receiptNumber: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.investment.findMany({
      where,
      select: {
        id: true, status: true, amountBdt: true, expectedReturnBdt: true,
        actualReturnBdt: true, returnType: true, receiptNumber: true,
        confirmedAt: true, maturedAt: true, cancelledAt: true, createdAt: true,
        investorProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
        project: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.investment.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export async function getAdminPayments(
  session: SessionUser,
  opts: { search?: string; status?: string; direction?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.PAYMENT_VIEW);
  const { search, status, direction, page = 1 } = opts;

  const where = {
    ...(status && { status: status as never }),
    ...(direction && { direction: direction as never }),
    ...(search && {
      OR: [
        { wallet: { user: { name: { contains: search, mode: "insensitive" as const } } } },
        { wallet: { user: { email: { contains: search, mode: "insensitive" as const } } } },
        { externalReference: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.payment.findMany({
      where,
      select: {
        id: true, direction: true, method: true, status: true,
        amountBdt: true, feeBdt: true, netAmountBdt: true,
        externalReference: true, description: true,
        processedAt: true, failedAt: true, createdAt: true,
        wallet: { select: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.payment.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Withdrawals ──────────────────────────────────────────────────────────────

export async function getAdminWithdrawals(
  session: SessionUser,
  opts: { search?: string; status?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.WITHDRAWAL_VIEW);
  const { search, status, page = 1 } = opts;

  const where = {
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { wallet: { user: { name: { contains: search, mode: "insensitive" as const } } } },
        { wallet: { user: { email: { contains: search, mode: "insensitive" as const } } } },
        { accountNumber: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.withdrawal.findMany({
      where,
      select: {
        id: true, status: true, amountBdt: true, feeBdt: true, netAmountBdt: true,
        method: true, bankName: true, accountNumber: true, accountName: true,
        mobileNumber: true, requestedAt: true, approvedAt: true,
        processedAt: true, completedAt: true, rejectedAt: true, rejectionReason: true,
        wallet: { select: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { requestedAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.withdrawal.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}


// ─── Distributions ────────────────────────────────────────────────────────────

export async function getAdminDistributions(
  session: SessionUser,
  opts: { search?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.INVESTMENT_VIEW);
  const { search, page = 1 } = opts;

  const where = {
    ...(search && {
      OR: [
        { project: { title: { contains: search, mode: "insensitive" as const } } },
        { investment: { investorProfile: { user: { name: { contains: search, mode: "insensitive" as const } } } } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.profitDistribution.findMany({
      where,
      select: {
        id: true, amountBdt: true, platformFeeBdt: true, netAmountBdt: true,
        distributedAt: true, notes: true, createdAt: true,
        project: { select: { id: true, title: true } },
        investment: {
          select: {
            id: true, amountBdt: true,
            investorProfile: { select: { user: { select: { name: true, email: true } } } },
          },
        },
      },
      orderBy: { distributedAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.profitDistribution.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getAdminNotifications(
  session: SessionUser,
  opts: { search?: string; type?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.USER_VIEW);
  const { search, type, page = 1 } = opts;

  const where = {
    ...(type && { type: type as never }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: "insensitive" as const } },
        { user: { name: { contains: search, mode: "insensitive" as const } } },
        { user: { email: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.notification.findMany({
      where,
      select: {
        id: true, type: true, title: true, body: true,
        isRead: true, readAt: true, createdAt: true,
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.notification.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getAdminDocuments(
  session: SessionUser,
  opts: { search?: string; entityType?: string; category?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.PROJECT_VIEW);
  const { search, entityType, category, page = 1 } = opts;

  const where = {
    deletedAt: null,
    ...(entityType && { entityType: entityType as never }),
    ...(category   && { category:   category   as never }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { uploader: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.document.findMany({
      where,
      select: {
        id: true, name: true, description: true, entityType: true, entityId: true,
        category: true, mimeType: true, sizeBytes: true, isPublic: true,
        isFinalized: true, templateVersion: true, generatedAt: true, createdAt: true,
        uploader: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.document.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Audit Logs ───────────────────────────────────────────────────────────────

export async function getAdminAuditLogs(
  session: SessionUser,
  opts: { search?: string; action?: string; entityType?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.AUDIT_VIEW);
  const { search, action, entityType, page = 1 } = opts;

  const where = {
    ...(action && { action: action as never }),
    ...(entityType && { entityType }),
    ...(search && {
      OR: [
        { actor: { name: { contains: search, mode: "insensitive" as const } } },
        { actor: { email: { contains: search, mode: "insensitive" as const } } },
        { entityId: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      select: {
        id: true, action: true, entityType: true, entityId: true,
        ipAddress: true, createdAt: true,
        actor: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.auditLog.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Reports ─────────────────────────────────────────────────────────────────

export async function getAdminReports(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    investmentsByStatus, projectsByStatus, investmentsByMonth,
    topProjects, withdrawalStats,
  ] = await Promise.all([
    db.investment.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amountBdt: true } }),
    db.project.groupBy({ by: ["status"], _count: { _all: true }, where: { deletedAt: null } }),
    db.investment.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { amountBdt: true, createdAt: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    db.project.findMany({
      where: { deletedAt: null },
      select: {
        id: true, title: true, fundedAmountBdt: true, fundingGoalBdt: true, status: true,
        _count: { select: { investments: true } },
      },
      orderBy: { fundedAmountBdt: "desc" },
      take: 10,
    }),
    db.withdrawal.groupBy({ by: ["status"], _count: { _all: true }, _sum: { amountBdt: true } }),
  ]);

  return { investmentsByStatus, projectsByStatus, investmentsByMonth, topProjects, withdrawalStats };
}

// ─── Select helpers ───────────────────────────────────────────────────────────

export async function getManagersForSelect() {
  return db.user.findMany({
    where: { deletedAt: null, status: "ACTIVE", role: { in: ["PROJECT_MANAGER", "ADMIN", "SUPER_ADMIN"] } },
    select: { id: true, name: true, role: true },
    orderBy: { name: "asc" },
  });
}

// ─── Admin Analytics ──────────────────────────────────────────────────────────

export async function getAdminAnalytics(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.REPORT_VIEW);

  const now = new Date();

  // Build 12-month labels
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString("en-BD", { month: "short", year: "2-digit" }) };
  });

  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [
    investmentsByMonth,
    distributionsByMonth,
    withdrawalsByMonth,
    investmentsByStatus,
    investmentsByReturnType,
    projectsByStatus,
    projectsByCategory,
    topProjects,
    investorGrowth,
    kpiAggregates,
  ] = await Promise.all([
    // Monthly investment volume
    db.investment.findMany({
      where: { createdAt: { gte: twelveMonthsAgo }, status: { notIn: ["CANCELLED", "REFUNDED"] } },
      select: { amountBdt: true, createdAt: true },
    }),
    // Monthly distributions
    db.profitDistribution.findMany({
      where: { distributedAt: { gte: twelveMonthsAgo } },
      select: { netAmountBdt: true, distributedAt: true },
    }),
    // Monthly withdrawals
    db.withdrawal.findMany({
      where: { requestedAt: { gte: twelveMonthsAgo }, status: { in: ["COMPLETED", "PROCESSING"] } },
      select: { netAmountBdt: true, requestedAt: true },
    }),
    // Investment breakdown by status
    db.investment.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amountBdt: true },
    }),
    // Investment breakdown by return type
    db.investment.groupBy({
      by: ["returnType"],
      _count: { _all: true },
      _sum: { amountBdt: true },
    }),
    // Projects by status
    db.project.groupBy({
      by: ["status"],
      _count: { _all: true },
      where: { deletedAt: null },
    }),
    // Projects by category
    db.project.groupBy({
      by: ["category"],
      _count: { _all: true },
      _sum: { fundedAmountBdt: true },
      where: { deletedAt: null },
    }),
    // Top funded projects
    db.project.findMany({
      where: { deletedAt: null, status: { notIn: ["DRAFT"] } },
      select: {
        title: true, category: true, status: true,
        fundingGoalBdt: true, fundedAmountBdt: true,
        _count: { select: { investments: true } },
      },
      orderBy: { fundedAmountBdt: "desc" },
      take: 8,
    }),
    // Monthly new investors
    db.investorProfile.findMany({
      where: { createdAt: { gte: twelveMonthsAgo } },
      select: { createdAt: true },
    }),
    // Overall KPI aggregates
    Promise.all([
      db.investment.aggregate({
        _sum: { amountBdt: true },
        _count: { _all: true },
        where: { status: { notIn: ["CANCELLED", "REFUNDED"] } },
      }),
      db.profitDistribution.aggregate({ _sum: { netAmountBdt: true, platformFeeBdt: true } }),
      db.investorProfile.count(),
      db.project.count({ where: { status: { in: ["FUNDRAISING", "FUNDED", "ACTIVE"] }, deletedAt: null } }),
      db.project.count({ where: { status: "COMPLETED", deletedAt: null } }),
      db.project.count({ where: { deletedAt: null } }),
      db.withdrawal.aggregate({
        _sum: { netAmountBdt: true },
        where: { status: "COMPLETED" },
      }),
    ]),
  ]);

  const [invAgg, distAgg, totalInvestors, activeProjects, completedProjects, totalProjects, withdrawalAgg] = kpiAggregates;

  // Aggregate into monthly buckets
  const monthly = months.map(({ year, month, label }) => {
    const invested = investmentsByMonth
      .filter((i) => { const d = new Date(i.createdAt); return d.getFullYear() === year && d.getMonth() === month; })
      .reduce((s, i) => s + Number(i.amountBdt), 0);
    const distributed = distributionsByMonth
      .filter((d) => { const dt = new Date(d.distributedAt); return dt.getFullYear() === year && dt.getMonth() === month; })
      .reduce((s, d) => s + Number(d.netAmountBdt), 0);
    const withdrawn = withdrawalsByMonth
      .filter((w) => { const d = new Date(w.requestedAt); return d.getFullYear() === year && d.getMonth() === month; })
      .reduce((s, w) => s + Number(w.netAmountBdt), 0);
    const newInvestors = investorGrowth
      .filter((p) => { const d = new Date(p.createdAt); return d.getFullYear() === year && d.getMonth() === month; }).length;
    return { month: label, invested, distributed, withdrawn, newInvestors };
  });

  const fundingRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;
  const totalInvested = Number(invAgg._sum.amountBdt ?? 0);
  const totalDistributed = Number(distAgg._sum.netAmountBdt ?? 0);
  const totalFees = Number(distAgg._sum.platformFeeBdt ?? 0);
  const totalWithdrawn = Number(withdrawalAgg._sum.netAmountBdt ?? 0);

  // Previous month vs current for growth
  const currentMonthInvested = monthly[11]?.invested ?? 0;
  const prevMonthInvested = monthly[10]?.invested ?? 0;
  const investmentGrowthPct = prevMonthInvested > 0
    ? (((currentMonthInvested - prevMonthInvested) / prevMonthInvested) * 100).toFixed(1)
    : null;

  return {
    monthly,
    investmentsByStatus,
    investmentsByReturnType,
    projectsByStatus,
    projectsByCategory,
    topProjects,
    kpis: {
      totalInvested,
      totalDistributed,
      totalFees,
      totalWithdrawn,
      totalInvestors,
      activeProjects,
      completedProjects,
      totalProjects,
      fundingRate,
      investmentGrowthPct,
      totalInvestmentCount: invAgg._count._all,
    },
  };
}
