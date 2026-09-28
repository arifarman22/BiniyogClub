import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminWithdrawals } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { approveWithdrawalAction, rejectWithdrawalAction, completeWithdrawalAction } from "@/server/actions/admin.actions";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Withdrawals — Admin" };

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "pending", APPROVED: "review", PROCESSING: "processing",
  COMPLETED: "completed", REJECTED: "rejected", CANCELLED: "cancelled",
};

export default async function AdminWithdrawalsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminWithdrawals(session, { search, status, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Withdrawals" description={`${total} total withdrawals`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search user, account..." className="w-64" />
        <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No withdrawals found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Account</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Requested</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((w) => (
                  <tr key={w.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{w.wallet.user.name}</p>
                      <p className="text-xs text-muted-foreground">{w.wallet.user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{w.method.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">
                        {w.accountNumber ?? w.mobileNumber ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium">{fmtBdt(w.amountBdt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_VARIANT[w.status] as never ?? "default"}>
                        {w.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(w.requestedAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {w.status === "PENDING" && (
                          <>
                            <AdminActionButton
                              label="Approve"
                              confirmTitle="Approve Withdrawal"
                              confirmDescription={`Approve withdrawal of ${fmtBdt(w.amountBdt)} for ${w.wallet.user.name}?`}
                              onConfirm={() => approveWithdrawalAction(w.id)}
                            />
                            <AdminActionButton
                              label="Reject"
                              confirmTitle="Reject Withdrawal"
                              confirmDescription={`Reject this withdrawal request?`}
                              onConfirm={(reason) => rejectWithdrawalAction(w.id, reason ?? "")}
                              requireReason
                              reasonPlaceholder="Reason for rejection..."
                              variant="destructive"
                            />
                          </>
                        )}
                        {w.status === "APPROVED" && (
                          <AdminActionButton
                            label="Mark Complete"
                            confirmTitle="Complete Withdrawal"
                            confirmDescription={`Mark this withdrawal as completed?`}
                            onConfirm={() => completeWithdrawalAction(w.id)}
                          />
                        )}
                      </div>
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
