/**
 * investor.data.ts
 *
 * ALL queries in this file are scoped to the authenticated investor's own data.
 * The investorProfileId is always derived from session.id — never from a URL
 * param or user-supplied input. This prevents IDOR by construction.
 */

import { db } from "@/lib/db/prisma";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";

// ─── Internal: resolve investorProfileId from session ────────────────────────
// Always call this first. Never accept an investorProfileId from outside.

async function resolveProfile(session: SessionUser) {
  // Try to find existing profile
  let profile = await db.investorProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });

  // If missing but KYC is verified, auto-create from KYC data
  if (!profile) {
    const kyc = await db.kyc.findUnique({
      where: { userId: session.id },
      select: { status: true, documentNumber: true, dateOfBirth: true, addressLine: true, city: true, nationality: true },
    });
    if (!kyc || kyc.status !== "VERIFIED") {
      throw new NotFoundError("Investor profile not found. Please complete your profile setup.");
    }
    profile = await db.investorProfile.upsert({
      where: { userId: session.id },
      create: {
        userId: session.id,
        nationalId: kyc.documentNumber ?? undefined,
        dateOfBirth: kyc.dateOfBirth ?? undefined,
        address: kyc.addressLine ?? undefined,
        city: kyc.city ?? undefined,
        country: kyc.nationality ?? "BD",
      },
      update: {},
      select: { id: true },
    });
    // Also ensure wallet exists
    await db.wallet.upsert({
      where: { userId: session.id },
      update: {},
      create: { userId: session.id, type: "INVESTOR", cachedBalance: 0, currency: "BDT" },
    });
  }

  return profile.id;
}

// ─── Dashboard overview stats ─────────────────────────────────────────────────

export async function getInvestorDashboard(session: SessionUser) {
  const profileId = await resolveProfile(session);

  const [investments, wallet, pendingPayments] = await Promise.all([
    db.investment.findMany({
      where: { investorProfileId: profileId },
      select: {
        id: true,
        status: true,
        amountBdt: true,
        expectedReturnBdt: true,
        actualReturnBdt: true,
        createdAt: true,
        maturedAt: true,
        distributions: { select: { netAmountBdt: true } },
      },
    }),
    db.wallet.findUnique({
      where: { userId: session.id },
      select: { cachedBalance: true, currency: true },
    }),
    db.payment.count({
      where: {
        wallet: { userId: session.id },
        status: "PENDING",
      },
    }),
  ]);

  const totalInvested = investments.reduce((s, i) => s + Number(i.amountBdt), 0);
  const activeCount = investments.filter((i) => ["ACTIVE", "CONFIRMED"].includes(i.status)).length;
  const completedCount = investments.filter((i) => i.status === "MATURED").length;

  // Portfolio value = active investments at cost + matured at actual return
  const portfolioValue = investments.reduce((s, i) => {
    if (i.status === "MATURED" && i.actualReturnBdt) {
      return s + Number(i.amountBdt) + Number(i.actualReturnBdt);
    }
    if (["ACTIVE", "CONFIRMED"].includes(i.status)) {
      return s + Number(i.amountBdt);
    }
    return s;
  }, 0);

  const distributedReturns = investments.reduce(
    (s, i) => s + i.distributions.reduce((ds, d) => ds + Number(d.netAmountBdt), 0),
    0,
  );

  return {
    totalInvested,
    activeCount,
    completedCount,
    portfolioValue,
    distributedReturns,
    walletBalance: Number(wallet?.cachedBalance ?? 0),
    pendingTransactions: pendingPayments,
    investmentCount: investments.length,
  };
}

// ─── Investments list ─────────────────────────────────────────────────────────

export async function getInvestorInvestments(session: SessionUser) {
  const profileId = await resolveProfile(session);

  return db.investment.findMany({
    where: { investorProfileId: profileId },
    select: {
      id: true,
      status: true,
      amountBdt: true,
      expectedReturnBdt: true,
      actualReturnBdt: true,
      returnType: true,
      createdAt: true,
      confirmedAt: true,
      activatedAt: true,
      maturedAt: true,
      cancelledAt: true,
      cancellationReason: true,
      project: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          status: true,
          coverImageUrl: true,
          durationDays: true,
          startDate: true,
          endDate: true,
          expectedReturnPct: true,
          fundingGoalBdt: true,
          fundedAmountBdt: true,
          location: true,
        },
      },
      contract: { select: { status: true, signedAt: true } },
      distributions: { select: { netAmountBdt: true, distributedAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Projects the investor has invested in ────────────────────────────────────

export async function getInvestorProjects(session: SessionUser) {
  const profileId = await resolveProfile(session);

  // Only projects where this investor has an investment
  const investments = await db.investment.findMany({
    where: { investorProfileId: profileId },
    select: {
      id: true,
      status: true,
      amountBdt: true,
      project: {
        select: {
          id: true,
          title: true,
          slug: true,
          category: true,
          status: true,
          coverImageUrl: true,
          location: true,
          fundingGoalBdt: true,
          fundedAmountBdt: true,
          expectedReturnPct: true,
          returnType: true,
          durationDays: true,
          startDate: true,
          endDate: true,
          fundingDeadline: true,
          // Only updates for projects this investor is in
          updates: {
            where: { isPublished: true },
            select: { id: true, title: true, type: true, publishedAt: true, content: true },
            orderBy: { publishedAt: "desc" as const },
            take: 3,
          },
          _count: { select: { investments: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return investments;
}

// ─── Portfolio analytics ──────────────────────────────────────────────────────

export async function getInvestorPortfolio(session: SessionUser) {
  const profileId = await resolveProfile(session);

  const investments = await db.investment.findMany({
    where: { investorProfileId: profileId },
    select: {
      id: true,
      status: true,
      amountBdt: true,
      expectedReturnBdt: true,
      actualReturnBdt: true,
      returnType: true,
      createdAt: true,
      maturedAt: true,
      project: {
        select: {
          title: true,
          slug: true,
          category: true,
          status: true,
          expectedReturnPct: true,
          durationDays: true,
        },
      },
      distributions: {
        select: { netAmountBdt: true, distributedAt: true },
        orderBy: { distributedAt: "asc" as const },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Category allocation
  const categoryMap: Record<string, number> = {};
  for (const inv of investments) {
    const cat = inv.project.category;
    categoryMap[cat] = (categoryMap[cat] ?? 0) + Number(inv.amountBdt);
  }

  // Status distribution
  const statusMap: Record<string, number> = {};
  for (const inv of investments) {
    statusMap[inv.status] = (statusMap[inv.status] ?? 0) + 1;
  }

  // Monthly investment history (last 12 months)
  const now = new Date();
  const monthlyHistory: { month: string; invested: number; returned: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-BD", { month: "short", year: "2-digit" });
    const invested = investments
      .filter((inv) => {
        const c = new Date(inv.createdAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      })
      .reduce((s, inv) => s + Number(inv.amountBdt), 0);
    const returned = investments
      .flatMap((inv) => inv.distributions)
      .filter((dist) => {
        const c = new Date(dist.distributedAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      })
      .reduce((s, dist) => s + Number(dist.netAmountBdt), 0);
    monthlyHistory.push({ month: label, invested, returned });
  }

  return { investments, categoryMap, statusMap, monthlyHistory };
}

// ─── Available projects for dashboard ───────────────────────────────────────

export async function getAvailableProjects(limit = 6) {
  return db.project.findMany({
    where: { status: "FUNDRAISING", deletedAt: null },
    select: {
      id: true, title: true, slug: true, category: true, status: true,
      location: true, coverImageUrl: true,
      fundingGoalBdt: true, fundedAmountBdt: true, minInvestmentBdt: true,
      expectedReturnPct: true, returnType: true, durationDays: true,
      fundingDeadline: true,
      _count: { select: { investments: true } },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}

// ─── Wallet ───────────────────────────────────────────────────────────────────

export async function getInvestorWallet(session: SessionUser) {
  const wallet = await db.wallet.findUnique({
    where: { userId: session.id },
    select: {
      id: true,
      cachedBalance: true,
      currency: true,
      isActive: true,
      createdAt: true,
    },
  });

  const [totalDeposited, totalWithdrawn, pendingWithdrawals] = await Promise.all([
    db.payment.aggregate({
      where: { wallet: { userId: session.id }, direction: "INBOUND", status: "COMPLETED" },
      _sum: { netAmountBdt: true },
    }),
    db.payment.aggregate({
      where: { wallet: { userId: session.id }, direction: "OUTBOUND", status: "COMPLETED" },
      _sum: { netAmountBdt: true },
    }),
    db.withdrawal.findMany({
      where: { wallet: { userId: session.id }, status: { in: ["PENDING", "APPROVED", "PROCESSING"] } },
      select: { id: true, amountBdt: true, status: true, requestedAt: true, method: true },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  return {
    wallet,
    totalDeposited: Number(totalDeposited._sum.netAmountBdt ?? 0),
    totalWithdrawn: Number(totalWithdrawn._sum.netAmountBdt ?? 0),
    pendingWithdrawals,
  };
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export async function getInvestorTransactions(session: SessionUser, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [payments, total] = await Promise.all([
    db.payment.findMany({
      where: { wallet: { userId: session.id } },
      select: {
        id: true,
        direction: true,
        method: true,
        status: true,
        amountBdt: true,
        feeBdt: true,
        netAmountBdt: true,
        description: true,
        processedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.payment.count({ where: { wallet: { userId: session.id } } }),
  ]);

  return { payments, total, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getInvestorDocuments(session: SessionUser) {
  const profileId = await resolveProfile(session);

  // Investment contracts for this investor's investments
  const contracts = await db.investmentContract.findMany({
    where: { investment: { investorProfileId: profileId } },
    select: {
      id: true,
      status: true,
      contractUrl: true,
      signedAt: true,
      createdAt: true,
      investment: {
        select: {
          id: true,
          amountBdt: true,
          project: { select: { title: true, slug: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // KYC documents
  const kyc = await db.kyc.findUnique({
    where: { userId: session.id },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      documents: {
        select: { id: true, documentType: true, storageKey: true, mimeType: true, sizeBytes: true, verifiedAt: true, createdAt: true },
      },
    },
  });

  return { contracts, kyc };
}

// ─── Notifications ────────────────────────────────────────────────────────────

export async function getInvestorNotifications(session: SessionUser, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId: session.id },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        readAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.notification.count({ where: { userId: session.id } }),
    db.notification.count({ where: { userId: session.id, isRead: false } }),
  ]);

  return { notifications, total, unreadCount, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getInvestorProfile(session: SessionUser) {
  const user = await db.user.findUnique({
    where: { id: session.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      emailVerified: true,
      phoneVerified: true,
      createdAt: true,
      investorProfile: {
        select: {
          id: true,
          nationalId: true,
          dateOfBirth: true,
          address: true,
          city: true,
          country: true,
          occupation: true,
          annualIncomeRange: true,
          investmentExperience: true,
          riskTolerance: true,
        },
      },
      kyc: { select: { status: true, submittedAt: true, reviewedAt: true } },
    },
  });

  if (!user) throw new NotFoundError("User");
  return user;
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export async function getInvestorKyc(session: SessionUser) {
  return db.kyc.findUnique({
    where: { userId: session.id },
    select: {
      id: true,
      status: true,
      submittedAt: true,
      reviewedAt: true,
      reviewNote: true,
      expiresAt: true,
      createdAt: true,
      documents: {
        select: {
          id: true,
          documentType: true,
          storageKey: true,
          mimeType: true,
          sizeBytes: true,
          verifiedAt: true,
          createdAt: true,
        },
      },
    },
  });
}

// ─── Project updates (only from invested projects) ────────────────────────────

export async function getInvestorProjectUpdates(session: SessionUser, limit = 20) {
  const profileId = await resolveProfile(session);

  // Get project IDs this investor is in
  const investedProjectIds = await db.investment.findMany({
    where: { investorProfileId: profileId },
    select: { projectId: true },
  });

  const projectIds = investedProjectIds.map((i) => i.projectId);
  if (projectIds.length === 0) return [];

  return db.projectUpdate.findMany({
    where: {
      projectId: { in: projectIds },
      isPublished: true,
    },
    select: {
      id: true,
      title: true,
      content: true,
      type: true,
      publishedAt: true,
      project: {
        select: { id: true, title: true, slug: true, category: true, coverImageUrl: true },
      },
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
  });
}
