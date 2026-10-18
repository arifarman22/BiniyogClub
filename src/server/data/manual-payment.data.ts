import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import type { SessionUser } from "@/lib/auth/session";
import { secureProof } from "@/lib/storage/payment-proof";

const PAGE_SIZE = 20;
const skip = (page: number) => (page - 1) * PAGE_SIZE;

// ─── Project Bank Accounts (for investor payment page) ──────────────────────

export async function getProjectBankAccounts(projectId: string) {
  return db.projectBankAccount.findMany({
    where: { projectId, isActive: true },
    select: {
      id: true,
      bankName: true,
      accountName: true,
      accountNumber: true,
      routingNumber: true,
      branchName: true,
      swiftCode: true,
      mobileNumber: true,
      email: true,
      branchAddress: true,
    },
    orderBy: { createdAt: "asc" },
  });
}

// ─── Bank Accounts (public read — investors need to see these) ────────────────

export async function getActiveBankAccounts() {
  return db.bankAccount.findMany({
    where: { isActive: true },
    select: {
      id: true,
      bankName: true,
      accountName: true,
      accountNumber: true,
      routingNumber: true,
      branchName: true,
      swiftCode: true,
      iban: true,
      mobileNumber: true,
      email: true,
      branchAddress: true,
      instructions: true,
      isDefault: true,
      displayOrder: true,
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
}

export async function getAllBankAccounts(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.PAYMENT_VIEW);
  return db.bankAccount.findMany({
    select: {
      id: true,
      bankName: true,
      accountName: true,
      accountNumber: true,
      routingNumber: true,
      branchName: true,
      swiftCode: true,
      iban: true,
      mobileNumber: true,
      email: true,
      branchAddress: true,
      instructions: true,
      isActive: true,
      isDefault: true,
      displayOrder: true,
      createdAt: true,
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
  });
}

// ─── Manual Payment Submissions ───────────────────────────────────────────────

export async function getManualPaymentSubmissions(
  session: SessionUser,
  opts: { status?: string; search?: string; page?: number } = {},
) {
  await requirePermission(session, PERMISSIONS.PAYMENT_VIEW);
  const { status, search, page = 1 } = opts;

  const where = {
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { transactionRef: { contains: search, mode: "insensitive" as const } },
        { investment: { investorProfile: { user: { name: { contains: search, mode: "insensitive" as const } } } } },
        { investment: { investorProfile: { user: { email: { contains: search, mode: "insensitive" as const } } } } },
      ],
    }),
  };

  const [rows, total] = await Promise.all([
    db.manualPaymentSubmission.findMany({
      where,
      select: {
        id: true,
        status: true,
        amountBdt: true,
        transactionRef: true,
        proofFileUrl: true,
        proofMimeType: true,
        notes: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        investment: {
          select: {
            id: true,
            amountBdt: true,
            project: { select: { title: true } },
            investorProfile: { select: { user: { select: { id: true, name: true, email: true } } } },
          },
        },
        bankAccountId: true,
        paymentMethod: true,
        batchId: true,
        cashReceivedBy: true,
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.manualPaymentSubmission.count({ where }),
  ]);
  const items = rows.map((r) => secureProof("manual", r));

  // Per-investment approved totals, so a batch can show how much is already verified.
  const [sums, banks] = await Promise.all([
    db.manualPaymentSubmission.groupBy({
      by: ["investmentId"],
      where: { investmentId: { in: [...new Set(items.map((i) => i.investment.id))] }, status: "APPROVED" },
      _sum: { amountBdt: true },
    }),
    db.projectBankAccount.findMany({
      where: { id: { in: items.map((i) => i.bankAccountId).filter((id): id is string => !!id) } },
      select: { id: true, bankName: true, accountName: true, accountNumber: true },
    }),
  ]);
  const approvedByInvestment = new Map(sums.map((s) => [s.investmentId, Number(s._sum.amountBdt ?? 0)]));
  const bankById = new Map(banks.map((b) => [b.id, b]));

  // Group parts submitted together (same batchId) into one review item.
  type Item = (typeof items)[number];
  const batches: { key: string; first: Item; parts: (Item & { bank: (typeof banks)[number] | null })[] }[] = [];
  const byKey = new Map<string, (typeof batches)[number]>();
  for (const item of items) {
    const key = item.batchId ?? item.id;
    let batch = byKey.get(key);
    if (!batch) {
      batch = { key, first: item, parts: [] };
      byKey.set(key, batch);
      batches.push(batch);
    }
    batch.parts.push({ ...item, bank: item.bankAccountId ? bankById.get(item.bankAccountId) ?? null : null });
  }

  return {
    items,
    batches: batches.map((b) => ({
      key: b.key,
      submissionId: b.first.id,
      status: b.first.status,
      createdAt: b.first.createdAt,
      rejectionReason: b.first.rejectionReason,
      investment: b.first.investment,
      approvedBdt: approvedByInvestment.get(b.first.investment.id) ?? 0,
      totalBdt: b.parts.reduce((s, p) => s + Number(p.amountBdt), 0),
      parts: b.parts,
    })),
    total, page, totalPages: Math.ceil(total / PAGE_SIZE),
  };
}

// ─── Investor: their own submissions for a given investment ──────────────────

export async function getSubmissionsForInvestment(investmentId: string, userId: string) {
  const rows = await db.manualPaymentSubmission.findMany({
    where: { investmentId, submittedBy: userId },
    select: {
      id: true,
      status: true,
      amountBdt: true,
      transactionRef: true,
      proofFileUrl: true,
      notes: true,
      rejectionReason: true,
      reviewedAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((r) => secureProof("manual", r));
}

// ─── Pending count for admin badge ───────────────────────────────────────────

export async function getPendingManualPaymentCount(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.PAYMENT_VIEW);
  const [project, group] = await Promise.all([
    db.manualPaymentSubmission.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
    db.groupInvestmentPayment.count({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
    }),
  ]);
  return project + group;
}

export async function getGroupPaymentSubmissions(
  session: SessionUser,
  opts: { status?: string; search?: string; page?: number } = {},
) {
  await requirePermission(session, PERMISSIONS.PAYMENT_VIEW);
  const { status, search, page = 1 } = opts;

  const where = {
    ...(status && { status: status as never }),
    ...(search && {
      OR: [
        { transactionRef: { contains: search, mode: "insensitive" as const } },
        { groupInvestment: { investor: { name: { contains: search, mode: "insensitive" as const } } } },
        { groupInvestment: { investor: { email: { contains: search, mode: "insensitive" as const } } } },
      ],
    }),
  };

  const [rows, total] = await Promise.all([
    db.groupInvestmentPayment.findMany({
      where,
      select: {
        id: true,
        status: true,
        amountBdt: true,
        transactionRef: true,
        proofFileUrl: true,
        proofMimeType: true,
        notes: true,
        rejectionReason: true,
        reviewedAt: true,
        createdAt: true,
        groupInvestment: {
          select: {
            id: true,
            amountBdt: true,
            tier: {
              select: {
                name: true,
                bankAccount: { select: { bankName: true, accountNumber: true } },
                entity: { select: { name: true, group: { select: { name: true } } } },
              },
            },
            investor: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.groupInvestmentPayment.count({ where }),
  ]);

  const items = rows.map((r) => secureProof("group", r));
  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}
