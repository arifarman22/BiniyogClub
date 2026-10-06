"use client";

import { useState } from "react";
import { X, ArrowDownLeft } from "lucide-react";
import { cn } from "cn";

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-warning-muted text-warning border-warning/30",
  PROCESSING: "bg-info/10 text-info border-info/30",
  COMPLETED:  "bg-success-muted text-success border-success/30",
  FAILED:     "bg-destructive/10 text-destructive border-destructive/30",
  REFUNDED:   "bg-muted text-muted-foreground border-border",
  CANCELLED:  "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Review", PROCESSING: "Processing",
  COMPLETED: "Completed", FAILED: "Failed",
  REFUNDED: "Refunded", CANCELLED: "Cancelled",
};

function fmtBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

type Deposit = {
  id: string;
  method: string;
  status: string;
  amountBdt: unknown;
  feeBdt: unknown;
  netAmountBdt: unknown;
  externalReference: string | null;
  description: string | null;
  processedAt: Date | string | null;
  createdAt: Date | string;
  gatewayResponse: unknown;
};

export function DepositDetailPopup({ deposit }: { deposit: Deposit }) {
  const [open, setOpen] = useState(false);
  const proof = (deposit.gatewayResponse as Record<string, string> | null)?.proofFileUrl ?? null;
  const fee = Number(deposit.feeBdt);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors"
      >
        View
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                  <ArrowDownLeft className="h-4 w-4 text-success" />
                </div>
                <h2 className="font-semibold">Deposit Details</h2>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[deposit.status] ?? "bg-muted text-muted-foreground border-border")}>
                  {STATUS_LABELS[deposit.status] ?? deposit.status}
                </span>
              </div>

              {/* Amounts */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2.5">
                <Row label="Amount" value={fmtBdt(deposit.amountBdt)} bold />
                {fee > 0 && <Row label="Fee" value={fmtBdt(fee)} className="text-destructive" />}
                <Row label="Net Credited" value={fmtBdt(deposit.netAmountBdt)} className="text-success" />
              </div>

              {/* Details */}
              <div className="rounded-xl bg-muted/40 p-4 space-y-2.5">
                <Row label="Method" value={deposit.method.replace(/_/g, " ")} />
                {deposit.externalReference && <Row label="Reference" value={deposit.externalReference} />}
                {deposit.description && <Row label="Note" value={deposit.description} />}
                <Row label="Submitted" value={fmtDate(deposit.createdAt)} />
                {deposit.processedAt && <Row label="Processed" value={fmtDate(deposit.processedAt)} />}
              </div>

              {/* Proof link */}
              {proof && (
                <a
                  href={proof}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 w-full rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  View Payment Proof ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Row({ label, value, bold, className }: { label: string; value: string; bold?: boolean; className?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={cn("text-xs font-medium text-right truncate", bold && "text-sm font-semibold", className)}>{value}</span>
    </div>
  );
}
