import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminFarms } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Farms — Admin" };

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "SUSPENDED", label: "Suspended" },
];

export default async function AdminFarmsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminFarms(session, { search, status, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Farms" description={`${total} registered farms`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search name, district..." className="w-64" />
        <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No farms found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Farm</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Farmer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Location</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Area (acres)</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Fields</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Projects</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.name}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm">{f.farmerProfile.user.name}</p>
                      <p className="text-xs text-muted-foreground">{f.farmerProfile.user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{f.district}, {f.division}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="font-mono text-sm">{Number(f.totalAreaAcres).toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={f.status === "ACTIVE" ? "active" : "inactive"}>
                        {f.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm">{f._count.fields}</span>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className="text-sm">{f._count.projects}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(f.createdAt)}</span>
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
