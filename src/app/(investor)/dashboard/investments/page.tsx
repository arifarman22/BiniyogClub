import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getInvestorInvestments } from "@/server/data/investor.data";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";

export const metadata: Metadata = { title: "Investments — Dashboard" };

const STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-muted text-muted-foreground border-border",
  CONFIRMED: "bg-info-muted text-info-foreground border-info/30",
  ACTIVE:    "bg-brand-100 text-brand-700 border-brand-400/30",
  MATURED:   "bg-success-muted text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
  DEFAULTED: "bg-destructive/10 text-destructive border-destructive/30",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", ACTIVE: "Active",
  MATURED: "Matured", CANCELLED: "Cancelled", DEFAULTED: "Defaulted",
};

const CATEGORY_LABELS: Record<string, string> = {
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing", OTHER: "Other",
};

function formatBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

function maturityDate(inv: { activatedAt: Date | null; project: { durationDays: number } }) {
  if (!inv.activatedAt) return null;
  const d = new Date(inv.activatedAt);
  d.setDate(d.getDate() + inv.project.durationDays);
  return d;
}

function progressPct(inv: { project: { fundedAmountBdt: { toString(): string }; fundingGoalBdt: { toString(): string } } }) {
  const funded = Number(inv.project.fundedAmountBdt.toString());
  const goal = Number(inv.project.fundingGoalBdt.toString());
  if (goal === 0) return 0;
  return Math.min(100, Math.round((funded / goal) * 100));
}

export default async function InvestmentsPage() {
  const session = await requireSession();
  const investments = await getInvestorInvestments(session);

  const totalInvested = investments.reduce((s, i) => s + Number(i.amountBdt), 0);
  const totalExpected = investments.reduce((s, i) => s + Number(i.expectedReturnBdt), 0);
  const totalActual = investments
    .filter((i) => i.actualReturnBdt)
    .reduce((s, i) => s + Number(i.actualReturnBdt), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Investments</h1>
        <p className="text-sm text-muted-foreground">{investments.length} total investments</p>
      </div>

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Invested", value: formatBdt(totalInvested) },
          { label: "Expected Returns", value: formatBdt(totalExpected) },
          { label: "Actual Returns Received", value: formatBdt(totalActual) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      {investments.length > 0 ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Maturity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">Progress</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden md:table-cell">Return</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {investments.map((inv) => {
                const maturity = maturityDate(inv);
                const pct = progressPct(inv);
                const returnPct = Number(inv.project.expectedReturnPct);
                return (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/projects/${inv.project.slug}`} className="hover:text-primary">
                        <p className="font-medium line-clamp-1">{inv.project.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {CATEGORY_LABELS[inv.project.category] ?? inv.project.category}
                          {" · "}{inv.project.farm.district}
                        </p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatBdt(inv.amountBdt.toString())}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {fmtDate(inv.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
                        {STATUS_LABELS[inv.status] ?? inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                      {maturity ? fmtDate(maturity) : "—"}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      {inv.actualReturnBdt ? (
                        <span className="text-sm font-semibold text-success">
                          {formatBdt(inv.actualReturnBdt.toString())}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {returnPct.toFixed(1)}% exp.
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="font-medium">No investments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse projects to make your first investment.</p>
          <Link href="/projects" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            Browse Projects
          </Link>
        </div>
      )}
    </div>
  );
}
