export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getManualPaymentSubmissions, getGroupPaymentSubmissions } from "@/server/data/manual-payment.data";
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
  const tab = typeof sp.tab === "string" ? sp.tab : "project";

  const [projectData, groupData] = await Promise.all([
    getManualPaymentSubmissions(session, { search, status, page }),
    getGroupPaymentSubmissions(session, { search, status, page }),
  ]);

  const { items: projectItems, total: projectTotal, totalPages: projectTotalPages } = projectData;
  const { items: groupItems, total: groupTotal, totalPages: groupTotalPages } = groupData;

  const isGroup = tab === "group";
  const items = isGroup ? groupItems : projectItems;
  const total = isGroup ? groupTotal : projectTotal;
  const totalPages = isGroup ? groupTotalPages : projectTotalPages;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manual Payment Review"
        description={`${projectTotal} project · ${groupTotal} group submissions pending review`}
      />

      {/* Tab switcher */}
      <div className="flex gap-2 border-b border-border">
        <Link
          href="?tab=project"
          className={cn("flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            !isGroup ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          Project Payments
          {projectTotal > 0 && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
              {projectTotal}
            </span>
          )}
        </Link>
        <Link
          href="?tab=group"
          className={cn("flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
            isGroup ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
        >
          Group Payments
          {groupTotal > 0 && (
            <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
              {groupTotal}
            </span>
          )}
        </Link>
      </div>

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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">
                    {isGroup ? "Group / Tier" : "Project"}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Tx Ref</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {isGroup
                  ? groupItems.map((s) => (
                      <tr key={s.id} className="hover:bg-primary/[0.03] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{s.groupInvestment.investor.name}</p>
                          <p className="text-xs text-muted-foreground">{s.groupInvestment.investor.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs font-medium">{s.groupInvestment.tier.entity.group.name}</p>
                          <p className="text-xs text-muted-foreground">{s.groupInvestment.tier.entity.name} — {s.groupInvestment.tier.name}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">{fmtBdt(s.amountBdt)}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="font-mono text-xs">{s.transactionRef}</span>
                          {s.groupInvestment.tier.bankAccount && (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              to {s.groupInvestment.tier.bankAccount.bankName} · {s.groupInvestment.tier.bankAccount.accountNumber}
                            </p>
                          )}
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
                            isGroupPayment
                          />
                        </td>
                      </tr>
                    ))
                  : projectItems.map((s) => (
                      <tr key={s.id} className="hover:bg-primary/[0.03] transition-colors">
                        <td className="px-4 py-3">
                          <p className="font-medium">{s.investment.investorProfile.user.name}</p>
                          <p className="text-xs text-muted-foreground">{s.investment.investorProfile.user.email}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <p className="text-xs line-clamp-1">{s.investment.project.title}</p>
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-medium">{fmtBdt(s.amountBdt)}</td>
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
