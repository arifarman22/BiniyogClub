import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import type { SessionUser } from "@/lib/auth/session";

const PAGE_SIZE = 20;

export async function getAdminDistributionBatches(
  session: SessionUser,
  opts: { projectId?: string; status?: string; search?: string; page?: number },
) {
  await requirePermission(session, PERMISSIONS.DISTRIBUTION_VIEW);
  const { projectId, status, search, page = 1 } = opts;

  const where = {
    ...(projectId && { projectId }),
    ...(status && { status: status as never }),
    ...(search && {
      project: { title: { contains: search, mode: "insensitive" as const } },
    }),
  };

  const [items, total] = await Promise.all([
    db.distributionBatch.findMany({
      where,
      select: {
        id: true, status: true,
        totalRevenueBdt: true, totalExpensesBdt: true,
        netRevenueBdt: true, investorPoolBdt: true,
        totalGrossBdt: true, totalFeeBdt: true, totalNetBdt: true,
        notes: true, createdAt: true, submittedAt: true,
        approvedAt: true, postedAt: true, voidedAt: true, voidReason: true,
        createdBy: true, approvedBy: true, postedBy: true,
        project: { select: { id: true, title: true, slug: true, status: true } },
        _count: { select: { lineItems: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.distributionBatch.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getAdminDistributionBatch(session: SessionUser, batchId: string) {
  await requirePermission(session, PERMISSIONS.DISTRIBUTION_VIEW);

  return db.distributionBatch.findUnique({
    where: { id: batchId },
    include: {
      project: { select: { id: true, title: true, slug: true, status: true, expectedReturnPct: true, returnType: true } },
      rule: true,
      lineItems: {
        include: {
          investment: {
            select: {
              id: true, amountBdt: true, receiptNumber: true, status: true,
              investorProfile: {
                select: { user: { select: { id: true, name: true, email: true } } },
              },
            },
          },
        },
        orderBy: { grossAmountBdt: "desc" },
      },
    },
  });
}

export async function getDistributionRuleForProject(session: SessionUser, projectId: string) {
  await requirePermission(session, PERMISSIONS.DISTRIBUTION_VIEW);
  return db.distributionRule.findUnique({ where: { projectId } });
}

export async function getProjectsEligibleForDistribution(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.DISTRIBUTION_CREATE);
  return db.project.findMany({
    where: {
      status: { in: ["ACTIVE", "COMPLETED"] },
      deletedAt: null,
      investments: { some: { status: "ACTIVE" } },
    },
    select: {
      id: true, title: true, slug: true, status: true,
      fundedAmountBdt: true, expectedReturnPct: true, returnType: true,
      distributionRule: { select: { id: true, investorSharePct: true, platformFeePct: true } },
      _count: { select: { investments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { title: "asc" },
  });
}

export async function getDistributionAuditTrail(session: SessionUser, batchId: string) {
  await requirePermission(session, PERMISSIONS.DISTRIBUTION_VIEW);
  return db.auditLog.findMany({
    where: { entityType: "DistributionBatch", entityId: batchId },
    select: {
      id: true, action: true, before: true, after: true,
      createdAt: true, ipAddress: true,
      actor: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}
