import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { getProjectBankAccounts } from "@/server/data/manual-payment.data";
import { getPaymentProgress } from "@/server/services/payment-progress";
import { SplitPaymentForm } from "@/components/investments/split-payment-form";
import { cashReceiverLabel, methodLabel } from "@/lib/payments/split-payment";
import { ArrowLeft, CheckCircle2, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { formatReturnPct, getExpectedReturnBdt } from "@/lib/financial/return-range";

export const metadata: Metadata = { title: "Complete Payment — Biniyog Club" };

type Props = { params: Promise<{ id: string }> };

const PART_STATUS = {
  SUBMITTED:    { label: "Under review", icon: Clock,        cls: "border-warning/30 bg-warning/10 text-warning" },
  UNDER_REVIEW: { label: "Under review", icon: Clock,        cls: "border-warning/30 bg-warning/10 text-warning" },
  APPROVED:     { label: "Verified",     icon: CheckCircle2, cls: "border-success/30 bg-success/10 text-success" },
  REJECTED:     { label: "Rejected",     icon: XCircle,      cls: "border-destructive/30 bg-destructive/10 text-destructive" },
} as const;

export default async function InvestmentPayPage({ params }: Props) {
  const { id } = await params;
  const session = await requireSession().catch(() => redirect("/auth/login"));

  const investment = await db.investment.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      amountBdt: true,
      expectedReturnBdt: true,
      returnType: true,
      createdAt: true,
      project: { select: { title: true, slug: true, durationDays: true, id: true, expectedReturnPct: true, returnPctMin: true, returnPctMax: true } },
      investorProfile: { select: { userId: true } },
    },
  });

  if (!investment) notFound();
  if (investment.investorProfile.userId !== session.id) notFound();

  // Already active — redirect to investments
  if (investment.status === "ACTIVE") redirect("/dashboard/investments");

  // Must be PENDING or PAYMENT_PENDING
  if (!["PENDING", "PAYMENT_PENDING"].includes(investment.status)) {
    redirect("/dashboard/investments");
  }

  const [bankAccounts, progress] = await Promise.all([
    getProjectBankAccounts(investment.project.id),
    getPaymentProgress(investment.id),
  ]);

  const fmt = (n: number | string) => `৳${Number(n).toLocaleString("en-BD")}`;
  const expected = getExpectedReturnBdt(investment.amountBdt, investment.project);
  const expectedLabel = expected.max != null ? `${fmt(expected.min)} – ${fmt(expected.max)}` : fmt(expected.min);
  const pct = (n: number) => (progress.total > 0 ? (n / progress.total) * 100 : 0);
  const rejected = progress.parts.filter((p) => p.status === "REJECTED");
  const latestRejected = rejected[rejected.length - 1];

  return (
    <div className="space-y-6">

      {/* Back */}
      <Link href="/dashboard/investments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Investments
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Complete Your Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pay by bank transfer, cheque or cash — or combine two of them — then submit the details
          for approval.
        </p>
      </div>

      {/* Investment summary */}
      <div className="surface-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investment Summary</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Project", value: investment.project.title },
            { label: "Amount", value: fmt(investment.amountBdt.toString()) },
            { label: "Expected Return", value: expectedLabel, sub: `${formatReturnPct(investment.project)} of principal` },
            { label: "Duration", value: `${investment.project.durationDays} days` },
          ].map(({ label, value, sub }) => (
            <div key={label} className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-semibold line-clamp-2 break-words" title={value}>{value}</p>
              {sub && <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Payment progress + submitted parts */}
      {progress.parts.length > 0 && (
        <div className="surface-card overflow-hidden">
          <div className="space-y-3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment Progress</p>
            <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
              <div className="bg-success" style={{ width: `${pct(progress.approved)}%` }} />
              <div className="bg-warning" style={{ width: `${pct(progress.pending)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-success" /> Verified</p>
                <p className="font-semibold tabular-nums">{fmt(progress.approved)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-warning" /> Under review</p>
                <p className="font-semibold tabular-nums">{fmt(progress.pending)}</p>
              </div>
              <div>
                <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><span className="h-2 w-2 rounded-full bg-muted-foreground/40" /> Still to pay</p>
                <p className="font-semibold tabular-nums">{fmt(progress.outstanding)}</p>
              </div>
            </div>
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {progress.parts.map((p) => {
              const s = PART_STATUS[p.status as keyof typeof PART_STATUS] ?? PART_STATUS.SUBMITTED;
              const Icon = s.icon;
              return (
                <li key={p.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {methodLabel(p.paymentMethod)} · {fmt(p.amountBdt)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {p.paymentMethod === "CASH" && <>Handed to {cashReceiverLabel(p.cashReceivedBy)} · </>}
                      {p.transactionRef && p.transactionRef !== "CASH" && <>Ref <span className="font-mono">{p.transactionRef}</span> · </>}
                      {p.createdAt.toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                      {p.status === "REJECTED" && p.rejectionReason && <span className="text-destructive"> · {p.rejectionReason}</span>}
                    </p>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${s.cls}`}>
                    <Icon className="h-3 w-3" /> {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Rejected — allow resubmit */}
      {latestRejected && progress.outstanding > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <XCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">A payment was rejected</p>
            <p className="text-xs text-muted-foreground mt-0.5">Reason: {latestRejected.rejectionReason ?? "No reason provided"}</p>
            <p className="text-xs text-muted-foreground mt-1">Please pay the remaining {fmt(progress.outstanding)} below.</p>
          </div>
        </div>
      )}

      {/* Everything submitted — waiting on review */}
      {progress.outstanding === 0 && progress.pending > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
          <Clock className="h-5 w-5 shrink-0 text-warning mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Full amount submitted — under review</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Our finance team verifies each payment within 1–2 business days. Your investment activates once all of it is verified.
            </p>
          </div>
        </div>
      )}

      {/* Proof form for whatever is still owed */}
      {progress.outstanding > 0 && (
        <SplitPaymentForm
          investmentId={investment.id}
          bankAccounts={bankAccounts}
          outstandingBdt={progress.outstanding}
          needsInitiate={investment.status === "PENDING"}
        />
      )}

    </div>
  );
}
