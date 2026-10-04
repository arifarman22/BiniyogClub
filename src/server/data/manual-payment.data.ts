import { db } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import type { SessionUser } from "@/lib/auth/session";

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

  const [items, total] = await Promise.all([
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
      },
      orderBy: { createdAt: "desc" },
      skip: skip(page),
      take: PAGE_SIZE,
    }),
    db.manualPaymentSubmission.count({ where }),
  ]);

  return { items, total, page, totalPages: Math.ceil(total / PAGE_SIZE) };
}

// ─── Investor: their own submissions for a given investment ──────────────────

export async function getSubmissionsForInvestment(investmentId: string, userId: string) {
  return db.manualPaymentSubmission.findMany({
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
}

// ─── Pending count for admin badge ───────────────────────────────────────────

export async function getPendingManualPaymentCount(session: SessionUser) {
  await requirePermission(session, PERMISSIONS.PAYMENT_VIEW);
  return db.manualPaymentSubmission.count({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
  });
}
