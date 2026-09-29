export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminInvestments } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { cancelInvestmentAdminAction } from "@/server/actions/admin.actions";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Investments — Admin" };

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "MATURED", label: "Matured" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "REFUNDED", label: "Refunded" },
];

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "pending", PAYMENT_PENDING: "pending", ACTIVE: "active",
  MATURED: "completed", COMPLETED: "completed", CANCELLED: "cancelled", REFUNDED: "refunded",
};

export default async function AdminInvestmentsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminInvestments(session, { search, status, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Investments" description={`${total} total investments`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search investor, project, receipt..." className="w-64" />
        <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No investments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Project</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Receipt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((inv) => (
                  <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{inv.investorProfile.user.name}</p>
                      <p className="text-xs text-muted-foreground">{inv.investorProfile.user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-sm line-clamp-1">{inv.project.title}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium">{fmtBdt(inv.amountBdt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_VARIANT[inv.status] as never ?? "default"}>
                        {inv.status.replace(/_/g, " ")}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{inv.receiptNumber ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {["PENDING", "PAYMENT_PENDING", "ACTIVE"].includes(inv.status) && (
                        <AdminActionButton
                          label="Cancel"
                          confirmTitle="Cancel Investment"
                          confirmDescription={`Cancel this investment of ${fmtBdt(inv.amountBdt)} by ${inv.investorProfile.user.name}?`}
                          onConfirm={(reason) => cancelInvestmentAdminAction(inv.id, reason ?? "")}
                          requireReason
                          reasonPlaceholder="Reason for cancellation..."
                          variant="destructive"
                        />
                      )}
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
