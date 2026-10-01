import { db } from "@/lib/db/prisma";
import type { SessionUser } from "@/lib/auth/session";

// ─── Public ───────────────────────────────────────────────────────────────────

export async function getAllGroups() {
  return db.businessGroup.findMany({
    where: { isActive: true },
    select: {
      id: true, slug: true, name: true, tagline: true,
      description: true, logoUrl: true, coverUrl: true,
      entities: {
        where: { isActive: true },
        select: {
          id: true, name: true, slug: true, description: true,
          tiers: {
            where: { isActive: true },
            select: {
              id: true, type: true, name: true,
              minAmountBdt: true, maxAmountBdt: true,
              expectedReturnPct: true, durationMonths: true,
              sortOrder: true,
              _count: { select: { investments: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } } } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getGroupBySlug(slug: string) {
  return db.businessGroup.findUnique({
    where: { slug: slug.toUpperCase() as never, isActive: true },
    select: {
      id: true, slug: true, name: true, tagline: true,
      description: true, logoUrl: true, coverUrl: true,
      entities: {
        where: { isActive: true },
        select: {
          id: true, name: true, slug: true, description: true, logoUrl: true,
          tiers: {
            where: { isActive: true },
            select: {
              id: true, type: true, name: true, description: true,
              benefits: true, minAmountBdt: true, maxAmountBdt: true,
              plotSizeSqft: true, pricePerSqftBdt: true,
              totalUnits: true, availableUnits: true,
              expectedReturnPct: true, durationMonths: true, sortOrder: true,
              _count: { select: { investments: { where: { status: { in: ["ACTIVE", "COMPLETED"] } } } } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
  });
}

export async function getEntityBySlug(entitySlug: string) {
  return db.groupEntity.findUnique({
    where: { slug: entitySlug },
    select: {
      id: true, name: true, slug: true, description: true, logoUrl: true,
      group: { select: { id: true, slug: true, name: true } },
      tiers: {
        where: { isActive: true },
        select: {
          id: true, type: true, name: true, description: true,
          benefits: true, minAmountBdt: true, maxAmountBdt: true,
          plotSizeSqft: true, pricePerSqftBdt: true,
          totalUnits: true, availableUnits: true,
          expectedReturnPct: true, durationMonths: true, sortOrder: true,
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

// ─── Investor-scoped ──────────────────────────────────────────────────────────

export async function getMyGroupInvestments(session: SessionUser) {
  return db.groupInvestment.findMany({
    where: { investorUserId: session.id },
    select: {
      id: true, status: true, amountBdt: true, plotNumber: true,
      sharePercentage: true, receiptNumber: true, notes: true,
      confirmedAt: true, createdAt: true,
      tier: {
        select: {
          id: true, type: true, name: true,
          entity: { select: { name: true, slug: true, group: { select: { name: true, slug: true } } } },
        },
      },
      manualPayments: {
        select: { id: true, status: true, transactionRef: true, createdAt: true, rejectionReason: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminGroupInvestments(opts: {
  status?: string; search?: string; page?: number;
}) {
  const { status, search, page = 1 } = opts;
  const PAGE_SIZE = 20;

  const where = {
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { investor: { name: { contains: search, mode: "insensitive" as const } } },
        { investor: { email: { contains: search, mode: "insensitive" as const } } },
        { tier: { entity: { name: { contains: search, mode: "insensitive" as const } } } },
      ],
    }),
  };

  const [items, total] = await Promise.all([
    db.groupInvestment.findMany({
      where,
      select: {
        id: true, status: true, amountBdt: true, plotNumber: true,
        sharePercentage: true, receiptNumber: true, confirmedAt: true, createdAt: true, notes: true,
        tier: {
          select: {
            type: true, name: true,
            entity: { select: { name: true, group: { select: { name: true } } } },
          },
        },
        investor: { select: { id: true, name: true, email: true } },
        manualPayments: {
          select: { id: true, status: true, transactionRef: true, proofFileUrl: true, proofMimeType: true, createdAt: true, rejectionReason: true, notes: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.groupInvestment.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

export async function getAllGroupsAdmin() {
  return db.businessGroup.findMany({
    select: {
      id: true, slug: true, name: true, tagline: true, description: true, isActive: true, createdAt: true,
      entities: {
        select: {
          id: true, name: true, slug: true, description: true, isActive: true,
          tiers: {
            select: {
              id: true, type: true, name: true, description: true, benefits: true,
              minAmountBdt: true, maxAmountBdt: true,
              expectedReturnPct: true, durationMonths: true,
              totalUnits: true, availableUnits: true,
              isActive: true, sortOrder: true,
              _count: { select: { investments: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}
