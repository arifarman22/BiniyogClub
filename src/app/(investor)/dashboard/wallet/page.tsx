export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorWallet } from "@/server/data/investor.data";
import { Wallet, ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { cn } from "cn";

export const metadata: Metadata = { title: "Wallet — Dashboard" };

const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-warning-muted text-warning-foreground",
  APPROVED: "bg-info-muted text-info-foreground",
  PROCESSING: "bg-info-muted text-info-foreground",
  COMPLETED: "bg-success-muted text-success",
  REJECTED: "bg-destructive/10 text-destructive",
  CANCELLED: "bg-muted text-muted-foreground",
};

function formatBdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export default async function WalletPage() {
  const session = await requireSession();
  const { wallet, totalDeposited, totalWithdrawn, pendingWithdrawals } = await getInvestorWallet(session);

  const balance = Number(wallet?.cachedBalance ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Wallet</h1>
        <p className="text-sm text-muted-foreground">Your Biniyog Club wallet balance and activity</p>
      </div>

      {/* Balance card */}
      <div className="rounded-xl bg-gradient-to-br from-brand-700 to-brand-600 p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-brand-100/80">Available Balance</p>
            <p className="mt-1 text-4xl font-bold">{formatBdt(balance)}</p>
            <p className="mt-1 text-xs text-brand-100/60">BDT · {wallet?.currency ?? "BDT"}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
            <Wallet className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
          <div>
            <p className="text-xs text-brand-100/70">Total Deposited</p>
            <p className="font-semibold">{formatBdt(totalDeposited)}</p>
          </div>
          <div>
            <p className="text-xs text-brand-100/70">Total Withdrawn</p>
            <p className="font-semibold">{formatBdt(totalWithdrawn)}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Deposited", value: formatBdt(totalDeposited), icon: <ArrowDownLeft className="h-4 w-4" />, color: "text-success", bg: "bg-success-muted" },
          { label: "Total Withdrawn", value: formatBdt(totalWithdrawn), icon: <ArrowUpRight className="h-4 w-4" />, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Pending Withdrawals", value: pendingWithdrawals.length.toString(), icon: <Clock className="h-4 w-4" />, color: "text-warning", bg: "bg-warning-muted" },
        ].map(({ label, value, icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", bg, color)}>{icon}</div>
            </div>
            <p className={cn("mt-2 text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending withdrawals */}
      {pendingWithdrawals.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Pending Withdrawals</h2>
          </div>
          <div className="divide-y divide-border">
            {pendingWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className="text-sm font-medium">{formatBdt(Number(w.amountBdt))}</p>
                  <p className="text-xs text-muted-foreground">
                    {w.method.replace("_", " ")} ·{" "}
                    {new Date(w.requestedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", WITHDRAWAL_STATUS_COLORS[w.status] ?? "bg-muted text-muted-foreground")}>
                  {w.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm text-muted-foreground space-y-2">
        <p className="font-medium text-foreground">About your wallet</p>
        <p>Your wallet balance is held in a segregated escrow account. Funds are only released when you make an investment or request a withdrawal.</p>
        <p>To deposit funds or request a withdrawal, please contact support or use the mobile app.</p>
      </div>
    </div>
  );
}
