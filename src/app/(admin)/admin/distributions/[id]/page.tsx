export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import { getAdminDistributionBatch, getDistributionAuditTrail } from "@/server/data/distribution.data";
import { DistributionBatchActions } from "@/components/admin/distribution-batch-actions";
import { fmtBdt, fmtDate, fmtDateTime } from "@/lib/admin/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return { title: `Distribution Batch — Admin` };
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT:            "bg-muted text-muted-foreground border-border",
  PENDING_APPROVAL: "bg-warning-muted text-warning-foreground border-warning/30",
  APPROVED:         "bg-info-muted text-info-foreground border-info/30",
  POSTED:           "bg-success-muted text-success border-success/30",
  VOIDED:           "bg-destructive/10 text-destructive border-destructive/30",
};

const LINE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  POSTED:  "bg-success-muted text-success",
  VOIDED:  "bg-destructive/10 text-destructive",
};

export default async function DistributionBatchDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession();

  const [batch, auditLogs] = await Promise.all([
    getAdminDistributionBatch(session, id),
    getDistributionAuditTrail(session, id),
  ]);
  if (!batch) notFound();

  const ruleSnap = batch.ruleSnapshot as { investorSharePct: number; platformFeePct: number; capturedAt: string };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <Link href="/admin/distributions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Distributions
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[batch.status] ?? ""}`}>
                {batch.status.replace(/_/g, " ")}
              </span>
              <span className="text-xs text-muted-foreground">Batch {batch.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <h1 className="text-xl font-bold">{batch.project.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {batch.lineItems.length} investors · Created {fmtDate(batch.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="lg:col-span-2 space-y-6">

          {/* Financial summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-sm font-semibold">Financial Summary</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Total Revenue",    value: fmtBdt(batch.totalRevenueBdt),  sub: "Gross income" },
                { label: "Total Expenses",   value: fmtBdt(batch.totalExpensesBdt), sub: "Eligible deductions" },
                { label: "Net Revenue",      value: fmtBdt(batch.netRevenueBdt),    sub: "Revenue − Expenses" },
                { label: "Investor Pool",    value: fmtBdt(batch.investorPoolBdt),  sub: `${ruleSnap.investorSharePct}% of net revenue` },
                { label: "Total Gross Payout", value: fmtBdt(batch.totalGrossBdt), sub: "Before platform fee" },
                { label: "Platform Fees",    value: fmtBdt(batch.totalFeeBdt),      sub: `${ruleSnap.platformFeePct}% of gross` },
                { label: "Total Net Payout", value: fmtBdt(batch.totalNetBdt),      sub: "Credited to investors", highlight: true },
              ].map(({ label, value, sub, highlight }) => (
                <div key={label} className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`mt-0.5 text-lg font-bold ${highlight ? "text-success" : "text-foreground"}`}>{value}</p>
                  <p className="text-[10px] text-muted-foreground">{sub}</p>
                </div>
              ))}
            </div>
            {batch.notes && (
              <p className="mt-4 rounded-lg bg-muted/30 px-3 py-2 text-xs text-muted-foreground">{batch.notes}</p>
            )}
          </div>

          {/* Rule snapshot */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold">Distribution Rule Snapshot</h2>
            <p className="mb-3 text-xs text-muted-foreground">
              Captured at calculation time — immutable for this batch.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Investor Share</p>
                <p className="text-lg font-bold">{ruleSnap.investorSharePct}%</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Platform Fee</p>
                <p className="text-lg font-bold">{ruleSnap.platformFeePct}%</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Captured At</p>
                <p className="text-xs font-medium mt-1">{fmtDateTime(ruleSnap.capturedAt)}</p>
              </div>
            </div>
          </div>

          {/* Line items */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold">Investor Entitlements ({batch.lineItems.length})</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investor</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Principal</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Share %</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Gross</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Fee</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Net</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batch.lineItems.map((line) => (
                    <tr key={line.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium text-sm">{line.investment.investorProfile.user.name}</p>
                        <p className="text-xs text-muted-foreground">{line.investment.investorProfile.user.email}</p>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="font-mono text-xs">{fmtBdt(line.principalBdt)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className="text-xs">{Number(line.investorSharePct).toFixed(2)}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono text-sm">{fmtBdt(line.grossAmountBdt)}</span>
                      </td>
                      <td className="px-4 py-3 text-right hidden lg:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">{fmtBdt(line.platformFeeBdt)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-mono font-semibold text-success">{fmtBdt(line.netAmountBdt)}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LINE_STATUS_COLORS[line.status] ?? ""}`}>
                          {line.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit trail */}
          {auditLogs.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-sm font-semibold">Audit Trail</h2>
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                      {log.action === "APPROVE" ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      ) : log.action === "VOID" || log.action === "REJECT" ? (
                        <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium">
                        {log.action.replace(/_/g, " ")}
                        {log.actor && <span className="font-normal text-muted-foreground"> by {log.actor.name}</span>}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{fmtDateTime(log.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold">Actions</h3>
            <DistributionBatchActions
              batchId={batch.id}
              status={batch.status as never}
              submittedBy={batch.submittedBy}
              currentUserId={session.id}
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Timeline</h3>
            <div className="space-y-2 text-xs">
              {[
                { label: "Created",   value: batch.createdAt },
                { label: "Submitted", value: batch.submittedAt },
                { label: "Approved",  value: batch.approvedAt },
                { label: "Posted",    value: batch.postedAt },
                { label: "Voided",    value: batch.voidedAt },
              ].filter((r) => r.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{fmtDate(value!)}</span>
                </div>
              ))}
              {batch.voidReason && (
                <p className="rounded bg-destructive/10 px-2 py-1 text-destructive">{batch.voidReason}</p>
              )}
            </div>
          </div>

          <Link
            href={`/admin/projects/${batch.project.id}`}
            className="block rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium hover:bg-muted/30 transition-colors"
          >
            View Project →
          </Link>
        </div>
      </div>
    </div>
  );
}
