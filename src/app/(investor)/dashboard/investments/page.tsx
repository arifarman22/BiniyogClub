export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getInvestorInvestments, getLatestSubmissionsForInvestments } from "@/server/data/investor.data";
import { getActiveBankAccounts } from "@/server/data/manual-payment.data";
import { db } from "@/lib/db/prisma";
import { PaymentVerifier } from "@/components/shared/payment-verifier";
import { SubmitPaymentProofDialog } from "@/components/shared/submit-payment-proof-dialog";
import { DownloadCertificateButton } from "@/components/investments/download-certificate-button";
import { cn } from "cn";

export const metadata: Metadata = { title: "Investments — Dashboard" };

const STATUS_COLORS: Record<string, string> = {
  PENDING:         "bg-muted text-muted-foreground border-border",
  PAYMENT_PENDING: "bg-warning/10 text-warning border-warning/30",
  ACTIVE:          "bg-brand-100 text-brand-700 border-brand-400/30",
  MATURED:         "bg-success-muted text-success border-success/30",
  CANCELLED:       "bg-destructive/10 text-destructive border-destructive/30",
  COMPLETED:       "bg-success-muted text-success border-success/30",
  REFUNDED:        "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", PAYMENT_PENDING: "Awaiting Payment",
  ACTIVE: "Active", MATURED: "Matured",
  CANCELLED: "Cancelled", COMPLETED: "Completed", REFUNDED: "Refunded",
};

const SUBMISSION_COLORS: Record<string, string> = {
  SUBMITTED:    "bg-info/10 text-info border-info/30",
  UNDER_REVIEW: "bg-warning/10 text-warning border-warning/30",
  APPROVED:     "bg-success-muted text-success border-success/30",
  REJECTED:     "bg-destructive/10 text-destructive border-destructive/30",
};

const SUBMISSION_LABELS: Record<string, string> = {
  SUBMITTED: "Proof Submitted", UNDER_REVIEW: "Under Review",
  APPROVED: "Proof Approved", REJECTED: "Proof Rejected",
};

const CATEGORY_LABELS: Record<string, string> = {
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing", OTHER: "Other",
};

function formatBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

function maturityDate(inv: { activatedAt: Date | null; project: { durationDays: number } }) {
  if (!inv.activatedAt) return null;
  const d = new Date(inv.activatedAt);
  d.setDate(d.getDate() + inv.project.durationDays);
  return d;
}

function progressPct(inv: { project: { fundedAmountBdt: { toString(): string }; fundingGoalBdt: { toString(): string } } }) {
  const funded = Number(inv.project.fundedAmountBdt.toString());
  const goal = Number(inv.project.fundingGoalBdt.toString());
  if (goal === 0) return 0;
  return Math.min(100, Math.round((funded / goal) * 100));
}

export default async function InvestmentsPage() {
  const session = await requireSession();

  let investments: Awaited<ReturnType<typeof getInvestorInvestments>>;
  let bankAccounts: Awaited<ReturnType<typeof getActiveBankAccounts>>;

  try {
    [investments, bankAccounts] = await Promise.all([
      getInvestorInvestments(session),
      getActiveBankAccounts(),
    ]);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">Investments</h1>
          <p className="text-sm text-muted-foreground">Your investment portfolio</p>
        </div>
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-2xl mb-2">👤</p>
          <p className="font-medium">Profile setup required</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
            Complete your investor profile to start making investments.
          </p>
          <Link href="/dashboard/profile" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            Complete Profile
          </Link>
        </div>
      </div>
    );
  }

  // Fetch latest submission for each PAYMENT_PENDING investment — single bulk query
  const pendingIds = investments
    .filter((i) => i.status === "PAYMENT_PENDING")
    .map((i) => i.id);
  const submissionMap = await getLatestSubmissionsForInvestments(pendingIds, session.id);

  // Fetch investment certificates for ACTIVE/MATURED/COMPLETED investments
  const confirmedIds = investments
    .filter((i) => ["ACTIVE", "MATURED", "COMPLETED"].includes(i.status))
    .map((i) => i.id);
  const certificateDocs = confirmedIds.length > 0
    ? await db.document.findMany({
        where: {
          entityType: "INVESTMENT",
          entityId: { in: confirmedIds },
          category: "INVESTMENT_AGREEMENT",
          deletedAt: null,
          ownerUserId: session.id,
        },
        select: { id: true, entityId: true },
        orderBy: { createdAt: "desc" },
      })
    : [];
  // Map investmentId → documentId (first/latest cert per investment)
  const certMap = new Map<string, string>();
  for (const doc of certificateDocs) {
    if (!certMap.has(doc.entityId)) certMap.set(doc.entityId, doc.id);
  }

  const totalInvested = investments.reduce((s, i) => s + Number(i.amountBdt), 0);
  const totalExpected = investments.reduce((s, i) => s + Number(i.expectedReturnBdt), 0);
  const totalActual = investments
    .filter((i) => i.actualReturnBdt)
    .reduce((s, i) => s + Number(i.actualReturnBdt), 0);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <PaymentVerifier />
      </Suspense>

      <div>
        <h1 className="text-xl font-bold">Investments</h1>
        <p className="text-sm text-muted-foreground">{investments.length} total investments</p>
      </div>

      {/* Summary row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Invested", value: formatBdt(totalInvested) },
          { label: "Expected Returns", value: formatBdt(totalExpected) },
          { label: "Actual Returns Received", value: formatBdt(totalActual) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      {investments.length > 0 ? (
        <div className="space-y-3">
          {investments.map((inv) => {
            const maturity = maturityDate(inv);
            const pct = progressPct(inv);
            const returnPct = Number(inv.project.expectedReturnPct);
            const submission = submissionMap.get(inv.id) ?? null;
            const canSubmitProof =
              inv.status === "PAYMENT_PENDING" &&
              bankAccounts.length > 0 &&
              (!submission || submission.status === "REJECTED");
            const certificateDocId = certMap.get(inv.id) ?? null;

            return (
              <div key={inv.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Main row */}
                <div className="flex flex-wrap items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <Link href={`/projects/${inv.project.slug}`} className="hover:text-primary">
                      <p className="font-medium line-clamp-1">{inv.project.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[inv.project.category] ?? inv.project.category}
                        {" · "}{inv.project.location ?? ""}
                        {" · "}{fmtDate(inv.createdAt)}
                      </p>
                    </Link>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold">{formatBdt(inv.amountBdt.toString())}</p>
                    <p className="text-xs text-muted-foreground">
                      {inv.actualReturnBdt
                        ? <span className="text-success font-medium">{formatBdt(inv.actualReturnBdt.toString())} returned</span>
                        : `${returnPct.toFixed(1)}% exp.`}
                    </p>
                  </div>

                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0", STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
                    {STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>

                {/* PAYMENT_PENDING section */}
                {inv.status === "PAYMENT_PENDING" && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-3">
                    {/* Submission status */}
                    {submission && (
                      <div className="flex flex-wrap items-start gap-3">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", SUBMISSION_COLORS[submission.status])}>
                          {SUBMISSION_LABELS[submission.status]}
                        </span>
                        <div className="text-xs text-muted-foreground">
                          <span>Ref: {submission.transactionRef}</span>
                          {" · "}
                          <span>Submitted {fmtDate(submission.createdAt)}</span>
                        </div>
                        {submission.status === "REJECTED" && submission.rejectionReason && (
                          <p className="w-full rounded bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
                            Rejected: {submission.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    {/* No submission yet or rejected — show dialog trigger */}
                    {canSubmitProof && (
                      <div className="flex items-center gap-3">
                        {!submission && (
                          <p className="text-xs text-muted-foreground flex-1">
                            Transfer the amount to one of our bank accounts and submit your payment proof below.
                          </p>
                        )}
                        {submission?.status === "REJECTED" && (
                          <p className="text-xs text-muted-foreground flex-1">
                            Please resubmit with the correct details.
                          </p>
                        )}
                        <SubmitPaymentProofDialog
                          investmentId={inv.id}
                          amountBdt={Number(inv.amountBdt)}
                          bankAccounts={bankAccounts}
                        />
                      </div>
                    )}

                    {/* Pending review — no action needed */}
                    {submission && ["SUBMITTED", "UNDER_REVIEW"].includes(submission.status) && (
                      <p className="text-xs text-muted-foreground">
                        Your proof is being reviewed by our finance team. This usually takes 1–2 business days.
                      </p>
                    )}

                    {/* No bank accounts configured */}
                    {!submission && bankAccounts.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Bank account details are being set up. Please check back soon or contact support.
                      </p>
                    )}
                  </div>
                )}

                {/* Progress bar for active investments */}
                {["ACTIVE", "MATURED", "COMPLETED"].includes(inv.status) && (
                  <div className="border-t border-border px-4 py-2 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{pct}% funded</span>
                    {maturity && (
                      <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
                        Matures {fmtDate(maturity)}
                      </span>
                    )}
                    {certificateDocId && (
                      <DownloadCertificateButton documentId={certificateDocId} />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="font-medium">No investments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse projects to make your first investment.</p>
          <Link href="/projects" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            Browse Projects
          </Link>
        </div>
      )}
    </div>
  );
}
