import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminDistributions } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Distributions — Admin" };

export default async function AdminDistributionsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminDistributions(session, { search, page });

  const totalDistributed = items.reduce((s, d) => s + Number(d.netAmountBdt), 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Profit Distributions" description={`${total} distributions · ${fmtBdt(totalDistributed)} on this page`} />
      <AdminSearchBar placeholder="Search project, investor..." className="w-64" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No distributions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Project</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gross</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Platform Fee</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{d.investment.investorProfile.user.name}</p>
                      <p className="text-xs text-muted-foreground">{d.investment.investorProfile.user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground line-clamp-1">{d.project.title}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono text-sm">{fmtBdt(d.amountBdt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="font-mono text-sm text-muted-foreground">{fmtBdt(d.platformFeeBdt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium text-success">{fmtBdt(d.netAmountBdt)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(d.distributedAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
