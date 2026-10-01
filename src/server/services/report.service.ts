/**
 * report.service.ts
 * Server-side CSV and Excel serializers.
 * All data is processed here — never sent raw to the browser.
 */

import ExcelJS from "exceljs";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReportRow = Record<string, string | number | null | undefined>;

export interface ReportColumn {
  key:   string;
  label: string;
  width?: number;
  fmt?:  (v: unknown) => string;
}

// ─── CSV ──────────────────────────────────────────────────────────────────────

export function toCSV(columns: ReportColumn[], rows: ReportRow[]): string {
  const escape = (v: unknown): string => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const header = columns.map((c) => escape(c.label)).join(",");
  const body   = rows.map((row) =>
    columns.map((c) => {
      const raw = row[c.key];
      return escape(c.fmt ? c.fmt(raw) : raw);
    }).join(","),
  );

  return [header, ...body].join("\r\n");
}

// ─── Excel ────────────────────────────────────────────────────────────────────

export async function toExcel(
  sheetName: string,
  columns: ReportColumn[],
  rows: ReportRow[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Biniyog Club";
  wb.created = new Date();

  const ws = wb.addWorksheet(sheetName);

  // Header row
  ws.columns = columns.map((c) => ({
    header: c.label,
    key:    c.key,
    width:  c.width ?? 20,
  }));

  // Style header
  ws.getRow(1).eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B4332" } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border    = { bottom: { style: "thin", color: { argb: "FF40916C" } } };
  });
  ws.getRow(1).height = 22;

  // Data rows
  rows.forEach((row, i) => {
    const values: Record<string, unknown> = {};
    for (const col of columns) {
      const raw = row[col.key];
      values[col.key] = col.fmt ? col.fmt(raw) : (raw ?? "");
    }
    const wsRow = ws.addRow(values);
    if (i % 2 === 1) {
      wsRow.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0FDF4" } };
      });
    }
  });

  // Auto-filter
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: columns.length } };

  return Buffer.from(await wb.xlsx.writeBuffer());
}

// ─── Column definitions ───────────────────────────────────────────────────────

const fmtBdt = (v: unknown) => v == null ? "" : `৳${Number(v).toLocaleString("en-BD")}`;
const fmtDate = (v: unknown) => v == null ? "" : new Date(v as string).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
const fmtPct  = (v: unknown) => v == null ? "" : `${Number(v).toFixed(2)}%`;

export const INVESTMENT_COLUMNS: ReportColumn[] = [
  { key: "receiptNumber",  label: "Receipt #",       width: 18 },
  { key: "investorName",   label: "Investor",         width: 24 },
  { key: "investorEmail",  label: "Email",            width: 28 },
  { key: "projectTitle",   label: "Project",          width: 30 },
  { key: "projectCategory",label: "Category",         width: 18 },
  { key: "amountBdt",      label: "Amount (BDT)",     width: 16, fmt: fmtBdt },
  { key: "expectedReturn", label: "Expected Return",  width: 18, fmt: fmtBdt },
  { key: "actualReturn",   label: "Actual Return",    width: 16, fmt: fmtBdt },
  { key: "returnType",     label: "Return Type",      width: 16 },
  { key: "status",         label: "Status",           width: 16 },
  { key: "confirmedAt",    label: "Confirmed",        width: 18, fmt: fmtDate },
  { key: "maturedAt",      label: "Matured",          width: 18, fmt: fmtDate },
  { key: "createdAt",      label: "Created",          width: 18, fmt: fmtDate },
];

export const PROJECT_COLUMNS: ReportColumn[] = [
  { key: "title",           label: "Project",          width: 32 },
  { key: "category",        label: "Category",         width: 18 },
  { key: "status",          label: "Status",           width: 16 },
  { key: "fundingGoalBdt",  label: "Goal (BDT)",       width: 16, fmt: fmtBdt },
  { key: "fundedAmountBdt", label: "Funded (BDT)",     width: 16, fmt: fmtBdt },
  { key: "fundingPct",      label: "Funded %",         width: 12, fmt: fmtPct },
  { key: "expectedReturnPct",label: "Return %",        width: 12, fmt: fmtPct },
  { key: "returnType",      label: "Return Type",      width: 16 },
  { key: "durationDays",    label: "Duration (days)",  width: 16 },
  { key: "investorCount",   label: "Investors",        width: 12 },
  { key: "location",        label: "Location",         width: 20 },
  { key: "fundingDeadline", label: "Deadline",         width: 18, fmt: fmtDate },
  { key: "completedAt",     label: "Completed",        width: 18, fmt: fmtDate },
  { key: "createdAt",       label: "Created",          width: 18, fmt: fmtDate },
];

export const PAYMENT_COLUMNS: ReportColumn[] = [
  { key: "id",              label: "ID",               width: 36 },
  { key: "direction",       label: "Direction",        width: 12 },
  { key: "method",          label: "Method",           width: 16 },
  { key: "status",          label: "Status",           width: 14 },
  { key: "amountBdt",       label: "Amount (BDT)",     width: 16, fmt: fmtBdt },
  { key: "feeBdt",          label: "Fee (BDT)",        width: 14, fmt: fmtBdt },
  { key: "netAmountBdt",    label: "Net (BDT)",        width: 14, fmt: fmtBdt },
  { key: "description",     label: "Description",      width: 28 },
  { key: "externalReference",label: "Reference",       width: 24 },
  { key: "processedAt",     label: "Processed",        width: 18, fmt: fmtDate },
  { key: "createdAt",       label: "Created",          width: 18, fmt: fmtDate },
];

export const DISTRIBUTION_COLUMNS: ReportColumn[] = [
  { key: "projectTitle",    label: "Project",          width: 30 },
  { key: "investorName",    label: "Investor",         width: 24 },
  { key: "receiptNumber",   label: "Receipt #",        width: 18 },
  { key: "principalBdt",    label: "Principal (BDT)",  width: 18, fmt: fmtBdt },
  { key: "amountBdt",       label: "Gross (BDT)",      width: 16, fmt: fmtBdt },
  { key: "platformFeeBdt",  label: "Platform Fee",     width: 16, fmt: fmtBdt },
  { key: "netAmountBdt",    label: "Net (BDT)",        width: 16, fmt: fmtBdt },
  { key: "distributedAt",   label: "Distributed",      width: 18, fmt: fmtDate },
];

export const INVESTOR_COLUMNS: ReportColumn[] = [
  { key: "name",            label: "Name",             width: 24 },
  { key: "email",           label: "Email",            width: 28 },
  { key: "phone",           label: "Phone",            width: 16 },
  { key: "status",          label: "Status",           width: 14 },
  { key: "kycStatus",       label: "KYC Status",       width: 16 },
  { key: "country",         label: "Country",          width: 14 },
  { key: "occupation",      label: "Occupation",       width: 20 },
  { key: "investmentCount", label: "Investments",      width: 14 },
  { key: "totalInvested",   label: "Total Invested",   width: 18, fmt: fmtBdt },
  { key: "createdAt",       label: "Joined",           width: 18, fmt: fmtDate },
];

// ─── Row mappers ──────────────────────────────────────────────────────────────

export function mapInvestmentRows(investments: ReturnType<typeof Array.prototype.map>): ReportRow[] {
  return (investments as never[]).map((i: never) => {
    const inv = i as {
      id: string; status: string; amountBdt: unknown; expectedReturnBdt: unknown;
      actualReturnBdt: unknown; returnType: string; receiptNumber: string | null;
      confirmedAt: unknown; maturedAt: unknown; cancelledAt: unknown; createdAt: unknown;
      project: { title: string; category: string; status: string };
      investorProfile: { user: { name: string; email: string; phone?: string } };
    };
    return {
      receiptNumber:   inv.receiptNumber ?? inv.id.slice(0, 8),
      investorName:    inv.investorProfile.user.name,
      investorEmail:   inv.investorProfile.user.email,
      projectTitle:    inv.project.title,
      projectCategory: inv.project.category,
      amountBdt:       Number(inv.amountBdt),
      expectedReturn:  Number(inv.expectedReturnBdt),
      actualReturn:    inv.actualReturnBdt ? Number(inv.actualReturnBdt) : null,
      returnType:      inv.returnType,
      status:          inv.status,
      confirmedAt:     inv.confirmedAt as string | null,
      maturedAt:       inv.maturedAt as string | null,
      createdAt:       inv.createdAt as string | null,
    };
  });
}

export function mapProjectRows(projects: unknown[]): ReportRow[] {
  return projects.map((p: unknown) => {
    const proj = p as {
      title: string; category: string; status: string;
      fundingGoalBdt: unknown; fundedAmountBdt: unknown;
      minInvestmentBdt: unknown; expectedReturnPct: unknown;
      returnType: string; durationDays: number;
      fundingDeadline: unknown; completedAt: unknown; createdAt: unknown;
      location: string | null;
      _count: { investments: number };
    };
    const goal   = Number(proj.fundingGoalBdt);
    const funded = Number(proj.fundedAmountBdt);
    return {
      title:            proj.title,
      category:         proj.category,
      status:           proj.status,
      fundingGoalBdt:   goal,
      fundedAmountBdt:  funded,
      fundingPct:       goal > 0 ? (funded / goal) * 100 : 0,
      expectedReturnPct:Number(proj.expectedReturnPct),
      returnType:       proj.returnType,
      durationDays:     proj.durationDays,
      investorCount:    proj._count.investments,
      location:         proj.location ?? "",
      fundingDeadline:  proj.fundingDeadline as string | null,
      completedAt:      proj.completedAt as string | null,
      createdAt:        proj.createdAt as string | null,
    };
  });
}

export function mapPaymentRows(payments: unknown[]): ReportRow[] {
  return payments.map((p: unknown) => {
    const pay = p as {
      id: string; direction: string; method: string; status: string;
      amountBdt: unknown; feeBdt: unknown; netAmountBdt: unknown;
      description: string | null; externalReference: string | null;
      processedAt: unknown; createdAt: unknown;
    };
    return {
      id:                pay.id,
      direction:         pay.direction,
      method:            pay.method,
      status:            pay.status,
      amountBdt:         Number(pay.amountBdt),
      feeBdt:            Number(pay.feeBdt),
      netAmountBdt:      Number(pay.netAmountBdt),
      description:       pay.description ?? "",
      externalReference: pay.externalReference ?? "",
      processedAt:       pay.processedAt as string | null,
      createdAt:         pay.createdAt as string | null,
    };
  });
}

export function mapDistributionRows(distributions: unknown[]): ReportRow[] {
  return distributions.map((d: unknown) => {
    const dist = d as {
      amountBdt: unknown; platformFeeBdt: unknown; netAmountBdt: unknown;
      distributedAt: unknown; notes: string | null;
      project: { title: string };
      investment: { amountBdt: unknown; receiptNumber: string | null; investorProfile?: { user: { name: string } } };
    };
    return {
      projectTitle:   dist.project.title,
      investorName:   dist.investment.investorProfile?.user.name ?? "",
      receiptNumber:  dist.investment.receiptNumber ?? "",
      principalBdt:   Number(dist.investment.amountBdt),
      amountBdt:      Number(dist.amountBdt),
      platformFeeBdt: Number(dist.platformFeeBdt),
      netAmountBdt:   Number(dist.netAmountBdt),
      distributedAt:  dist.distributedAt as string | null,
    };
  });
}

export function mapInvestorRows(investors: unknown[]): ReportRow[] {
  return investors.map((u: unknown) => {
    const user = u as {
      name: string; email: string; phone: string | null; status: string; createdAt: unknown;
      kyc: { status: string } | null;
      investorProfile: {
        country: string; occupation: string | null;
        _count: { investments: number };
        investments: { amountBdt: unknown }[];
      } | null;
    };
    const totalInvested = user.investorProfile?.investments.reduce((s, i) => s + Number(i.amountBdt), 0) ?? 0;
    return {
      name:            user.name,
      email:           user.email,
      phone:           user.phone ?? "",
      status:          user.status,
      kycStatus:       user.kyc?.status ?? "NOT_STARTED",
      country:         user.investorProfile?.country ?? "",
      occupation:      user.investorProfile?.occupation ?? "",
      investmentCount: user.investorProfile?._count.investments ?? 0,
      totalInvested,
      createdAt:       user.createdAt as string | null,
    };
  });
}
