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
import { cashReceiverLabel, methodLabel } from "@/lib/payments/split-payment";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";
import {
  User, Building2, Banknote, FileText, Calendar,
  CheckCircle2, Clock, XCircle, AlertCircle, Landmark, ReceiptText,
} from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Manual Payment Review — Admin" };

const STATUS_OPTIONS = [
  { value: "SUBMITTED",    label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "APPROVED",     label: "Approved" },
  { value: "REJECTED",     label: "Rejected" },
];

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; cls: string; dot: string }> = {
  SUBMITTED:    { label: "Submitted",    icon: Clock,         cls: "bg-info/10 text-info border-info/30",                dot: "bg-info" },
  UNDER_REVIEW: { label: "Under Review", icon: AlertCircle,   cls: "bg-warning/10 text-warning border-warning/30",       dot: "bg-warning" },
  APPROVED:     { label: "Approved",     icon: CheckCircle2,  cls: "bg-success/10 text-success border-success/30",       dot: "bg-success" },
  REJECTED:     { label: "Rejected",     icon: XCircle,       cls: "bg-destructive/10 text-destructive border-destructive/30", dot: "bg-destructive" },
};

const METHOD_ICON: Record<string, React.ElementType> = {
  BANK_TRANSFER: Landmark,
  CHECK:         ReceiptText,
  CASH:          Banknote,
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SUBMITTED;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", cfg.cls)}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </span>
  );
}

function DetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-[11px] text-muted-foreground shrink-0 w-24">{label}</span>
      <span className={cn("text-[11px] font-medium text-right break-all", mono && "font-mono")}>{value}</span>
    </div>
  );
}

export default async function ManualPaymentsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page   = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));
  const tab    = typeof sp.tab === "string" ? sp.tab : "project";

  const [projectData, groupData] = await Promise.all([
    getManualPaymentSubmissions(session, { search, status, page }),
    getGroupPaymentSubmissions(session,  { search, status, page }),
  ]);

  const { batches, total: projectTotal, totalPages: projectTotalPages } = projectData;
  const { items: groupItems, total: groupTotal, totalPages: groupTotalPages } = groupData;

  const isGroup    = tab === "group";
  const total      = isGroup ? groupTotal      : projectTotal;
  const totalPages = isGroup ? groupTotalPages : projectTotalPages;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Manual Payment Review"
        description={`${projectTotal} project · ${groupTotal} group submissions`}
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {[
          { key: "project", label: "Project Payments", count: projectTotal },
          { key: "group",   label: "Group Payments",   count: groupTotal },
        ].map(({ key, label, count }) => (
          <Link
            key={key}
            href={`?tab=${key}`}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {label}
            {count > 0 && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                tab === key ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {count}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search investor, reference…" className="w-64" />
        <AdminFilterBar options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      {/* Cards */}
      {!isGroup ? (
        batches.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {batches.map((b) => {
              const cfg = STATUS_CONFIG[b.status] ?? STATUS_CONFIG.SUBMITTED;
              const StatusIcon = cfg.icon;
              const isSplit = b.parts.length > 1;
              return (
                <div key={b.key} className="surface-card overflow-hidden flex flex-col">

                  {/* Card header */}
                  <div className={cn("flex items-center justify-between gap-3 border-b px-4 py-3", cfg.cls.replace(/text-\S+/, "").replace(/bg-\S+/, "").trim(), "border-border bg-muted/30")}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
                      <p className="text-xs font-semibold truncate">{b.investment.project.title}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>

                  <div className="flex flex-col gap-4 p-4 flex-1">

                    {/* Investor */}
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{b.investment.investorProfile.user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{b.investment.investorProfile.user.email}</p>
                      </div>
                    </div>

                    {/* Amount summary */}
                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-muted/40 p-3">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Submitted</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums">{fmtBdt(b.totalBdt)}</p>
                      </div>
                      <div className="text-center border-x border-border/60">
                        <p className="text-[10px] text-muted-foreground">Total Due</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums">{fmtBdt(b.investment.amountBdt)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Verified</p>
                        <p className={cn("mt-0.5 text-sm font-bold tabular-nums", b.approvedBdt > 0 ? "text-success" : "text-muted-foreground")}>
                          {fmtBdt(b.approvedBdt)}
                        </p>
                      </div>
                    </div>

                    {/* Payment parts */}
                    <div className="space-y-3">
                      {b.parts.map((p, idx) => {
                        const MIcon = METHOD_ICON[p.paymentMethod] ?? Banknote;
                        return (
                          <div key={p.id} className="rounded-xl border border-border bg-background p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5 text-xs font-semibold">
                                <MIcon className="h-3.5 w-3.5 text-primary" />
                                {methodLabel(p.paymentMethod)}
                                {isSplit && <span className="text-muted-foreground font-normal">· Part {idx + 1}</span>}
                              </span>
                              <span className="font-mono text-xs font-semibold">{fmtBdt(p.amountBdt)}</span>
                            </div>

                            <div className="space-y-0">
                              {p.bank && (
                                <DetailRow label="Bank" value={`${p.bank.bankName} · ****${p.bank.accountNumber.slice(-4)}`} />
                              )}
                              {p.paymentMethod === "CASH" && p.cashReceivedBy && (
                                <DetailRow label="Received by" value={cashReceiverLabel(p.cashReceivedBy)} />
                              )}
                              {p.transactionRef && p.transactionRef !== "CASH" && (
                                <DetailRow label="Ref / TxID" value={p.transactionRef} mono />
                              )}
                              {p.notes && (
                                <DetailRow label="Notes" value={p.notes} />
                              )}
                            </div>

                            {p.proofFileUrl && (
                              <a
                                href={p.proofFileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                              >
                                <FileText className="h-3 w-3" />
                                View proof
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Rejection reason */}
                    {b.status === "REJECTED" && b.rejectionReason && (
                      <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                        <p className="text-[11px] text-destructive">{b.rejectionReason}</p>
                      </div>
                    )}

                    {/* Footer: date + actions */}
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(b.createdAt)}
                      </span>
                      <ManualPaymentActions
                        submissionId={b.submissionId}
                        status={b.status}
                        proofFileUrl=""
                        proofMimeType=""
                        rejectionReason={b.rejectionReason ?? undefined}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        groupItems.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {groupItems.map((s) => {
              const cfg = STATUS_CONFIG[s.status] ?? STATUS_CONFIG.SUBMITTED;
              return (
                <div key={s.id} className="surface-card overflow-hidden flex flex-col">

                  {/* Card header */}
                  <div className="flex items-center justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", cfg.dot)} />
                      <p className="text-xs font-semibold truncate">
                        {s.groupInvestment.tier.entity.group.name}
                      </p>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>

                  <div className="flex flex-col gap-4 p-4 flex-1">

                    {/* Investor */}
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{s.groupInvestment.investor.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{s.groupInvestment.investor.email}</p>
                      </div>
                    </div>

                    {/* Amount */}
                    <div className="grid grid-cols-2 gap-2 rounded-xl bg-muted/40 p-3">
                      <div className="text-center">
                        <p className="text-[10px] text-muted-foreground">Submitted</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums">{fmtBdt(s.amountBdt)}</p>
                      </div>
                      <div className="text-center border-l border-border/60">
                        <p className="text-[10px] text-muted-foreground">Total Due</p>
                        <p className="mt-0.5 text-sm font-bold tabular-nums">{fmtBdt(s.groupInvestment.amountBdt)}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="rounded-xl border border-border bg-background p-3 space-y-0">
                      <DetailRow label="Entity" value={s.groupInvestment.tier.entity.name} />
                      <DetailRow label="Tier" value={s.groupInvestment.tier.name} />
                      {s.transactionRef && (
                        <DetailRow label="Ref / TxID" value={s.transactionRef} mono />
                      )}
                      {s.groupInvestment.tier.bankAccount && (
                        <DetailRow
                          label="Bank"
                          value={`${s.groupInvestment.tier.bankAccount.bankName} · ****${s.groupInvestment.tier.bankAccount.accountNumber.slice(-4)}`}
                        />
                      )}
                      {s.notes && <DetailRow label="Notes" value={s.notes} />}
                    </div>

                    {s.proofFileUrl && (
                      <a
                        href={s.proofFileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[11px] font-medium text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
                      >
                        <FileText className="h-3 w-3" />
                        View proof
                      </a>
                    )}

                    {s.status === "REJECTED" && s.rejectionReason && (
                      <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                        <XCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                        <p className="text-[11px] text-destructive">{s.rejectionReason}</p>
                      </div>
                    )}

                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-border pt-3">
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {fmtDate(s.createdAt)}
                      </span>
                      <ManualPaymentActions
                        submissionId={s.id}
                        status={s.status}
                        proofFileUrl={s.proofFileUrl ?? ""}
                        proofMimeType={s.proofMimeType ?? ""}
                        notes={s.notes ?? undefined}
                        rejectionReason={s.rejectionReason ?? undefined}
                        isGroupPayment
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="surface-card py-20 text-center">
      <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
        <Building2 className="h-6 w-6 text-muted-foreground" />
      </span>
      <p className="text-sm font-medium">No submissions found</p>
      <p className="mt-1 text-xs text-muted-foreground">Try adjusting your filters.</p>
    </div>
  );
}
