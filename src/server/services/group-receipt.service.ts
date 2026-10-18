/**
 * Group investment receipts.
 *
 * Documents are FK-bound to projects, so group receipts are not stored —
 * the PDF is rendered on demand from the GroupInvestment row, using the same
 * certificate layout as project receipts. /verify/<receiptNumber> checks
 * the receipt against the live record.
 */

import { db } from "@/lib/db/prisma";
import { can } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { ForbiddenError, NotFoundError, ValidationError } from "@/lib/errors";
import { renderInvestmentCertificate } from "@/lib/pdf/investment-certificate";
import type { SessionUser } from "@/lib/auth/session";

const RECEIPT_STATUSES = ["ACTIVE", "COMPLETED"] as const;

const groupReceiptSelect = {
  id: true,
  status: true,
  amountBdt: true,
  receiptNumber: true,
  confirmedAt: true,
  createdAt: true,
  investorUserId: true,
  investor: { select: { name: true, email: true, phone: true } },
  tier: {
    select: {
      name: true,
      type: true,
      expectedReturnPct: true,
      durationMonths: true,
      entity: { select: { name: true, group: { select: { name: true } } } },
    },
  },
} as const;

async function loadByReceiptNumber(receiptNumber: string) {
  return db.groupInvestment.findUnique({ where: { receiptNumber }, select: groupReceiptSelect });
}

type GroupReceiptRow = NonNullable<Awaited<ReturnType<typeof loadByReceiptNumber>>>;

function receiptFields(inv: GroupReceiptRow) {
  const amountBdt = Number(inv.amountBdt);
  const returnPct = inv.tier.expectedReturnPct != null ? Number(inv.tier.expectedReturnPct) : 0;
  const start = inv.confirmedAt ?? inv.createdAt;
  // Term in real calendar days for the tier's month count (12 months → 365 days).
  const end = new Date(start);
  end.setMonth(end.getMonth() + (inv.tier.durationMonths ?? 0));
  const { name: groupName } = inv.tier.entity.group;
  const entityName = inv.tier.entity.name;
  return {
    receiptNumber: inv.receiptNumber!,
    amountBdt,
    returnPct,
    expectedReturnBdt: Math.round(amountBdt * returnPct) / 100,
    activatedAt: start.toISOString(),
    durationDays: Math.round((end.getTime() - start.getTime()) / 86_400_000),
    title: [groupName, entityName === groupName ? null : entityName, inv.tier.name].filter(Boolean).join(" — "),
  };
}

/** Renders the receipt PDF for one group investment the session may access. */
export async function renderGroupReceipt(session: SessionUser, groupInvestmentId: string) {
  const inv = await db.groupInvestment.findUnique({ where: { id: groupInvestmentId }, select: groupReceiptSelect });
  if (!inv) throw new NotFoundError("Group investment");
  if (inv.investorUserId !== session.id && !(await can(session, PERMISSIONS.INVESTMENT_VIEW))) {
    throw new ForbiddenError("Access denied");
  }
  if (!inv.receiptNumber || !(RECEIPT_STATUSES as readonly string[]).includes(inv.status)) {
    throw new ValidationError("A receipt is available once the payment has been approved.");
  }

  const f = receiptFields(inv);
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyogclub.com").replace("http://localhost:3000", "https://biniyogclub.com");

  const pdf = await renderInvestmentCertificate({
    kind: "group",
    receiptNumber: f.receiptNumber,
    investmentId: inv.id,
    generatedAt: new Date().toISOString(),
    verificationUrl: `${appUrl}/verify/${f.receiptNumber}`,
    investor: { name: inv.investor.name ?? "Investor", email: inv.investor.email ?? "—", phone: inv.investor.phone },
    project: {
      title: f.title,
      expectedReturnPct: f.returnPct,
      durationDays: f.durationDays,
      category: inv.tier.type.replace(/_/g, " "),
    },
    investment: {
      amountBdt: f.amountBdt,
      expectedReturnBdt: f.expectedReturnBdt,
      returnType: "PROFIT_SHARE",
      activatedAt: f.activatedAt,
    },
  });

  return { pdf, filename: `group_receipt_${f.receiptNumber}.pdf` };
}

/** Public verification data for a GRP- receipt number, or null if none. */
export async function verifyGroupReceipt(receiptNumber: string) {
  const inv = await loadByReceiptNumber(receiptNumber);
  if (!inv) return null;
  const f = receiptFields(inv);
  const maturity = new Date(f.activatedAt);
  maturity.setDate(maturity.getDate() + f.durationDays);
  return {
    active: (RECEIPT_STATUSES as readonly string[]).includes(inv.status),
    data: {
      receiptNumber: f.receiptNumber,
      investorName: inv.investor.name ?? "—",
      projectTitle: f.title,
      location: null as string | null,
      amountBdt: f.amountBdt,
      expectedReturnBdt: f.expectedReturnBdt,
      returnPct: f.returnPct,
      activatedAt: f.activatedAt,
      maturityDate: maturity.toISOString(),
      status: inv.status,
    },
  };
}
