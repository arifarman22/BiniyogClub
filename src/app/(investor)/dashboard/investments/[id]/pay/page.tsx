import { notFound, redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { getActiveBankAccounts } from "@/server/data/manual-payment.data";
import { PaymentProofForm } from "@/components/investments/payment-proof-form";
import { Building2, ArrowLeft, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Complete Payment — Biniyog Club" };

type Props = { params: Promise<{ id: string }> };

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
      project: { select: { title: true, slug: true, durationDays: true } },
      investorProfile: { select: { userId: true } },
      manualPayments: {
        select: { id: true, status: true, transactionRef: true, createdAt: true, rejectionReason: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
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

  const bankAccounts = await getActiveBankAccounts();
  const lastSubmission = investment.manualPayments[0] ?? null;
  const hasPendingSubmission = lastSubmission?.status === "SUBMITTED" || lastSubmission?.status === "UNDER_REVIEW";

  const fmt = (n: number | string) => `৳${Number(n).toLocaleString("en-BD")}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">

      {/* Back */}
      <Link href="/dashboard/investments" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Investments
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Complete Your Payment</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Transfer the investment amount to one of the bank accounts below, then upload your payment proof.
        </p>
      </div>

      {/* Investment summary */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investment Summary</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Project", value: investment.project.title },
            { label: "Amount", value: fmt(investment.amountBdt.toString()) },
            { label: "Expected Return", value: fmt(investment.expectedReturnBdt.toString()) },
            { label: "Duration", value: `${investment.project.durationDays} days` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl bg-muted/40 p-3">
              <p className="text-[10px] text-muted-foreground">{label}</p>
              <p className="mt-0.5 text-sm font-semibold truncate">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pending submission notice */}
      {hasPendingSubmission && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/5 p-4">
          <Clock className="h-5 w-5 shrink-0 text-warning mt-0.5" />
          <div>
            <p className="text-sm font-semibold">Payment proof submitted — under review</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ref: <span className="font-mono">{lastSubmission!.transactionRef}</span> · Our finance team will verify within 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {/* Rejected — allow resubmit */}
      {lastSubmission?.status === "REJECTED" && (
        <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-destructive">Previous submission rejected</p>
            <p className="text-xs text-muted-foreground mt-0.5">Reason: {lastSubmission.rejectionReason ?? "No reason provided"}</p>
            <p className="text-xs text-muted-foreground mt-1">Please resubmit with the correct details below.</p>
          </div>
        </div>
      )}

      {/* Bank accounts */}
      {bankAccounts.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Transfer to one of these accounts</h2>
          </div>
          <div className="space-y-3">
            {bankAccounts.map((acc) => (
              <div key={acc.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm">{acc.bankName}</p>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Active</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  <div>
                    <span className="text-muted-foreground">Account Name</span>
                    <p className="font-medium mt-0.5">{acc.accountName}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Account Number</span>
                    <p className="font-mono font-medium mt-0.5">{acc.accountNumber}</p>
                  </div>
                  {acc.routingNumber && (
                    <div>
                      <span className="text-muted-foreground">Routing Number</span>
                      <p className="font-mono font-medium mt-0.5">{acc.routingNumber}</p>
                    </div>
                  )}
                  {acc.branchName && (
                    <div>
                      <span className="text-muted-foreground">Branch</span>
                      <p className="font-medium mt-0.5">{acc.branchName}</p>
                    </div>
                  )}
                </div>
                {acc.instructions && (
                  <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">{acc.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Proof upload form */}
      {!hasPendingSubmission && (
        <PaymentProofForm
          investmentId={investment.id}
          bankAccounts={bankAccounts}
          amountBdt={Number(investment.amountBdt)}
        />
      )}

    </div>
  );
}
