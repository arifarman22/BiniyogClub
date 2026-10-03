import { db } from "@/lib/db/prisma";
import type { ProjectStatus, ProjectCategory, Prisma } from "@/types/prisma";

// ─── Shared select shapes ─────────────────────────────────────────────────────

export const projectListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  category: true,
  status: true,
  location: true,
  fundingGoalBdt: true,
  fundingMinBdt: true,
  fundedAmountBdt: true,
  minInvestmentBdt: true,
  maxInvestmentBdt: true,
  expectedReturnPct: true,
  returnType: true,
  durationDays: true,
  fundingDeadline: true,
  startDate: true,
  endDate: true,
  coverImageUrl: true,
  createdAt: true,
  updatedAt: true,
  manager: { select: { id: true, name: true } },
  _count: { select: { investments: true } },
} satisfies Prisma.ProjectSelect;

export const projectDetailSelect = {
  ...projectListSelect,
  riskInfo: true,
  imageUrls: true,
  managerId: true,
  reviewedBy: true,
  reviewedAt: true,
  approvedAt: true,
  publishedAt: true,
  completedAt: true,
  cancelledAt: true,
  cancellationReason: true,
  rejectionReason: true,
  updates: {
    where: { isPublished: true },
    select: { id: true, title: true, content: true, type: true, publishedAt: true },
    orderBy: { publishedAt: "desc" as const },
    take: 10,
  },
  bankAccounts: {
    where: { isActive: true },
    select: {
      id: true, accountName: true, accountNumber: true, bankName: true,
      branchName: true, routingNumber: true, swiftCode: true,
      mobileNumber: true, email: true, branchAddress: true, isActive: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.ProjectSelect;

// ─── Filter / sort types ──────────────────────────────────────────────────────

export type ProjectFilters = {
  status?: ProjectStatus | ProjectStatus[];
  category?: ProjectCategory;
  search?: string;
  farmId?: string;
  managerId?: string;
  includeDeleted?: boolean;
};

export type ProjectSort = "newest" | "oldest" | "deadline" | "funded_pct" | "goal_asc" | "goal_desc";

// ─── Repository ───────────────────────────────────────────────────────────────

export const projectRepository = {
  async findById(id: string) {
    return db.project.findUnique({
      where: { id },
      select: projectDetailSelect,
    });
  },

  async findBySlug(slug: string) {
    return db.project.findUnique({
      where: { slug },
      select: projectDetailSelect,
    });
  },

  async findMany(
    filters: ProjectFilters = {},
    sort: ProjectSort = "newest",
    page = 1,
    limit = 12,
  ) {
    const where = buildWhere(filters);
    const orderBy = buildOrderBy(sort);
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      db.project.findMany({ where, orderBy, skip, take: limit, select: projectListSelect }),
      db.project.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async create(data: Prisma.ProjectCreateInput) {
    return db.project.create({ data, select: projectDetailSelect });
  },

  async update(id: string, data: Prisma.ProjectUpdateInput) {
    return db.project.update({ where: { id }, data, select: projectDetailSelect });
  },

  async slugExists(slug: string, excludeId?: string) {
    const project = await db.project.findUnique({ where: { slug }, select: { id: true } });
    if (!project) return false;
    return project.id !== excludeId;
  },

  async countByStatus() {
    const rows = await db.project.groupBy({
      by: ["status"],
      _count: { status: true },
      where: { deletedAt: null },
    });
    return Object.fromEntries(rows.map((r) => [r.status, r._count.status]));
  },

  async countByCategory(filters: Pick<ProjectFilters, "status"> = {}) {
    const where = buildWhere({ ...filters, includeDeleted: false });
    const rows = await db.project.groupBy({
      by: ["category"],
      _count: { category: true },
      where,
    });
    return rows.map((r) => ({ category: r.category, count: r._count.category }));
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildWhere(f: ProjectFilters): Prisma.ProjectWhereInput {
  const where: Prisma.ProjectWhereInput = {};

  if (!f.includeDeleted) where.deletedAt = null;

  if (f.status) {
    where.status = Array.isArray(f.status) ? { in: f.status } : f.status;
  }
  if (f.category) where.category = f.category;
  if (f.managerId) where.managerId = f.managerId;

  if (f.search) {
    where.OR = [
      { title: { contains: f.search, mode: "insensitive" } },
      { description: { contains: f.search, mode: "insensitive" } },
      { location: { contains: f.search, mode: "insensitive" } },
    ];
  }

  return where;
}

function buildOrderBy(sort: ProjectSort): Prisma.ProjectOrderByWithRelationInput {
  switch (sort) {
    case "oldest":      return { createdAt: "asc" };
    case "deadline":    return { fundingDeadline: "asc" };
    case "goal_asc":    return { fundingGoalBdt: "asc" };
    case "goal_desc":   return { fundingGoalBdt: "desc" };
    case "funded_pct":  return { fundedAmountBdt: "desc" };
    default:            return { createdAt: "desc" };
  }
}
