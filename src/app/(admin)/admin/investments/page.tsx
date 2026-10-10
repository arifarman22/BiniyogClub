export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminInvestments } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSortButton } from "@/components/admin/admin-sort-button";
import { ProjectFilterSelect } from "@/components/admin/project-filter-select";
import { InvestmentActionButtons } from "@/components/admin/investment-action-buttons";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Investments — Admin" };

const STATUS_VARIANT: Record<string, string> = {
  PENDING: "pending", PAYMENT_PENDING: "pending", ACTIVE: "active",
  MATURED: "completed", COMPLETED: "completed", CANCELLED: "cancelled", REFUNDED: "refunded",
};

const RETURN_TYPE_LABEL: Record<string, string> = {
  FIXED_RETURN: "Fixed", PROFIT_SHARE: "Profit Share", HYBRID: "Hybrid",
};

export default async function AdminInvestmentsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const str = (k: string) => (typeof sp[k] === "string" ? sp[k] as string : "");
  const search  = str("search");
  const status  = str("status");
  const project = str("project");
  const sort    = str("sort") || "createdAt";
  const order   = str("order") || "desc";
  const page    = Math.max(1, parseInt(str("page") || "1", 10));

  const { items, total, totalPages, counts, projectList, totalAmountBdt } = await getAdminInvestments(
    session, { search, status, project, sort, order, page },
  );

  const STATUS_OPTIONS = [
    { value: "PENDING",         label: "Pending",         count: counts.PENDING         ?? 0 },
    { value: "PAYMENT_PENDING", label: "Payment Pending", count: counts.PAYMENT_PENDING ?? 0 },
    { value: "ACTIVE",          label: "Active",          count: counts.ACTIVE          ?? 0 },
    { value: "MATURED",         label: "Matured",         count: counts.MATURED         ?? 0 },
    { value: "COMPLETED",       label: "Completed",       count: counts.COMPLETED       ?? 0 },
    { value: "CANCELLED",       label: "Cancelled",       count: counts.CANCELLED       ?? 0 },
    { value: "REFUNDED",        label: "Refunded",        count: counts.REFUNDED        ?? 0 },
  ];

  // KPIs — all from server aggregates, not page-slice
  const activeCount  = counts.ACTIVE  ?? 0;
  const pendingCount = (counts.PENDING ?? 0) + (counts.PAYMENT_PENDING ?? 0);

  return (
    <div className="space-y-5">
      <PageHeader title="Investments" description={`${total} total investments`} />

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: status ? `Invested (${status.replace(/_/g, " ")})` : "Total Invested (active+)", value: fmtBdt(totalAmountBdt) },
          { label: "Active", value: activeCount },
          { label: "Pending / Payment", value: pendingCount },
          { label: "Total records", value: total },
        ].map((k) => (
          <div key={k.label} className="surface-card px-4 py-3">
            <p className="text-xs text-muted-foreground">{k.label}</p>
            <p className="mt-0.5 text-lg font-semibold">{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search investor, email, phone, project, receipt…" className="w-72" />
        <ProjectFilterSelect projects={projectList} />
      </div>
      <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />

      {/* Table */}
      <div className="surface-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No investments found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left">
                    <AdminSortButton column="investor" label="Investor" />
                  </th>
                  <th className="px-4 py-3 text-left hidden md:table-cell">
                    <AdminSortButton column="project" label="Project" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <AdminSortButton column="amount" label="Amount" className="justify-end w-full" />
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Return</span>
                  </th>
                  <th className="px-4 py-3 text-left">
                    <AdminSortButton column="status" label="Status" />
                  </th>
                  <th className="px-4 py-3 text-left hidden lg:table-cell">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</span>
                  </th>
                  <th className="px-4 py-3 text-left hidden xl:table-cell">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Receipt</span>
                  </th>
                  <th className="px-4 py-3 text-left hidden xl:table-cell">
                    <AdminSortButton column="activatedAt" label="Activated" />
                  </th>
                  <th className="px-4 py-3 text-left hidden 2xl:table-cell">
                    <AdminSortButton column="createdAt" label="Created" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((inv) => {
                  const hasManual = inv.manualPayments.length > 0;
                  const manualStatus = inv.manualPayments[0]?.status;
                  const returnPct = Number(inv.project.expectedReturnPct) * 100;

                  return (
                    <tr key={inv.id} className="hover:bg-primary/[0.03] transition-colors">
                      {/* Investor */}
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{inv.investorProfile.user.name}</p>
                        <p className="text-xs text-muted-foreground">{inv.investorProfile.user.email}</p>
                        {inv.investorProfile.user.phone && (
                          <p className="text-xs text-muted-foreground">{inv.investorProfile.user.phone}</p>
                        )}
                      </td>

                      {/* Project */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-sm font-medium line-clamp-1">{inv.project.title}</p>
                        <p className="text-xs text-muted-foreground">{inv.project.status.replace(/_/g, " ")}</p>
                      </td>

                      {/* Amount */}
                      <td className="px-4 py-3 text-right">
                        <p className="font-mono font-semibold">{fmtBdt(inv.amountBdt)}</p>
                        <p className="text-xs text-muted-foreground font-mono">
                          +{fmtBdt(inv.expectedReturnBdt)}
                        </p>
                      </td>

                      {/* Return type + % */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <p className="text-xs font-medium">{RETURN_TYPE_LABEL[inv.returnType] ?? inv.returnType}</p>
                        <p className="text-xs text-muted-foreground">{returnPct.toFixed(1)}%</p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <StatusBadge status={STATUS_VARIANT[inv.status] as never ?? "default"}>
                          {inv.status.replace(/_/g, " ")}
                        </StatusBadge>
                      </td>

                      {/* Payment method */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {hasManual ? (
                          <div>
                            <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                              Bank Transfer
                            </span>
                            {manualStatus && (
                              <p className="mt-0.5 text-[10px] text-muted-foreground">{manualStatus.replace(/_/g, " ")}</p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                            Wallet
                          </span>
                        )}
                      </td>

                      {/* Receipt */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">
                          {inv.receiptNumber ?? "—"}
                        </span>
                      </td>

                      {/* Activated */}
                      <td className="px-4 py-3 hidden xl:table-cell">
                        <span className="text-xs text-muted-foreground">{fmtDate(inv.activatedAt)}</span>
                      </td>

                      {/* Created */}
                      <td className="px-4 py-3 hidden 2xl:table-cell">
                        <span className="text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <InvestmentActionButtons
                          investmentId={inv.id}
                          status={inv.status}
                          amountLabel={fmtBdt(inv.amountBdt)}
                          investorName={inv.investorProfile.user.name}
                        />
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
    </div>
  );
}
