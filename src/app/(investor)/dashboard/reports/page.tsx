export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import {
  getInvestorPortfolioReport,
  getInvestorTransactionStatement,
  getInvestorDistributionHistory,
} from "@/server/data/report.data";
import { getInvestorInvestments } from "@/server/data/investor.data";
import { ReportFilterBar } from "@/components/shared/report-filter-bar";
import { ExportButton } from "@/components/shared/export-button";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { TrendingUp, BarChart3, Receipt, Layers, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Reports — Dashboard" };

const TABS = [
  { key: "portfolio",     label: "Portfolio",           icon: TrendingUp },
  { key: "history",       label: "Investment History",  icon: BarChart3 },
  { key: "transactions",  label: "Transactions",        icon: Receipt },
  { key: "distributions", label: "Distributions",       icon: Layers },
] as const;

type Tab = typeof TABS[number]["key"];

const PAYMENT_STATUS_OPTIONS = [
  { value: "PENDING",    label: "Pending" },
  { value: "COMPLETED",  label: "Completed" },
  { value: "FAILED",     label: "Failed" },
  { value: "REFUNDED",   label: "Refunded" },
];

const INVESTMENT_STATUS_OPTIONS = [
  { value: "ACTIVE",     label: "Active" },
  { value: "MATURED",    label: "Matured" },
  { value: "COMPLETED",  label: "Completed" },
  { value: "CANCELLED",  label: "Cancelled" },
];

function fmtNum(n: number) {
  return n.toLocaleString("en-BD");
}

export default async function InvestorReportsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp  = await searchParams ?? {};
  const tab = (typeof sp.tab === "string" ? sp.tab : "portfolio") as Tab;

  const filters = {
    dateFrom:  typeof sp.dateFrom  === "string" ? sp.dateFrom  : undefined,
    dateTo:    typeof sp.dateTo    === "string" ? sp.dateTo    : undefined,
    projectId: typeof sp.projectId === "string" ? sp.projectId : undefined,
    status:    typeof sp.status    === "string" ? sp.status    : undefined,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Reports</h1>
        <p className="text-sm text-muted-foreground">Your investment analytics and statements</p>
      </div>

      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-border bg-muted/30 p-1">
        {TABS.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/dashboard/reports?tab=${key}`}
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

      {tab === "portfolio"     && <PortfolioTab     session={session} />}
      {tab === "history"       && <HistoryTab       session={session} filters={filters} />}
      {tab === "transactions"  && <TransactionsTab  session={session} filters={filters} />}
      {tab === "distributions" && <DistributionsTab session={session} filters={filters} />}
    </div>
  );
}

// ─── Portfolio Tab ────────────────────────────────────────────────────────────

async function PortfolioTab({ session }: { session: never }) {
  const data = await getInvestorPortfolioReport(session);

  const roi = data.totalInvested > 0
    ? ((data.totalReturns / data.totalInvested) * 100).toFixed(2)
    : "0.00";

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <ExportButton reportType="investments" label="Export Portfolio" formats={["csv", "excel"]} />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Total Invested"  value={fmtBdt(data.totalInvested)} sub="all time" />
        <KpiCard label="Active Capital"  value={fmtBdt(data.activeCapital)} sub="currently deployed" />
        <KpiCard label="Total Returns"   value={fmtBdt(data.totalReturns)}  sub="distributed" />
        <KpiCard label="ROI"             value={`${roi}%`}                  sub="return on investment" />
      </div>

      {/* Allocation by category */}
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Allocation by Category</h3>
          <div className="space-y-3">
            {Object.entries(data.byCategory).map(([cat, amt]) => {
              const pct = data.totalInvested > 0 ? (amt / data.totalInvested) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{cat.replace(/_/g, " ")}</span>
                    <span className="font-medium">{fmtBdt(amt)} <span className="text-muted-foreground">({pct.toFixed(1)}%)</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 text-sm font-semibold">Investments by Status</h3>
          <div className="space-y-2">
            {Object.entries(data.byStatus).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{status.replace(/_/g, " ")}</span>
                <span className="font-medium">{fmtNum(count)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Investment History Tab ───────────────────────────────────────────────────

async function HistoryTab({ session, filters }: { session: never; filters: never }) {
  const investments = await getInvestorInvestments(session);

  const filtered = investments.filter((i) => {
    const f = filters as { dateFrom?: string; dateTo?: string; status?: string };
    if (f.status && i.status !== f.status) return false;
    if (f.dateFrom && new Date(i.createdAt) < new Date(f.dateFrom)) return false;
    if (f.dateTo   && new Date(i.createdAt) > new Date(f.dateTo + "T23:59:59Z")) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange statusOptions={INVESTMENT_STATUS_OPTIONS} />
        <ExportButton reportType="investments" label="Export" formats={["csv", "excel"]} />
      </div>

      <p className="text-xs text-muted-foreground">{filtered.length} investments</p>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Project", "Amount", "Expected Return", "Status", "Confirmed", "Matured"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No investments found.</td></tr>
              ) : filtered.map((i) => (
                <tr key={i.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium line-clamp-1">{i.project.title}</p>
                    <p className="text-xs text-muted-foreground">{i.project.category.replace(/_/g, " ")}</p>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{fmtBdt(i.amountBdt)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-green-600">{fmtBdt(i.expectedReturnBdt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{i.status.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(i.confirmedAt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(i.maturedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Transactions Tab ─────────────────────────────────────────────────────────

async function TransactionsTab({ session, filters }: { session: never; filters: never }) {
  const data = await getInvestorTransactionStatement(session, filters);

  const totalIn  = data.payments.filter((p) => p.direction === "INBOUND" && p.status === "COMPLETED").reduce((s, p) => s + Number(p.netAmountBdt), 0);
  const totalOut = data.payments.filter((p) => p.direction === "OUTBOUND" && p.status === "COMPLETED").reduce((s, p) => s + Number(p.netAmountBdt), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange statusOptions={PAYMENT_STATUS_OPTIONS} />
        <ExportButton reportType="payments" label="Export" formats={["csv", "excel"]} />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <KpiCard label="Total In"   value={fmtBdt(totalIn)}  sub="inbound completed" />
        <KpiCard label="Total Out"  value={fmtBdt(totalOut)} sub="outbound completed" />
        <KpiCard label="Transactions" value={String(data.payments.length)} sub="all time" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Type", "Method", "Amount", "Fee", "Net", "Status", "Date"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.payments.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-sm text-muted-foreground">No transactions found.</td></tr>
              ) : data.payments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      {p.direction === "INBOUND"
                        ? <ArrowDownLeft className="h-3.5 w-3.5 text-green-600" />
                        : <ArrowUpRight  className="h-3.5 w-3.5 text-red-500" />}
                      <span className="text-xs">{p.direction}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{p.method.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 font-mono text-sm">{fmtBdt(p.amountBdt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtBdt(p.feeBdt)}</td>
                  <td className="px-4 py-3 font-mono text-sm font-medium">{fmtBdt(p.netAmountBdt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{p.status}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Distributions Tab ────────────────────────────────────────────────────────

async function DistributionsTab({ session, filters }: { session: never; filters: never }) {
  const distributions = await getInvestorDistributionHistory(session, filters);

  const totalNet   = distributions.reduce((s, d) => s + Number(d.netAmountBdt), 0);
  const totalGross = distributions.reduce((s, d) => s + Number(d.amountBdt), 0);
  const totalFees  = distributions.reduce((s, d) => s + Number(d.platformFeeBdt), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ReportFilterBar showDateRange />
        <ExportButton reportType="distributions" label="Export" formats={["csv", "excel"]} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Gross Distributed" value={fmtBdt(totalGross)} sub="before fees" />
        <KpiCard label="Platform Fees"     value={fmtBdt(totalFees)}  sub="deducted" />
        <KpiCard label="Net Received"      value={fmtBdt(totalNet)}   sub="to your wallet" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["Project", "Receipt #", "Gross", "Fee", "Net", "Date"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {distributions.length === 0 ? (
                <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No distributions yet.</td></tr>
              ) : distributions.map((d) => (
                <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium line-clamp-1">{d.project.title}</p>
                    <p className="text-xs text-muted-foreground">{d.project.category.replace(/_/g, " ")}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{d.investment.receiptNumber ?? "—"}</td>
                  <td className="px-4 py-3 font-mono text-sm">{fmtBdt(d.amountBdt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fmtBdt(d.platformFeeBdt)}</td>
                  <td className="px-4 py-3 font-mono text-sm font-medium text-green-600">{fmtBdt(d.netAmountBdt)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(d.distributedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Shared KPI card ──────────────────────────────────────────────────────────

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
