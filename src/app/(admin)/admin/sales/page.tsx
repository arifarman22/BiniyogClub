import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminSales } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Sales — Admin" };

export default async function AdminSalesPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminSales(session, { search, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Sales" description={`${total} sale records`} />
      <AdminSearchBar placeholder="Search project, buyer..." className="w-64" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No sales found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Crop</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Buyer</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Qty (kg)</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Price/kg</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.harvest.cropCycle.crop.name}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground line-clamp-1">{s.project.title}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{s.buyerName ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="font-mono text-sm">{Number(s.quantityKg).toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="font-mono text-sm">৳{Number(s.pricePerKgBdt).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium">{fmtBdt(s.totalAmountBdt)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(s.soldAt)}</span>
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
