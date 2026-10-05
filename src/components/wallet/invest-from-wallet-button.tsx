"use client";

import { useState, useTransition } from "react";
import { Wallet, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { investFromWalletAction } from "@/server/actions/wallet.actions";

interface Props {
  projectId: string;
  projectTitle: string;
  minAmountBdt: number;
  availableBalance: number;
}

export function InvestFromWalletButton({ projectId, projectTitle, minAmountBdt, availableBalance }: Props) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(minAmountBdt));
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canInvest = availableBalance >= minAmountBdt;

  function handleClose() { setOpen(false); setError(null); setReceipt(null); setAmount(String(minAmountBdt)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if (amt > availableBalance) { setError(`Insufficient balance. Available: ৳${availableBalance.toLocaleString("en-BD")}`); return; }
    setError(null);

    const idempotencyKey = `wallet-inv-${projectId}-${Date.now()}`;
    startTransition(async () => {
      const result = await investFromWalletAction({ projectId, amountBdt: amt, idempotencyKey });
      if (!result.success) { setError(result.error); return; }
      setReceipt(result.data.receiptNumber);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        disabled={!canInvest}
        className="flex items-center gap-2 rounded-lg border border-primary bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Wallet className="h-4 w-4" />
        Invest from Wallet
        {canInvest && <span className="ml-1 text-xs font-normal opacity-70">৳{availableBalance.toLocaleString("en-BD")} available</span>}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold">Invest from Wallet</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>

            {receipt ? (
              <div className="px-6 py-10 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-muted">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                </div>
                <p className="font-semibold">Investment Confirmed!</p>
                <p className="text-sm text-muted-foreground">Receipt: <span className="font-mono font-medium text-foreground">{receipt}</span></p>
                <button onClick={handleClose} className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Done</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
                  <p className="text-muted-foreground">Investing in</p>
                  <p className="font-medium truncate">{projectTitle}</p>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Wallet Balance</span>
                  <span className="font-semibold text-success">৳{availableBalance.toLocaleString("en-BD")}</span>
                </div>

                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="inv-amount" className="text-sm font-medium">Investment Amount (BDT)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                    <input
                      id="inv-amount"
                      type="number"
                      min={minAmountBdt}
                      max={availableBalance}
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background py-2.5 pl-7 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Min: ৳{minAmountBdt.toLocaleString("en-BD")}</p>
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wallet className="h-4 w-4" />}
                  {isPending ? "Processing…" : "Confirm Investment"}
                </button>
                <p className="text-center text-xs text-muted-foreground">Funds will be deducted from your wallet immediately</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
