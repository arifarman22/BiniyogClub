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
  PENDING: "Draft", PAYMENT_PENDING: "Awaiting Payment",
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
  REAL_ESTATE: "Real Estate", TRADE_FINANCE: "Trade Finance", SME: "SME",
  TECHNOLOGY: "Technology", INFRASTRUCTURE: "Infrastructure", OTHER: "Other",
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing",
};

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return", PROFIT_SHARE: "Profit Share", HYBRID: "Hybrid",
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

function daysRemaining(maturity: Date | null) {
  if (!maturity) return null;
  const diff = Math.ceil((maturity.getTime() - Date.now()) / 86400000);
  return diff;
}

function progressPct(inv: { project: { fundedAmountBdt: { toString(): string }; fundingGoalBdt: { toString(): string } } }) {
  const funded = Number(inv.project.fundedAmountBdt.toString());
  const goal = Number(inv.project.fundingGoalBdt.toString());
  if (goal === 0) return 0;
  return Math.min(100, Math.round((funded / goal) * 100));
}

type Investment = Awaited<ReturnType<typeof getInvestorInvestments>>[number];

type TabKey = "all" | "active" | "payment_pending" | "pending" | "completed" | "cancelled";

const TABS: { key: TabKey; label: string; statuses: string[] }[] = [
  { key: "all",             label: "All",              statuses: [] },
  { key: "active",          label: "Active",           statuses: ["ACTIVE", "MATURED"] },
  { key: "payment_pending", label: "Awaiting Payment", statuses: ["PAYMENT_PENDING"] },
  { key: "pending",         label: "Draft",            statuses: ["PENDING"] },
  { key: "completed",       label: "Completed",        statuses: ["COMPLETED"] },
  { key: "cancelled",       label: "Cancelled",        statuses: ["CANCELLED", "REFUNDED"] },
];

function InvestmentCard({
  inv,
  submission,
  certificateDocId,
  bankAccounts,
}: {
  inv: Investment;
  submission: { id: string; status: string; transactionRef: string; rejectionReason: string | null; createdAt: Date } | null;
  certificateDocId: string | null;
  bankAccounts: { id: string; bankName: string; accountName: string; accountNumber: string; routingNumber: string | null; branchName: string | null; instructions: string | null; mobileNumber: string | null }[];
}) {
  const maturity = maturityDate(inv);
  const days = daysRemaining(maturity);
  const pct = progressPct(inv);
  const returnPct = Number(inv.project.expectedReturnPct);
  const isActive = ["ACTIVE", "MATURED", "COMPLETED"].includes(inv.status);
  const canSubmitProof =
    inv.status === "PAYMENT_PENDING" &&
    bankAccounts.length > 0 &&
    (!submission || submission.status === "REJECTED");

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-4 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <Link href={`/projects/${inv.project.slug}`} className="hover:text-primary">
            <p className="font-semibold line-clamp-1">{inv.project.title}</p>
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>{CATEGORY_LABELS[inv.project.category] ?? inv.project.category}</span>
            {inv.project.location && <><span>·</span><span>{inv.project.location}</span></>}
            {inv.receiptNumber && <><span>·</span><span className="font-mono">{inv.receiptNumber}</span></>}
          </div>
        </div>
        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 mt-0.5", STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
          {STATUS_LABELS[inv.status] ?? inv.status}
        </span>
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border mx-4 mb-3 rounded-lg overflow-hidden border border-border">
        <div className="bg-card px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Invested</p>
          <p className="text-sm font-bold text-primary">{formatBdt(inv.amountBdt.toString())}</p>
        </div>
        <div className="bg-card px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {inv.actualReturnBdt ? "Actual Return" : "Expected Return"}
          </p>
          <p className={cn("text-sm font-semibold", inv.actualReturnBdt ? "text-success" : "text-foreground")}>
            {inv.actualReturnBdt
              ? formatBdt(inv.actualReturnBdt.toString())
              : formatBdt(inv.expectedReturnBdt.toString())}
          </p>
        </div>
        <div className="bg-card px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Return Rate</p>
          <p className="text-sm font-semibold">{returnPct.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground">{RETURN_TYPE_LABELS[inv.returnType] ?? inv.returnType}</p>
        </div>
        <div className="bg-card px-3 py-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {isActive ? "Maturity" : "Invested On"}
          </p>
          <p className="text-sm font-semibold">
            {isActive ? fmtDate(maturity) : fmtDate(inv.createdAt)}
          </p>
          {isActive && days !== null && days > 0 && (
            <p className="text-[10px] text-muted-foreground">{days}d remaining</p>
          )}
          {isActive && days !== null && days <= 0 && (
            <p className="text-[10px] text-success">Matured</p>
          )}
        </div>
      </div>

      {/* Active: progress bar + download */}
      {isActive && (
        <div className="border-t border-border px-4 py-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{pct}% funded</span>
          {inv.activatedAt && (
            <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">
              Since {fmtDate(inv.activatedAt)}
            </span>
          )}
          {certificateDocId && (
            <DownloadCertificateButton documentId={certificateDocId} />
          )}
        </div>
      )}

      {/* Draft: complete CTA */}
      {inv.status === "PENDING" && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted-foreground flex-1">
            Investment started — submit payment proof to activate.
          </p>
          <Link
            href={`/dashboard/investments/${inv.id}/pay`}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Complete Investment →
          </Link>
        </div>
      )}

      {/* Payment pending */}
      {inv.status === "PAYMENT_PENDING" && (
        <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
          {submission && (
            <div className="flex flex-wrap items-start gap-3">
              <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", SUBMISSION_COLORS[submission.status])}>
                {SUBMISSION_LABELS[submission.status]}
              </span>
              <p className="text-xs text-muted-foreground">
                Ref: {submission.transactionRef} · {fmtDate(submission.createdAt)}
              </p>
              {submission.status === "REJECTED" && submission.rejectionReason && (
                <p className="w-full rounded bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
                  Rejected: {submission.rejectionReason}
                </p>
              )}
            </div>
          )}
          {canSubmitProof && (
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground flex-1">
                {submission?.status === "REJECTED"
                  ? "Please resubmit with the correct details."
                  : "Transfer the amount to our bank account and submit proof below."}
              </p>
              <SubmitPaymentProofDialog
                investmentId={inv.id}
                amountBdt={Number(inv.amountBdt)}
                bankAccounts={bankAccounts}
              />
            </div>
          )}
          {submission && ["SUBMITTED", "UNDER_REVIEW"].includes(submission.status) && (
            <p className="text-xs text-muted-foreground">
              Your proof is being reviewed. This usually takes 1–2 business days.
            </p>
          )}
          {!submission && bankAccounts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Bank account details are being set up. Please check back soon.
            </p>
          )}
        </div>
      )}

      {/* Cancelled */}
      {inv.status === "CANCELLED" && inv.cancellationReason && (
        <div className="border-t border-border bg-muted/20 px-4 py-2">
          <p className="text-xs text-muted-foreground">Reason: {inv.cancellationReason}</p>
        </div>
      )}
    </div>
  );
}

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await requireSession();
  const { tab: tabParam } = await searchParams;
  const activeTab: TabKey = (TABS.find((t) => t.key === tabParam)?.key) ?? "all";

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

  // Bulk fetch latest submission per PAYMENT_PENDING investment
  const pendingIds = investments.filter((i) => i.status === "PAYMENT_PENDING").map((i) => i.id);
  const submissionMap = await getLatestSubmissionsForInvestments(pendingIds, session.id);

  // Fetch receipts — match by receiptNumber in description to support multiple investments per project
  const confirmedInvs = investments.filter((i) => ["ACTIVE", "MATURED", "COMPLETED"].includes(i.status) && i.receiptNumber);
  const confirmedProjectIds = [...new Set(confirmedInvs.map((i) => i.project.id))];
  const receiptDocs = confirmedProjectIds.length > 0
    ? await db.document.findMany({
        where: {
          entityType: "PROJECT",
          entityId: { in: confirmedProjectIds },
          category: "INVESTMENT_RECEIPT",
          ownerUserId: session.id,
          deletedAt: null,
        },
        select: { id: true, description: true },
      })
    : [];

  // Map receiptNumber → documentId via description field ("Receipt #BC-XXXX")
  const receiptByNumber = new Map<string, string>();
  for (const doc of receiptDocs) {
    if (doc.description) {
      const match = doc.description.match(/Receipt #(.+)$/);
      if (match) receiptByNumber.set(match[1], doc.id);
    }
  }
  const certMap = new Map<string, string>();
  for (const inv of confirmedInvs) {
    if (inv.receiptNumber) {
      const docId = receiptByNumber.get(inv.receiptNumber);
      if (docId) certMap.set(inv.id, docId);
    }
  }

  // KPI totals (exclude PENDING drafts from financial totals)
  const financialInvs = investments.filter((i) => !["PENDING", "CANCELLED", "REFUNDED"].includes(i.status));
  const totalInvested = financialInvs.reduce((s, i) => s + Number(i.amountBdt), 0);
  const totalExpected = financialInvs.reduce((s, i) => s + Number(i.expectedReturnBdt), 0);
  const totalActual = investments.filter((i) => i.actualReturnBdt).reduce((s, i) => s + Number(i.actualReturnBdt), 0);

  // Tab counts
  const tabCounts = TABS.reduce<Record<TabKey, number>>((acc, t) => {
    acc[t.key] = t.statuses.length === 0
      ? investments.length
      : investments.filter((i) => t.statuses.includes(i.status)).length;
    return acc;
  }, {} as Record<TabKey, number>);

  // Filtered list for active tab
  const activeTabDef = TABS.find((t) => t.key === activeTab)!;
  const filtered = activeTabDef.statuses.length === 0
    ? investments
    : investments.filter((i) => activeTabDef.statuses.includes(i.status));

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <PaymentVerifier />
      </Suspense>

      <div>
        <h1 className="text-xl font-bold">Investments</h1>
        <p className="text-sm text-muted-foreground">{investments.length} total investment{investments.length !== 1 ? "s" : ""}</p>
      </div>

      {/* KPI strip */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: "Total Invested",    value: formatBdt(totalInvested) },
          { label: "Expected Returns",  value: formatBdt(totalExpected) },
          { label: "Returns Received",  value: formatBdt(totalActual) },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 text-lg font-bold text-primary">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "all" ? "/dashboard/investments" : `/dashboard/investments?tab=${t.key}`}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1.5",
              activeTab === t.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80",
            )}
          >
            {t.label}
            {tabCounts[t.key] > 0 && (
              <span className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none",
                activeTab === t.key ? "bg-white/20 text-white" : "bg-border text-muted-foreground",
              )}>
                {tabCounts[t.key]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Investment list */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <InvestmentCard
              key={inv.id}
              inv={inv}
              submission={submissionMap.get(inv.id) ?? null}
              certificateDocId={certMap.get(inv.id) ?? null}
              bankAccounts={bankAccounts}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-2xl mb-2">📊</p>
          <p className="font-medium">No {activeTab === "all" ? "" : activeTabDef.label.toLowerCase() + " "}investments</p>
          {activeTab === "all" && (
            <>
              <p className="mt-1 text-sm text-muted-foreground">Browse projects to make your first investment.</p>
              <Link href="/projects" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
                Browse Projects
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
