export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminPayments } from "@/server/data/admin.data";
import { getPendingManualPaymentCount } from "@/server/data/manual-payment.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";
import type { AsyncComponentProps } from "@/types";


export const metadata: Metadata = { title: "Payments — Admin" };

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Processing" },
  { value: "COMPLETED", label: "Completed" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
  { value: "CANCELLED", label: "Cancelled" },
];

const DIRECTION_OPTIONS = [
  { value: "INBOUND", label: "Inbound" },
  { value: "OUTBOUND", label: "Outbound" },
];

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "pending", PROCESSING: "processing", COMPLETED: "completed",
  FAILED: "rejected", REFUNDED: "refunded", CANCELLED: "cancelled",
};

export default async function AdminPaymentsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const direction = typeof sp.direction === "string" ? sp.direction : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const [{ items, total, totalPages }, pendingManual] = await Promise.all([
    getAdminPayments(session, { search, status, direction, page }),
    getPendingManualPaymentCount(session),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Payments" description={`${total} gateway payments`} />

      {/* Sub-navigation */}
      <div className="flex gap-2 border-b border-border pb-0">
        <Link
          href="/admin/payments"
          className="border-b-2 border-primary px-4 py-2 text-sm font-medium text-primary"
        >
          Gateway Payments
        </Link>
        <Link
          href="/admin/payments/manual"
          className="relative flex items-center gap-1.5 border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Manual Review
          {pendingManual > 0 && (
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
              {pendingManual}
            </span>
          )}
        </Link>
        <Link
          href="/admin/payments/bank-accounts"
          className="border-b-2 border-transparent px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Bank Accounts
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search user, reference..." className="w-64" />
        <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
        <AdminFilterBar paramName="direction" options={DIRECTION_OPTIONS} allLabel="All Directions" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No payments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Direction</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{p.wallet.user?.name}</p>
                      <p className="text-xs text-muted-foreground">{p.wallet.user?.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{p.method.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={cn(
                        "text-xs font-medium",
                        p.direction === "INBOUND" ? "text-success" : "text-destructive",
                      )}>
                        {p.direction}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium">{fmtBdt(p.amountBdt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_VARIANT[p.status] as never ?? "default"}>
                        {p.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(p.createdAt)}</span>
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
