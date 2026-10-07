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
type ViewKey = "list" | "project";

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
  compact = false,
}: {
  inv: Investment;
  submission: { id: string; status: string; transactionRef: string; rejectionReason: string | null; createdAt: Date } | null;
  certificateDocId: string | null;
  bankAccounts: { id: string; bankName: string; accountName: string; accountNumber: string; routingNumber: string | null; branchName: string | null; instructions: string | null; mobileNumber: string | null }[];
  compact?: boolean;
}) {
  const maturity = maturityDate(inv);
  const days = daysRemaining(maturity);
  const pct = progressPct(inv);
  const returnPct = Number(inv.project.expectedReturnPct);
  const amountBdt = Number(inv.amountBdt);
  const expectedReturnBdt = Number(inv.expectedReturnBdt);
  const totalValue = amountBdt + expectedReturnBdt;
  const distributionsTotal = inv.distributions.reduce((s, d) => s + Number(d.netAmountBdt), 0);
  const isActive = ["ACTIVE", "MATURED", "COMPLETED"].includes(inv.status);
  const canSubmitProof =
    inv.status === "PAYMENT_PENDING" &&
    bankAccounts.length > 0 &&
    (!submission || submission.status === "REJECTED");

  return (
    <div className={cn("overflow-hidden", !compact && "rounded-xl border border-border bg-card")}>

      {/* ── Header (hidden in compact/project-grouped mode) ── */}
      {!compact && (
      <div className="flex flex-wrap items-start gap-3 px-4 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <Link href={`/projects/${inv.project.slug}`} className="hover:text-primary">
            <p className="font-semibold line-clamp-1 text-base">{inv.project.title}</p>
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
            <span>{CATEGORY_LABELS[inv.project.category] ?? inv.project.category}</span>
            {inv.project.location && <><span>·</span><span>{inv.project.location}</span></>}
            <span>·</span>
            <span>{inv.project.durationDays}d term</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
            {STATUS_LABELS[inv.status] ?? inv.status}
          </span>
          {inv.receiptNumber && (
            <span className="font-mono text-[10px] text-muted-foreground">{inv.receiptNumber}</span>
          )}
        </div>
      </div>
      )}

      {/* Compact header — just status + receipt inside group */}
      {compact && (
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full border px-2.5 py-0.5 text-[10px] font-semibold", STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
              {STATUS_LABELS[inv.status] ?? inv.status}
            </span>
            {inv.receiptNumber && (
              <span className="font-mono text-[10px] text-muted-foreground">{inv.receiptNumber}</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{fmtDate(inv.createdAt)}</span>
        </div>
      )}

      {/* ── Financial detail grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border mx-4 mb-0 rounded-lg overflow-hidden border border-border">
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Principal</p>
          <p className="text-sm font-bold text-primary">{formatBdt(amountBdt)}</p>
        </div>
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">
            {inv.actualReturnBdt ? "Actual Return" : "Expected Return"}
          </p>
          <p className={cn("text-sm font-semibold", inv.actualReturnBdt ? "text-success" : "")}>
            {inv.actualReturnBdt ? formatBdt(Number(inv.actualReturnBdt)) : formatBdt(expectedReturnBdt)}
          </p>
          <p className="text-[10px] text-muted-foreground">{returnPct.toFixed(1)}% · {RETURN_TYPE_LABELS[inv.returnType] ?? inv.returnType}</p>
        </div>
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Total Value</p>
          <p className="text-sm font-semibold">{formatBdt(totalValue)}</p>
          <p className="text-[10px] text-muted-foreground">Principal + return</p>
        </div>
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Invested On</p>
          <p className="text-sm font-semibold">{fmtDate(inv.createdAt)}</p>
          {inv.activatedAt && (
            <p className="text-[10px] text-muted-foreground">Active {fmtDate(inv.activatedAt)}</p>
          )}
        </div>
      </div>

      {/* ── Timeline row ── */}
      <div className="mx-4 mt-px mb-3 grid grid-cols-2 sm:grid-cols-4 gap-px bg-border rounded-b-lg overflow-hidden border-x border-b border-border">
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Maturity Date</p>
          <p className="text-sm font-semibold">{fmtDate(maturity)}</p>
          {days !== null && days > 0 && <p className="text-[10px] text-muted-foreground">{days} days left</p>}
          {days !== null && days <= 0 && <p className="text-[10px] text-success font-medium">Matured</p>}
        </div>
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Duration</p>
          <p className="text-sm font-semibold">{inv.project.durationDays} days</p>
          {inv.activatedAt && maturity && (
            <p className="text-[10px] text-muted-foreground">{fmtDate(inv.activatedAt)} → {fmtDate(maturity)}</p>
          )}
        </div>
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Distributions</p>
          <p className={cn("text-sm font-semibold", distributionsTotal > 0 ? "text-success" : "")}>
            {distributionsTotal > 0 ? formatBdt(distributionsTotal) : "—"}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {inv.distributions.length > 0 ? `${inv.distributions.length} payment${inv.distributions.length > 1 ? "s" : ""}` : "None yet"}
          </p>
        </div>
        <div className="bg-card px-3 py-2.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Project Funded</p>
          <p className="text-sm font-semibold">{pct}%</p>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Active footer: download certificate ── */}
      {isActive && certificateDocId && (
        <div className="border-t border-border px-4 py-2 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">Investment certificate available</p>
          <DownloadCertificateButton documentId={certificateDocId} />
        </div>
      )}

      {/* ── Draft: complete CTA ── */}
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

      {/* ── Payment pending ── */}
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

      {/* ── Cancelled ── */}
      {inv.status === "CANCELLED" && inv.cancellationReason && (
        <div className="border-t border-border bg-muted/20 px-4 py-2">
          <p className="text-xs text-muted-foreground">Reason: {inv.cancellationReason}</p>
        </div>
      )}
    </div>
  );
}

function ProjectGroup({
  projectTitle,
  projectSlug,
  projectCategory,
  projectLocation,
  investments,
  submissionMap,
  certMap,
  bankAccounts,
}: {
  projectTitle: string;
  projectSlug: string;
  projectCategory: string;
  projectLocation: string | null;
  investments: Investment[];
  submissionMap: Map<string, { id: string; status: string; transactionRef: string; rejectionReason: string | null; createdAt: Date }>;
  certMap: Map<string, string>;
  bankAccounts: { id: string; bankName: string; accountName: string; accountNumber: string; routingNumber: string | null; branchName: string | null; instructions: string | null; mobileNumber: string | null }[];
}) {
  const totalInvested = investments.reduce((s, i) => s + Number(i.amountBdt), 0);
  const totalExpected = investments.reduce((s, i) => s + Number(i.expectedReturnBdt), 0);
  const activeCount = investments.filter((i) => ["ACTIVE", "MATURED"].includes(i.status)).length;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Project header */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-muted/30 border-b border-border">
        <div className="min-w-0 flex-1">
          <Link href={`/projects/${projectSlug}`} className="hover:text-primary">
            <p className="font-semibold text-sm line-clamp-1">{projectTitle}</p>
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
            <span>{CATEGORY_LABELS[projectCategory] ?? projectCategory}</span>
            {projectLocation && <><span>·</span><span>{projectLocation}</span></>}
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0 text-right">
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Total Invested</p>
            <p className="text-sm font-bold text-primary">{formatBdt(totalInvested)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Exp. Return</p>
            <p className="text-sm font-semibold">{formatBdt(totalExpected)}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Investments</p>
            <p className="text-sm font-semibold">{investments.length} <span className="text-muted-foreground font-normal">({activeCount} active)</span></p>
          </div>
        </div>
      </div>

      {/* Individual investment cards inside the group */}
      <div className="divide-y divide-border">
        {investments.map((inv) => (
          <div key={inv.id} className="bg-card">
            <InvestmentCard
              inv={inv}
              submission={submissionMap.get(inv.id) ?? null}
              certificateDocId={certMap.get(inv.id) ?? null}
              bankAccounts={bankAccounts}
              compact
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; view?: string }>;
}) {
  const session = await requireSession();
  const { tab: tabParam, view: viewParam } = await searchParams;
  const activeTab: TabKey = (TABS.find((t) => t.key === tabParam)?.key) ?? "all";
  const activeView: ViewKey = viewParam === "project" ? "project" : "list";

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

      {/* Tabs + View toggle */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {TABS.map((t) => {
            const params = new URLSearchParams();
            if (t.key !== "all") params.set("tab", t.key);
            if (activeView === "project") params.set("view", "project");
            const href = `/dashboard/investments${params.toString() ? `?${params}` : ""}`;
            return (
              <Link
                key={t.key}
                href={href}
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
            );
          })}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {([
            { key: "list",    label: "List" },
            { key: "project", label: "By Project" },
          ] as { key: ViewKey; label: string }[]).map((v) => {
            const params = new URLSearchParams();
            if (activeTab !== "all") params.set("tab", activeTab);
            if (v.key === "project") params.set("view", "project");
            const href = `/dashboard/investments${params.toString() ? `?${params}` : ""}`;
            return (
              <Link
                key={v.key}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  activeView === v.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {v.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Investment list / project-grouped view */}
      {filtered.length > 0 ? (
        activeView === "project" ? (
          // Group by project
          (() => {
            const groups = new Map<string, { title: string; slug: string; category: string; location: string | null; items: Investment[] }>();
            for (const inv of filtered) {
              const pid = inv.project.id;
              if (!groups.has(pid)) {
                groups.set(pid, { title: inv.project.title, slug: inv.project.slug, category: inv.project.category, location: inv.project.location ?? null, items: [] });
              }
              groups.get(pid)!.items.push(inv);
            }
            return (
              <div className="space-y-4">
                {Array.from(groups.values()).map((g) => (
                  <ProjectGroup
                    key={g.slug}
                    projectTitle={g.title}
                    projectSlug={g.slug}
                    projectCategory={g.category}
                    projectLocation={g.location}
                    investments={g.items}
                    submissionMap={submissionMap}
                    certMap={certMap}
                    bankAccounts={bankAccounts}
                  />
                ))}
              </div>
            );
          })()
        ) : (
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
        )
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
