export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminReports } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { fmtBdt } from "@/lib/admin/utils";
import { TrendingUp, FolderKanban, ArrowDownToLine } from "lucide-react";

export const metadata: Metadata = { title: "Reports — Admin" };

export default async function AdminReportsPage() {
  const session = await requireSession();
  const data = await getAdminReports(session);

  const totalInvested = data.investmentsByStatus.reduce((s, r) => s + Number(r._sum.amountBdt ?? 0), 0);
  const activeInvested = data.investmentsByStatus.find((r) => r.status === "ACTIVE")?._sum.amountBdt ?? 0;
  const totalWithdrawn = data.withdrawalStats.find((r) => r.status === "COMPLETED")?._sum.amountBdt ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Platform analytics overview" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard title="Total Invested" value={fmtBdt(totalInvested)} icon={<TrendingUp className="h-5 w-5" />} variant="finance" />
        <StatCard title="Active Capital" value={fmtBdt(activeInvested)} icon={<TrendingUp className="h-5 w-5" />} variant="brand" />
        <StatCard title="Total Withdrawn" value={fmtBdt(totalWithdrawn)} icon={<ArrowDownToLine className="h-5 w-5" />} />
        <StatCard title="Total Projects" value={data.projectsByStatus.reduce((s, r) => s + r._count._all, 0)} icon={<FolderKanban className="h-5 w-5" />} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Investments by status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Investments by Status</h2>
          <div className="space-y-2">
            {data.investmentsByStatus.map((row) => (
              <div key={row.status} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.status.replace(/_/g, " ")}</span>
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-muted-foreground">{fmtBdt(row._sum.amountBdt ?? 0)}</span>
                  <span className="w-8 text-right font-medium">{row._count._all}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Projects by status */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Projects by Status</h2>
          <div className="space-y-2">
            {data.projectsByStatus.map((row) => (
              <div key={row.status} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{row.status.replace(/_/g, " ")}</span>
                <span className="font-medium">{row._count._all}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top projects by funding */}
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Top Projects by Funding</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Status</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Funded</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Goal</th>
                  <th className="pb-2 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Investors</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.topProjects.map((p) => {
                  const pct = Math.min(100, Math.round((Number(p.fundedAmountBdt) / Number(p.fundingGoalBdt)) * 100));
                  return (
                    <tr key={p.id} className="hover:bg-muted/20">
                      <td className="py-2.5">
                        <p className="font-medium line-clamp-1">{p.title}</p>
                        <div className="mt-1 h-1 w-32 overflow-hidden rounded-full bg-muted">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="py-2.5 hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{p.status.replace(/_/g, " ")}</span>
                      </td>
                      <td className="py-2.5 text-right font-mono font-medium">{fmtBdt(p.fundedAmountBdt)}</td>
                      <td className="py-2.5 text-right font-mono text-muted-foreground hidden sm:table-cell">{fmtBdt(p.fundingGoalBdt)}</td>
                      <td className="py-2.5 text-right hidden lg:table-cell">{p._count.investments}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
