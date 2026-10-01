export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorWallet } from "@/server/data/investor.data";
import { ledgerService } from "@/server/services/ledger.service";
import { db } from "@/lib/db/prisma";
import { WithdrawDialog } from "@/components/wallet/withdraw-dialog";
import { CancelWithdrawalButton } from "@/components/wallet/cancel-withdrawal-button";
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock, AlertCircle, Building2, Smartphone, BadgeCheck, BadgeX, CreditCard, Wifi } from "lucide-react";
import { cn } from "cn";

export const metadata: Metadata = { title: "Wallet — Dashboard" };

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-warning/10 text-warning border-warning/30",
  APPROVED:   "bg-info/10 text-info border-info/30",
  PROCESSING: "bg-info/10 text-info border-info/30",
  COMPLETED:  "bg-success-muted text-success border-success/30",
  REJECTED:   "bg-destructive/10 text-destructive border-destructive/30",
  CANCELLED:  "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING:    "Pending Review",
  APPROVED:   "Approved",
  PROCESSING: "Processing",
  COMPLETED:  "Completed",
  REJECTED:   "Rejected",
  CANCELLED:  "Cancelled",
};

function fmtBdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

export default async function WalletPage() {
  const session = await requireSession();
  const [{ wallet, totalDeposited, totalWithdrawn, pendingWithdrawals }, kyc] = await Promise.all([
    getInvestorWallet(session),
    db.kyc.findUnique({
      where: { userId: session.id },
      select: {
        status: true,
        fullName: true,
        bankName: true,
        bankAccountNumber: true,
        mobileProvider: true,
        mobileNumber: true,
      },
    }),
  ]);

  // Use ledger-derived true balance for display and withdrawal validation
  const trueBalance = wallet ? await ledgerService.getTrueBalance(wallet.id) : 0;
  const cachedBalance = Number(wallet?.cachedBalance ?? 0);

  // All withdrawals for history
  const allWithdrawals = wallet
    ? await db.withdrawal.findMany({
        where: { walletId: wallet.id },
        select: {
          id: true, status: true, amountBdt: true, netAmountBdt: true,
          method: true, bankName: true, accountNumber: true, accountName: true,
          mobileNumber: true, rejectionReason: true,
          requestedAt: true, approvedAt: true, completedAt: true, rejectedAt: true,
        },
        orderBy: { requestedAt: "desc" },
        take: 20,
      })
    : [];

  const pendingTotal = pendingWithdrawals.reduce((s, w) => s + Number(w.amountBdt), 0);
  const availableBalance = Math.max(0, trueBalance - pendingTotal);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">Your Biniyog Club wallet balance and withdrawals</p>
      </div>

      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-brand-100/80">Available Balance</p>
            <p className="mt-1 text-4xl font-bold">{fmtBdt(availableBalance)}</p>
            <p className="mt-1 text-xs text-brand-100/60">
              Total: {fmtBdt(trueBalance)}
              {pendingTotal > 0 && ` · ${fmtBdt(pendingTotal)} reserved`}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
              <Wallet className="h-6 w-6" />
            </div>
            <WithdrawDialog availableBalance={availableBalance} />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
          <div>
            <p className="text-xs text-brand-100/70">Total Deposited</p>
            <p className="font-semibold">{fmtBdt(totalDeposited)}</p>
          </div>
          <div>
            <p className="text-xs text-brand-100/70">Total Withdrawn</p>
            <p className="font-semibold">{fmtBdt(totalWithdrawn)}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Deposited",      value: fmtBdt(totalDeposited),            icon: ArrowDownLeft, color: "text-success",     bg: "bg-success/10" },
          { label: "Total Withdrawn",       value: fmtBdt(totalWithdrawn),            icon: ArrowUpRight,  color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Pending Withdrawals",   value: pendingWithdrawals.length.toString(), icon: Clock,      color: "text-warning",     bg: "bg-warning/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", bg, color)}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
            <p className={cn("mt-2 text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending withdrawals — with cancel */}
      {pendingWithdrawals.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4 flex items-center justify-between">
            <h2 className="font-semibold">Pending Withdrawals</h2>
            <span className="rounded-full bg-warning/10 px-2.5 py-0.5 text-xs font-medium text-warning">
              {fmtBdt(pendingTotal)} reserved
            </span>
          </div>
          <div className="divide-y divide-border">
            {pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{fmtBdt(Number(w.amountBdt))}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {w.method.replace("_", " ")} · {fmtDate(w.requestedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[w.status])}>
                    {STATUS_LABELS[w.status] ?? w.status}
                  </span>
                  {w.status === "PENDING" && <CancelWithdrawalButton withdrawalId={w.id} />}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Withdrawal history */}
      {allWithdrawals.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Withdrawal History</h2>
          </div>
          <div className="divide-y divide-border">
            {allWithdrawals.map((w) => (
              <div key={w.id} className="px-5 py-4 space-y-1.5">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{fmtBdt(Number(w.amountBdt))}</p>
                    <p className="text-xs text-muted-foreground">
                      {w.method.replace("_", " ")}
                      {w.method === "BANK_TRANSFER" && w.bankName && ` · ${w.bankName}`}
                      {w.method === "MOBILE_BANKING" && w.mobileNumber && ` · ${w.mobileNumber}`}
                      {" · "}{fmtDate(w.requestedAt)}
                    </p>
                  </div>
                  <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0", STATUS_COLORS[w.status])}>
                    {STATUS_LABELS[w.status] ?? w.status}
                  </span>
                </div>
                {w.status === "REJECTED" && w.rejectionReason && (
                  <div className="flex items-start gap-1.5 rounded-lg bg-destructive/5 border border-destructive/20 px-3 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-destructive mt-0.5" />
                    <p className="text-xs text-destructive">{w.rejectionReason}</p>
                  </div>
                )}
                {w.status === "COMPLETED" && w.completedAt && (
                  <p className="text-xs text-success">Completed {fmtDate(w.completedAt)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {allWithdrawals.length === 0 && (
        <div className="rounded-xl border border-dashed border-border py-12 text-center">
          <Wallet className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm font-medium">No withdrawals yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Your withdrawal history will appear here once you make a request.
          </p>
        </div>
      )}

      {/* Saved account details from KYC */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Saved Account Details</h2>
          {kyc?.status === "VERIFIED" ? (
            <span className="flex items-center gap-1 text-xs text-success font-medium">
              <BadgeCheck className="h-3.5 w-3.5" /> KYC Verified
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <BadgeX className="h-3.5 w-3.5" /> {kyc?.status?.replace(/_/g, " ") ?? "Not Started"}
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Bank account card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 p-5 text-white shadow-lg">
            {/* decorative circles */}
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-8 -right-2 h-36 w-36 rounded-full bg-white/5" />

            <div className="relative flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Building2 className="h-5 w-5" />
              </div>
              <Wifi className="h-4 w-4 rotate-90 text-white/40" />
            </div>

            <div className="relative mt-5">
              <p className="font-mono text-lg tracking-widest text-white/90">
                {kyc?.bankAccountNumber ?? "—"}
              </p>
            </div>

            <div className="relative mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Account Holder</p>
                <p className="mt-0.5 text-sm font-medium">{kyc?.fullName ?? "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Bank</p>
                <p className="mt-0.5 text-sm font-medium">{kyc?.bankName ?? "—"}</p>
              </div>
            </div>

            <div className="relative mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3">
              <CreditCard className="h-3.5 w-3.5 text-white/40" />
              <p className="text-[10px] uppercase tracking-wider text-white/40">Bank Transfer</p>
            </div>

            {!kyc?.bankName && !kyc?.bankAccountNumber && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-slate-900/80 backdrop-blur-sm">
                <Building2 className="h-6 w-6 text-white/30 mb-2" />
                <p className="text-xs text-white/50">No bank account in KYC</p>
              </div>
            )}
          </div>

          {/* Mobile banking card */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-700 p-5 text-white shadow-lg">
            <div className="pointer-events-none absolute -right-6 -top-6 h-28 w-28 rounded-full bg-white/5" />
            <div className="pointer-events-none absolute -bottom-8 -right-2 h-36 w-36 rounded-full bg-white/5" />

            <div className="relative flex items-start justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Smartphone className="h-5 w-5" />
              </div>
              <Wifi className="h-4 w-4 rotate-90 text-white/40" />
            </div>

            <div className="relative mt-5">
              <p className="font-mono text-lg tracking-widest text-white/90">
                {kyc?.mobileNumber ?? "—"}
              </p>
            </div>

            <div className="relative mt-4 flex items-end justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-white/50">Account Holder</p>
                <p className="mt-0.5 text-sm font-medium">{kyc?.fullName ?? "—"}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wider text-white/50">Provider</p>
                <p className="mt-0.5 text-sm font-medium">{kyc?.mobileProvider ?? "—"}</p>
              </div>
            </div>

            <div className="relative mt-3 flex items-center gap-1.5 border-t border-white/10 pt-3">
              <Smartphone className="h-3.5 w-3.5 text-white/40" />
              <p className="text-[10px] uppercase tracking-wider text-white/40">Mobile Banking</p>
            </div>

            {!kyc?.mobileProvider && !kyc?.mobileNumber && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-emerald-900/80 backdrop-blur-sm">
                <Smartphone className="h-6 w-6 text-white/30 mb-2" />
                <p className="text-xs text-white/50">No mobile account in KYC</p>
              </div>
            )}
          </div>
        </div>

        {kyc?.status !== "VERIFIED" && (
          <p className="text-xs text-muted-foreground">
            Complete your KYC verification to save account details for faster withdrawals.
          </p>
        )}
      </div>

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">How withdrawals work</p>
        <p>Funds are reserved immediately when you submit a request. Finance team reviews and approves within 1–2 business days. You can cancel a PENDING request before it is approved.</p>
      </div>
    </div>
  );
}
