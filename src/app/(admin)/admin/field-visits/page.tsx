import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminFieldVisits } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Field Visits — Admin" };

const STATUS_OPTIONS = [
  { value: "SCHEDULED", label: "Scheduled" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_VARIANT: Record<string, string> = {
  SCHEDULED: "pending", IN_PROGRESS: "processing",
  COMPLETED: "completed", CANCELLED: "cancelled",
};

export default async function AdminFieldVisitsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminFieldVisits(session, { search, status, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Field Visits" description={`${total} total visits`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search project..." className="w-64" />
        <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No field visits found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Officer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Scheduled</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Completed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((v) => (
                  <tr key={v.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{v.project.title}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm">{v.fieldOfficerProfile.user.name}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_VARIANT[v.status] as never ?? "default"}>
                        {v.status.replace(/_/g, " ")}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(v.scheduledAt)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(v.completedAt)}</span>
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
