export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorPortfolio } from "@/server/data/investor.data";
import { cn } from "cn";

export const metadata: Metadata = { title: "Portfolio — Dashboard" };

const CATEGORY_LABELS: Record<string, string> = {
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing", OTHER: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", ACTIVE: "Active",
  MATURED: "Matured", CANCELLED: "Cancelled", DEFAULTED: "Defaulted",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted", CONFIRMED: "bg-info", ACTIVE: "bg-primary",
  MATURED: "bg-success", CANCELLED: "bg-destructive", DEFAULTED: "bg-destructive",
};

// Simple color palette for category bars
const CAT_COLORS = [
  "bg-primary", "bg-finance-500", "bg-harvest-500",
  "bg-brand-400", "bg-finance-600", "bg-harvest-600",
  "bg-brand-600", "bg-muted-foreground",
];

function formatBdt(n: number) {
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

export default async function PortfolioPage() {
  const session = await requireSession();

  let investments: Awaited<ReturnType<typeof getInvestorPortfolio>>["investments"];
  let categoryMap: Record<string, number>;
  let statusMap: Record<string, number>;
  let monthlyHistory: Awaited<ReturnType<typeof getInvestorPortfolio>>["monthlyHistory"];

  try {
    const data = await getInvestorPortfolio(session);
    investments = data.investments;
    categoryMap = data.categoryMap;
    statusMap = data.statusMap;
    monthlyHistory = data.monthlyHistory;
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground">Your investment portfolio</p>
        </div>
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-2xl mb-2">📈</p>
          <p className="font-medium">Profile setup required</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
            Complete your investor profile to view your portfolio.
          </p>
          <a href="/dashboard/profile" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            Complete Profile
          </a>
        </div>
      </div>
    );
  }

  const totalInvested = investments.reduce((s, i) => s + Number(i.amountBdt), 0);
  const totalExpected = investments.reduce((s, i) => s + Number(i.expectedReturnBdt), 0);
  const totalReturned = investments.reduce(
    (s, i) => s + i.distributions.reduce((ds, d) => ds + Number(d.netAmountBdt), 0),
    0,
  );

  const categoryEntries = Object.entries(categoryMap).sort((a, b) => b[1] - a[1]);
  const statusEntries = Object.entries(statusMap).sort((a, b) => b[1] - a[1]);
  const maxMonthly = Math.max(...monthlyHistory.map((m) => Math.max(m.invested, m.returned)), 1);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Portfolio</h1>
        <p className="text-sm text-muted-foreground">{investments.length} investments across {categoryEntries.length} categories</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Invested", value: formatBdt(totalInvested), sub: `${investments.length} investments` },
          { label: "Expected Returns", value: formatBdt(totalExpected), sub: "At maturity" },
          { label: "Returns Received", value: formatBdt(totalReturned), sub: "Distributed so far" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-primary">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category allocation */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-5 font-semibold">Allocation by Category</h2>
          {categoryEntries.length > 0 ? (
            <div className="space-y-3">
              {categoryEntries.map(([cat, amount], i) => {
                const pct = totalInvested > 0 ? Math.round((amount / totalInvested) * 100) : 0;
                return (
                  <div key={cat}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{CATEGORY_LABELS[cat] ?? cat}</span>
                      <span className="text-muted-foreground">{formatBdt(amount)} · {pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", CAT_COLORS[i % CAT_COLORS.length])}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No investments yet.</p>
          )}
        </div>

        {/* Status distribution */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-5 font-semibold">Investment Status Distribution</h2>
          {statusEntries.length > 0 ? (
            <div className="space-y-3">
              {statusEntries.map(([status, count]) => {
                const pct = investments.length > 0 ? Math.round((count / investments.length) * 100) : 0;
                return (
                  <div key={status}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="font-medium">{STATUS_LABELS[status] ?? status}</span>
                      <span className="text-muted-foreground">{count} · {pct}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn("h-full rounded-full", STATUS_COLORS[status] ?? "bg-muted-foreground")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No investments yet.</p>
          )}
        </div>
      </div>

      {/* Monthly history chart (bar chart using CSS) */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-2 font-semibold">Investment & Return History</h2>
        <p className="mb-5 text-xs text-muted-foreground">Last 12 months</p>
        <div className="flex items-end gap-1.5 h-40">
          {monthlyHistory.map(({ month, invested, returned }) => (
            <div key={month} className="flex flex-1 flex-col items-center gap-0.5">
              <div className="flex w-full items-end gap-0.5 h-32">
                <div
                  className="flex-1 rounded-t bg-primary/70 min-h-[2px] transition-all"
                  style={{ height: `${Math.round((invested / maxMonthly) * 100)}%` }}
                  title={`Invested: ${formatBdt(invested)}`}
                />
                <div
                  className="flex-1 rounded-t bg-harvest-500/70 min-h-[2px] transition-all"
                  style={{ height: `${Math.round((returned / maxMonthly) * 100)}%` }}
                  title={`Returned: ${formatBdt(returned)}`}
                />
              </div>
              <span className="text-[9px] text-muted-foreground rotate-45 origin-left mt-1">{month}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-4 text-xs">
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-primary/70" />Invested</span>
          <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-harvest-500/70" />Returns</span>
        </div>
      </div>

      {/* Investment history table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Investment History</h2>
        </div>
        {investments.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Invested</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden sm:table-cell">Expected</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">Received</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {investments.map((inv) => {
                const received = inv.distributions.reduce((s, d) => s + Number(d.netAmountBdt), 0);
                return (
                  <tr key={inv.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{inv.project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[inv.project.category] ?? inv.project.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">৳{Number(inv.amountBdt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground hidden sm:table-cell">
                      ৳{Number(inv.expectedReturnBdt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {received > 0 ? (
                        <span className="font-semibold text-success">৳{received.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium",
                        inv.status === "MATURED" ? "bg-success-muted text-success" :
                        inv.status === "ACTIVE" ? "bg-brand-100 text-brand-700" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="py-12 text-center text-sm text-muted-foreground">No investment history.</div>
        )}
      </div>
    </div>
  );
}
