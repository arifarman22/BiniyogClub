import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminFarmers } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Farmers — Admin" };

export default async function AdminFarmersPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminFarmers(session, { search, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Farmers" description={`${total} registered farmers`} />
      <AdminSearchBar placeholder="Search name or email..." className="w-64" />

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No farmers found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Farmer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Experience</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Specializations</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Farms</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((f) => (
                  <tr key={f.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{f.user.name}</p>
                      <p className="text-xs text-muted-foreground">{f.user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {f.yearsExperience != null ? `${f.yearsExperience} yrs` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {f.specializations.length > 0 ? f.specializations.join(", ") : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <StatusBadge status={f.user.status === "ACTIVE" ? "active" : "rejected"}>
                        {f.user.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right hidden lg:table-cell">
                      <span className="text-sm font-medium">{f._count.farms}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(f.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/users/${f.user.id}`} className="text-xs text-primary hover:underline">View →</Link>
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
