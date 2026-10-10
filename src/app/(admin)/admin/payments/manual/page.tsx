export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getManualPaymentSubmissions } from "@/server/data/manual-payment.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { ManualPaymentActions } from "@/components/admin/manual-payment-actions";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Manual Payment Review — Admin" };

const STATUS_OPTIONS = [
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED:    "bg-info/10 text-info border-info/30",
  UNDER_REVIEW: "bg-warning/10 text-warning border-warning/30",
  APPROVED:     "bg-success/10 text-success border-success/30",
  REJECTED:     "bg-destructive/10 text-destructive border-destructive/30",
};

export default async function ManualPaymentsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getManualPaymentSubmissions(session, { search, status, page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manual Payment Review"
        description={`${total} submissions — investors who transferred via bank and uploaded proof`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search investor, reference..." className="w-64" />
        <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      <div className="surface-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No submissions found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Project</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Tx Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {items.map((s) => (
                  <tr key={s.id} className="hover:bg-primary/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{s.investment.investorProfile.user.name}</p>
                      <p className="text-xs text-muted-foreground">{s.investment.investorProfile.user.email}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-xs line-clamp-1">{s.investment.project.title}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium">
                      {fmtBdt(s.amountBdt)}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs">{s.transactionRef}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[s.status])}>
                        {s.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(s.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <ManualPaymentActions
                        submissionId={s.id}
                        status={s.status}
                        proofFileUrl={s.proofFileUrl}
                        proofMimeType={s.proofMimeType}
                        notes={s.notes ?? undefined}
                        rejectionReason={s.rejectionReason ?? undefined}
                      />
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
