import { db } from "@/lib/db/prisma";
import type { ProjectStatus } from "@/types/prisma";

const PUBLIC_STATUSES: ProjectStatus[] = [
  "FUNDRAISING", "FUNDED", "ACTIVE", "COMPLETED",
];

// ─── Platform Stats ───────────────────────────────────────────────────────────

export async function getPlatformStats() {
  const [
    totalProjects,
    activeProjects,
    totalInvestors,
    fundedResult,
    completedProjects,
  ] = await Promise.all([
    db.project.count({ where: { deletedAt: null, status: { not: "DRAFT" } } }),
    db.project.count({ where: { deletedAt: null, status: { in: ["FUNDRAISING", "FUNDED", "ACTIVE"] } } }),
    db.user.count({ where: { role: "INVESTOR", deletedAt: null, status: "ACTIVE" } }),
    db.project.aggregate({
      _sum: { fundedAmountBdt: true },
      where: { deletedAt: null, status: { not: "DRAFT" } },
    }),
    db.project.count({ where: { deletedAt: null, status: "COMPLETED" } }),
  ]);

  return {
    totalProjects,
    activeProjects,
    totalInvestors,
    totalFundedBdt: Number(fundedResult._sum.fundedAmountBdt ?? 0),
    completedProjects,
  };
}

// ─── Featured Projects ────────────────────────────────────────────────────────

export async function getFeaturedProjects(limit = 6) {
  return db.project.findMany({
    where: {
      deletedAt: null,
      status: { in: ["FUNDRAISING", "FUNDED", "ACTIVE"] as ProjectStatus[] },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      status: true,
      location: true,
      fundingGoalBdt: true,
      fundedAmountBdt: true,
      minInvestmentBdt: true,
      expectedReturnPct: true,
      returnPctMin: true,
      returnPctMax: true,
      returnType: true,
      durationDays: true,
      fundingDeadline: true,
      coverImageUrl: true,
      imageUrls: true,
      group: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

// ─── Project by Slug ──────────────────────────────────────────────────────────

export async function getProjectBySlug(slug: string) {
  return db.project.findUnique({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      category: true,
      status: true,
      riskInfo: true,
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
      imageUrls: true,
      publishedAt: true,
      manager: { select: { name: true, avatarUrl: true } },
      documents: {
        where: { isPublic: true },
        select: { id: true, name: true, fileUrl: true, mimeType: true, sizeBytes: true, createdAt: true },
        orderBy: { createdAt: "desc" as const },
      },
      updates: {
        where: { isPublished: true },
        select: { id: true, title: true, content: true, type: true, publishedAt: true },
        orderBy: { publishedAt: "desc" as const },
        take: 20,
      },
      _count: { select: { investments: true } },
      bankAccounts: {
        where: { isActive: true },
        select: {
          id: true, accountName: true, accountNumber: true, bankName: true,
          branchName: true, routingNumber: true, swiftCode: true,
          mobileNumber: true, email: true, branchAddress: true,
        },
        orderBy: { createdAt: "asc" as const },
      },
      group: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  });
}

// ─── Project Slugs (for generateStaticParams) ────────────────────────────────

export async function getAllProjectSlugs() {
  const projects = await db.project.findMany({
    where: { deletedAt: null, status: { notIn: ["DRAFT", "PENDING_APPROVAL"] } },
    select: { slug: true },
  });
  return projects.map((p) => p.slug);
}

// ─── Recent Project Updates ───────────────────────────────────────────────────

export async function getRecentUpdates(limit = 6) {
  return db.projectUpdate.findMany({
    where: {
      isPublished: true,
      project: { deletedAt: null, status: { notIn: ["DRAFT", "PENDING_APPROVAL", "CANCELLED"] } },
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      publishedAt: true,
      project: {
        select: { title: true, slug: true, category: true, coverImageUrl: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

// ─── Project Categories with counts ──────────────────────────────────────────

export async function getProjectCategories() {
  const counts = await db.project.groupBy({
    by: ["category"],
    where: { deletedAt: null, status: { in: PUBLIC_STATUSES } },
    _count: { category: true },
  });
  return counts.map((c) => ({ category: c.category, count: c._count.category }));
}
