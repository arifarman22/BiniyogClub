export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import {
  getFinancialReport, getProjectReport, getInvestmentReport,
  getInvestorReport, getOperationalReport,
} from "@/server/data/report.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ReportFilterBar } from "@/components/shared/report-filter-bar";
import { ExportButton } from "@/components/shared/export-button";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { TrendingUp, FolderKanban, Users, BarChart3, Activity, Layers } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Reports — Admin" };

const TABS = [
  { key: "financial",    label: "Financial",    icon: TrendingUp },
  { key: "projects",     label: "Projects",     icon: FolderKanban },
  { key: "investments",  label: "Investments",  icon: BarChart3 },
  { key: "investors",    label: "Investors",    icon: Users },
  { key: "operational",  label: "Operational",  icon: Activity },
] as const;

type Tab = typeof TABS[number]["key"];

const STATUS_OPTIONS = [
  { value: "PENDING",          label: "Pending" },
  { value: "ACTIVE",           label: "Active" },
  { value: "MATURED",          label: "Matured" },
  { value: "COMPLETED",        label: "Completed" },
  { value: "CANCELLED",        label: "Cancelled" },
];

const PROJECT_STATUS_OPTIONS = [
  { value: "DRAFT",            label: "Draft" },
  { value: "FUNDRAISING",      label: "Fundraising" },
  { value: "FUNDED",           label: "Funded" },
  { value: "ACTIVE",           label: "Active" },
  { value: "COMPLETED",        label: "Completed" },
  { value: "CANCELLED",        label: "Cancelled" },
];

const CATEGORY_OPTIONS = [
  { value: "REAL_ESTATE",      label: "Real Estate" },
  { value: "TRADE_FINANCE",    label: "Trade Finance" },
  { value: "SME",              label: "SME" },
  { value: "TECHNOLOGY",       label: "Technology" },
  { value: "INFRASTRUCTURE",   label: "Infrastructure" },
  { value: "OTHER",            label: "Other" },
];

export default async function AdminReportsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp  = await searchParams ?? {};
  const tab = (typeof sp.tab === "string" ? sp.tab : "financial") as Tab;

  const filters = {
    dateFrom:   typeof sp.dateFrom   === "string" ? sp.dateFrom   : undefined,
    dateTo:     typeof sp.dateTo     === "string" ? sp.dateTo     : undefined,
    projectId:  typeof sp.projectId  === "string" ? sp.projectId  : undefined,
    investorId: typeof sp.investorId === "string" ? sp.investorId : undefined,
    status:     typeof sp.status     === "string" ? sp.status     : undefined,
    category:   typeof sp.category   === "string" ? sp.category   : undefined,
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Platform analytics and data exports" />

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/admin/reports?tab=${key}`}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all",
              tab === key
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        ))}
      </div>

      {/* Tab content */}
      {tab === "financial" && <FinancialTab session={session} filters={filters} />}
      {tab === "projects"  && <ProjectsTab  session={session} filters={filters} />}
      {tab === "investments" && <InvestmentsTab session={session} filters={filters} />}
      {tab === "investors" && <InvestorsTab session={session} filters={filters} />}
      {tab === "operational" && <OperationalTab session={session} filters={filters} />}
    </div>
  );
}

// ─── Financial Tab ────────────────────────────────────────────────────────────

async function FinancialTab({ session, filters }: { session: never; filters: never }) {
  const data = await getFinancialReport(session, filters);

  const totalInvested  = data.investmentSummary.reduce((s, r) => s + Number(r._sum.amountBdt ?? 0), 0);
  const activeCapital  = data.investmentSummary.find((r) => r.status === "ACTIVE")?._sum.amountBdt ?? 0;
  const totalFees      = Number(data.distributionSummary._sum?.platformFeeBdt ?? 0);
  const totalDistributed = Number(data.distributionSummary._sum?.netAmountBdt ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange />
        <ExportButton reportType="investments" label="Export" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Invested"    value={fmtBdt(totalInvested)}    icon={<TrendingUp className="h-5 w-5" />} variant="finance" />
        <StatCard title="Active Capital"    value={fmtBdt(activeCapital)}    icon={<TrendingUp className="h-5 w-5" />} variant="brand" />
        <StatCard title="Platform Fees"     value={fmtBdt(totalFees)}        icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard title="Distributed"       value={fmtBdt(totalDistributed)} icon={<Layers className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportTable
          title="Investments by Status"
          headers={["Status", "Count", "Total Amount"]}
          rows={data.investmentSummary.map((r) => [
            r.status.replace(/_/g, " "),
            String(r._count._all),
            fmtBdt(r._sum.amountBdt ?? 0),
          ])}
        />
        <ReportTable
          title="Payments by Direction & Status"
          headers={["Direction", "Status", "Count", "Net Amount"]}
          rows={data.paymentSummary.map((r) => [
            r.direction, r.status.replace(/_/g, " "),
            String(r._count._all),
            fmtBdt(r._sum.netAmountBdt ?? 0),
          ])}
        />
        <ReportTable
          title="Withdrawals by Status"
          headers={["Status", "Count", "Total Amount"]}
          rows={data.withdrawalSummary.map((r) => [
            r.status.replace(/_/g, " "),
            String(r._count._all),
            fmtBdt(r._sum.amountBdt ?? 0),
          ])}
        />
        <ReportTable
          title="Monthly Investment Volume (12 months)"
          headers={["Month", "Investments", "Total (BDT)"]}
          rows={data.monthlyRevenue.map((r) => [
            r.month,
            String(r.count),
            fmtBdt(r.total),
          ])}
        />
      </div>
    </div>
  );
}

// ─── Projects Tab ─────────────────────────────────────────────────────────────

async function ProjectsTab({ session, filters }: { session: never; filters: never }) {
  const data = await getProjectReport(session, filters);
  const totalFunded = Number(data.fundingStats._sum.fundedAmountBdt ?? 0);
  const totalGoal   = Number(data.fundingStats._sum.fundingGoalBdt ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange statusOptions={PROJECT_STATUS_OPTIONS} categoryOptions={CATEGORY_OPTIONS} />
        <ExportButton reportType="projects" label="Export" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Projects"  value={data.fundingStats._count._all}  icon={<FolderKanban className="h-5 w-5" />} />
        <StatCard title="Total Goal"      value={fmtBdt(totalGoal)}              icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Total Funded"    value={fmtBdt(totalFunded)}            icon={<TrendingUp className="h-5 w-5" />} variant="finance" />
        <StatCard title="Avg Return %"    value={`${Number(data.fundingStats._avg.expectedReturnPct ?? 0).toFixed(1)}%`} icon={<BarChart3 className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportTable title="By Status"   headers={["Status", "Count", "Funded"]}   rows={data.byStatus.map((r) => [r.status.replace(/_/g, " "), String(r._count._all), fmtBdt(r._sum.fundedAmountBdt ?? 0)])} />
        <ReportTable title="By Category" headers={["Category", "Count", "Funded"]} rows={data.byCategory.map((r) => [r.category.replace(/_/g, " "), String(r._count._all), fmtBdt(r._sum.fundedAmountBdt ?? 0)])} />
      </div>

      <ReportTable
        title={`Projects (${data.projects.length})`}
        headers={["Project", "Category", "Status", "Funded", "Goal", "Investors", "Deadline"]}
        rows={data.projects.map((p) => [
          p.title,
          p.category.replace(/_/g, " "),
          p.status.replace(/_/g, " "),
          fmtBdt(p.fundedAmountBdt),
          fmtBdt(p.fundingGoalBdt),
          String(p._count.investments),
          fmtDate(p.fundingDeadline),
        ])}
      />
    </div>
  );
}

// ─── Investments Tab ──────────────────────────────────────────────────────────

async function InvestmentsTab({ session, filters }: { session: never; filters: never }) {
  const data = await getInvestmentReport(session, filters);
  const totalAmt = Number(data.aggregates._sum.amountBdt ?? 0);
  const avgAmt   = Number(data.aggregates._avg.amountBdt ?? 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange statusOptions={STATUS_OPTIONS} />
        <ExportButton reportType="investments" label="Export" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Investments" value={data.aggregates._count._all}  icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard title="Total Amount"      value={fmtBdt(totalAmt)}             icon={<TrendingUp className="h-5 w-5" />} variant="finance" />
        <StatCard title="Avg Investment"    value={fmtBdt(avgAmt)}               icon={<TrendingUp className="h-5 w-5" />} />
        <StatCard title="Top Investors"     value={data.topInvestors.length}      icon={<Users className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportTable title="By Status"      headers={["Status", "Count", "Amount"]}      rows={data.byStatus.map((r) => [r.status.replace(/_/g, " "), String(r._count._all), fmtBdt(r._sum.amountBdt ?? 0)])} />
        <ReportTable title="By Return Type" headers={["Return Type", "Count", "Amount"]} rows={data.byReturnType.map((r) => [r.returnType.replace(/_/g, " "), String(r._count._all), fmtBdt(r._sum.amountBdt ?? 0)])} />
      </div>

      <ReportTable
        title={`Recent Investments (${data.recentInvestments.length})`}
        headers={["Receipt #", "Investor", "Project", "Amount", "Status", "Created"]}
        rows={data.recentInvestments.map((i) => [
          i.receiptNumber ?? i.id.slice(0, 8),
          i.investorProfile.user.name,
          i.project.title,
          fmtBdt(i.amountBdt),
          i.status.replace(/_/g, " "),
          fmtDate(i.createdAt),
        ])}
      />
    </div>
  );
}

// ─── Investors Tab ────────────────────────────────────────────────────────────

async function InvestorsTab({ session, filters }: { session: never; filters: never }) {
  const data = await getInvestorReport(session, filters);
  const totalInvestors = data.investors.length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange showSearch searchPlaceholder="Search investors..." />
        <ExportButton reportType="investors" label="Export" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard title="Total Investors"  value={totalInvestors}              icon={<Users className="h-5 w-5" />} />
        <StatCard title="KYC Verified"     value={data.byKycStatus.find((r) => r.status === "VERIFIED")?._count._all ?? 0} icon={<Users className="h-5 w-5" />} variant="finance" />
        <StatCard title="Pending KYC"      value={(data.byKycStatus.find((r) => r.status === "SUBMITTED")?._count._all ?? 0) + (data.byKycStatus.find((r) => r.status === "UNDER_REVIEW")?._count._all ?? 0)} icon={<Activity className="h-5 w-5" />} />
        <StatCard title="Countries"        value={data.byCountry.length}       icon={<Layers className="h-5 w-5" />} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportTable title="KYC Status"     headers={["Status", "Count"]}   rows={data.byKycStatus.map((r) => [r.status.replace(/_/g, " "), String(r._count._all)])} />
        <ReportTable title="Top Countries"  headers={["Country", "Count"]}  rows={data.byCountry.map((r) => [r.country, String(r._count._all)])} />
        <ReportTable
          title="Monthly Registrations (12 months)"
          headers={["Month", "New Investors"]}
          rows={data.registrationTrend.map((r) => [r.month, String(r.count)])}
        />
      </div>

      <ReportTable
        title={`Investors (${totalInvestors})`}
        headers={["Name", "Email", "KYC", "Country", "Investments", "Joined"]}
        rows={data.investors.map((u) => [
          u.name, u.email,
          u.kyc?.status.replace(/_/g, " ") ?? "—",
          u.investorProfile?.country ?? "—",
          String(u.investorProfile?._count.investments ?? 0),
          fmtDate(u.createdAt),
        ])}
      />
    </div>
  );
}

// ─── Operational Tab ──────────────────────────────────────────────────────────

async function OperationalTab({ session, filters }: { session: never; filters: never }) {
  const data = await getOperationalReport(session, filters);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ReportTable title="KYC Queue"              headers={["Status", "Count"]}          rows={data.kycQueue.map((r) => [r.status.replace(/_/g, " "), String(r._count._all)])} />
        <ReportTable title="Pending Payments"       headers={["Status", "Count"]}          rows={data.pendingPayments.map((r) => [r.status.replace(/_/g, " "), String(r._count._all)])} />
        <ReportTable title="Withdrawals"            headers={["Status", "Count", "Amount"]} rows={data.pendingWithdrawals.map((r) => [r.status.replace(/_/g, " "), String(r._count._all), fmtBdt(r._sum.amountBdt ?? 0)])} />
        <ReportTable title="Audit Activity"         headers={["Action", "Count"]}          rows={data.auditActivity.map((r) => [r.action, String(r._count._all)])} />
        <ReportTable title="Notification Types"     headers={["Type", "Count"]}            rows={data.notificationStats.map((r) => [r.type.replace(/_/g, " "), String(r._count._all)])} />
        <ReportTable
          title="Daily Sessions (30 days)"
          headers={["Date", "Sessions"]}
          rows={data.sessionStats.map((r) => [r.date, String(r.count)])}
        />
      </div>
    </div>
  );
}

// ─── Shared table component ───────────────────────────────────────────────────

function ReportTable({ title, headers, rows }: { title: string; headers: string[]; rows: string[][] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-5 py-3">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No data</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {headers.map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-muted/20 transition-colors">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2.5 text-sm">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
