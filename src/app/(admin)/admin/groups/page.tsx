export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminGroupInvestments, getAllGroupsAdmin } from "@/server/data/groups.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ManualPaymentActions } from "@/components/admin/manual-payment-actions";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Group Investments — Admin" };

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Pending" },
  { value: "PAYMENT_PENDING", label: "Payment Pending" },
  { value: "ACTIVE", label: "Active" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

const STATUS_COLORS: Record<string, string> = {
  PENDING:         "bg-muted text-muted-foreground border-border",
  PAYMENT_PENDING: "bg-warning/10 text-warning border-warning/30",
  ACTIVE:          "bg-success/10 text-success border-success/30",
  CANCELLED:       "bg-destructive/10 text-destructive border-destructive/30",
  COMPLETED:       "bg-brand-100 text-brand-700 border-brand-300/40",
};

const TIER_ICONS: Record<string, string> = {
  INVESTOR: "📈", SHAREHOLDER: "🏦", DIRECTORSHIP: "👔",
  PLOT_BOOKING: "🏗️", LAND_SHARE: "🌍",
};

export default async function AdminGroupsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));
  const view = typeof sp.view === "string" ? sp.view : "investments";

  const [{ items, total, totalPages }, groups] = await Promise.all([
    getAdminGroupInvestments({ search, status, page }),
    getAllGroupsAdmin(),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader title="Business Groups" description="Manage group investments across Mariners, MOHS, and Marinozz" />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <Link href="?view=investments" className={cn("border-b-2 px-4 py-2 text-sm font-medium transition-colors",
          view !== "structure" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          Investments ({total})
        </Link>
        <Link href="?view=structure" className={cn("border-b-2 px-4 py-2 text-sm font-medium transition-colors",
          view === "structure" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}>
          Group Structure
        </Link>
      </div>

      {view === "structure" ? (
        /* Group structure overview */
        <div className="space-y-4">
          {groups.map((group) => (
            <div key={group.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{group.name}</span>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium",
                    group.isActive ? "bg-success/10 text-success border-success/30" : "bg-muted text-muted-foreground border-border")}>
                    {group.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {group.entities.map((entity) => (
                  <div key={entity.id} className="px-4 py-3">
                    <p className="text-sm font-medium mb-2">{entity.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {entity.tiers.map((tier) => (
                        <div key={tier.id} className="rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                          <span className="mr-1">{TIER_ICONS[tier.type] ?? "💼"}</span>
                          <span className="font-medium">{tier.name}</span>
                          <span className="ml-2 text-muted-foreground">
                            {fmtBdt(tier.minAmountBdt)} min · {tier._count.investments} investors
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Investments list */
        <>
          <div className="flex flex-wrap items-center gap-3">
            <AdminSearchBar placeholder="Search investor, entity..." className="w-64" />
            <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {items.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">No group investments found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Group / Tier</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((inv) => {
                      const payment = inv.manualPayments[0];
                      return (
                        <tr key={inv.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-medium">{inv.investor.name}</p>
                            <p className="text-xs text-muted-foreground">{inv.investor.email}</p>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <p className="text-xs font-medium">{inv.tier.entity.group.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {TIER_ICONS[inv.tier.type]} {inv.tier.name}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-medium">{fmtBdt(inv.amountBdt)}</td>
                          <td className="px-4 py-3">
                            <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[inv.status])}>
                              {inv.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden xl:table-cell">
                            <span className="text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</span>
                          </td>
                          <td className="px-4 py-3">
                            {payment ? (
                              <ManualPaymentActions
                                submissionId={payment.id}
                                status={payment.status}
                                proofFileUrl={payment.proofFileUrl}
                                proofMimeType={payment.proofMimeType}
                                notes={payment.notes ?? undefined}
                                rejectionReason={payment.rejectionReason ?? undefined}
                                isGroupPayment
                              />
                            ) : (
                              <span className="text-xs text-muted-foreground">No proof yet</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <AdminPagination page={page} totalPages={totalPages} total={total} />
        </>
      )}
    </div>
  );
}
