"use client";

import { Clock, CheckCircle2, TrendingUp, XCircle, AlertCircle } from "lucide-react";
import { PaymentProofForm } from "@/components/investments/payment-proof-form";
import Link from "next/link";
import { cn } from "cn";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string | null;
  branchName: string | null;
  swiftCode: string | null;
  mobileNumber: string | null;
  email: string | null;
  branchAddress: string | null;
};

type Submission = {
  id: string;
  status: string;
  transactionRef: string;
  rejectionReason: string | null;
  createdAt: Date;
};

export type ExistingInvestment = {
  id: string;
  status: string;
  amountBdt: number;
  expectedReturnBdt: number;
  lastSubmission: Submission | null;
};

type Props = {
  investment: ExistingInvestment;
  bankAccounts: BankAccount[];
};

const STATUS_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  PENDING:         { icon: <Clock className="h-4 w-4" />,        label: "Draft — Payment Pending",  color: "text-muted-foreground", bg: "bg-muted/40 border-border" },
  PAYMENT_PENDING: { icon: <Clock className="h-4 w-4" />,        label: "Awaiting Payment",          color: "text-warning",          bg: "bg-warning/5 border-warning/30" },
  ACTIVE:          { icon: <TrendingUp className="h-4 w-4" />,   label: "Investment Active",         color: "text-success",          bg: "bg-success/5 border-success/30" },
  MATURED:         { icon: <CheckCircle2 className="h-4 w-4" />, label: "Investment Matured",        color: "text-success",          bg: "bg-success/5 border-success/30" },
  COMPLETED:       { icon: <CheckCircle2 className="h-4 w-4" />, label: "Investment Completed",      color: "text-success",          bg: "bg-success/5 border-success/30" },
  CANCELLED:       { icon: <XCircle className="h-4 w-4" />,      label: "Investment Cancelled",      color: "text-destructive",      bg: "bg-destructive/5 border-destructive/30" },
};

const SUBMISSION_LABELS: Record<string, string> = {
  SUBMITTED: "Proof Submitted — Under Review",
  UNDER_REVIEW: "Proof Under Review",
  APPROVED: "Proof Approved",
  REJECTED: "Proof Rejected",
};

function fmt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export function ProjectInvestmentStatus({ investment, bankAccounts }: Props) {
  const cfg = STATUS_CONFIG[investment.status] ?? STATUS_CONFIG.PENDING;
  const sub = investment.lastSubmission;

  const hasPendingSubmission = sub?.status === "SUBMITTED" || sub?.status === "UNDER_REVIEW";
  const canSubmitProof =
    (investment.status === "PENDING" || investment.status === "PAYMENT_PENDING") &&
    (!sub || sub.status === "REJECTED");

  return (
    <div className="space-y-3">
      {/* Status header */}
      <div className={cn("rounded-xl border px-4 py-3 flex items-center gap-3", cfg.bg)}>
        <span className={cfg.color}>{cfg.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {fmt(investment.amountBdt)} invested · {fmt(investment.expectedReturnBdt)} expected return
          </p>
        </div>
        <Link
          href="/dashboard/investments"
          className="shrink-0 text-xs text-primary hover:underline"
        >
          View →
        </Link>
      </div>

      {/* Submission status */}
      {sub && (
        <div className={cn(
          "rounded-xl border px-4 py-3 space-y-1",
          sub.status === "REJECTED" ? "bg-destructive/5 border-destructive/30" :
          sub.status === "APPROVED" ? "bg-success/5 border-success/30" :
          "bg-muted/40 border-border"
        )}>
          <div className="flex items-center gap-2">
            {sub.status === "REJECTED"
              ? <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
              : sub.status === "APPROVED"
              ? <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
              : <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            }
            <p className="text-xs font-medium">{SUBMISSION_LABELS[sub.status] ?? sub.status}</p>
          </div>
          <p className="text-xs text-muted-foreground">Ref: <span className="font-mono">{sub.transactionRef}</span></p>
          {sub.status === "REJECTED" && sub.rejectionReason && (
            <p className="text-xs text-destructive mt-1">Reason: {sub.rejectionReason}</p>
          )}
        </div>
      )}

      {/* Pending review message */}
      {hasPendingSubmission && (
        <p className="text-xs text-muted-foreground px-1">
          Our finance team will verify your payment within 1–2 business days.
        </p>
      )}

      {/* Payment proof form for PENDING/PAYMENT_PENDING with no submission or rejected */}
      {canSubmitProof && (
        <PaymentProofForm
          investmentId={investment.id}
          bankAccounts={bankAccounts}
          amountBdt={investment.amountBdt}
        />
      )}
    </div>
  );
}
