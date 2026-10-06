"use client";

import { useState, useEffect, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createInvestmentAction } from "@/server/actions/investment.actions";
import { investFromWalletAction } from "@/server/actions/wallet.actions";
import { Wallet, CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

type Project = {
  id: string;
  title: string;
  minInvestmentBdt: number;
  maxInvestmentBdt?: number;
  expectedReturnPct: number;
  returnType: string;
  durationDays: number;
};

type Step = "cta" | "form" | "done";
type PayTab = "wallet" | "manual";

const RETURN_TYPE_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID: "Hybrid",
};

function ProjectInvestFormInner({
  project,
  isLoggedIn,
  kycApproved,
  currentPath,
  walletBalance = 0,
}: {
  project: Project;
  isLoggedIn: boolean;
  kycApproved: boolean;
  currentPath: string;
  walletBalance?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("cta");
  const [amount, setAmount] = useState(project.minInvestmentBdt.toString());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<PayTab>("manual");
  const [walletReceipt, setWalletReceipt] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(`${currentPath}?invest=${project.id}`)}`;

  useEffect(() => {
    if (isLoggedIn && searchParams.get("invest") === project.id) {
      setStep("form");
      const url = new URL(window.location.href);
      url.searchParams.delete("invest");
      window.history.replaceState({}, "", url.toString());
    }
  }, [isLoggedIn, searchParams, project.id]);

  const amtNum = Number(amount) || 0;
  const expectedReturn = ((amtNum * project.expectedReturnPct) / 100).toFixed(0);
  const canPayFromWallet = walletBalance >= project.minInvestmentBdt;

  // ── Manual payment flow ───────────────────────────────────────────────────
  async function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await createInvestmentAction({
      projectId: project.id,
      amountBdt: amtNum,
    });
    setLoading(false);
    if (result.success) {
      router.push(`/dashboard/investments/${result.data.investmentId}/pay`);
    } else {
      setError(result.error ?? "Failed to create investment");
    }
  }

  // ── Wallet payment flow ───────────────────────────────────────────────────
  function handleWalletSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (amtNum > walletBalance) {
      setError(`Insufficient balance. Available: ৳${walletBalance.toLocaleString("en-BD")}`);
      return;
    }
    setError("");
    const idempotencyKey = `wallet-inv-${project.id}-${Date.now()}`;
    startTransition(async () => {
      const result = await investFromWalletAction({ projectId: project.id, amountBdt: amtNum, idempotencyKey });
      if (!result.success) { setError(result.error ?? "Failed"); return; }
      setWalletReceipt(result.data.receiptNumber);
      setStep("done");
    });
  }

  // ── CTA / gate states ─────────────────────────────────────────────────────
  if (step === "cta") {
    if (!isLoggedIn) {
      return (
        <div className="space-y-2">
          <a href={loginUrl} className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
            Login to Invest
          </a>
          <a href={`/auth/register?callbackUrl=${encodeURIComponent(`${currentPath}?invest=${project.id}`)}`}
            className="block w-full rounded-lg border border-border px-4 py-2.5 text-center text-sm font-medium hover:bg-muted/40 transition-colors">
            Create Account
          </a>
        </div>
      );
    }
    if (!kycApproved) {
      return (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-warning">KYC Verification Required</p>
          <p className="text-xs text-muted-foreground">Complete your KYC to unlock investing.</p>
          <a href="/dashboard/kyc" className="block w-full rounded-lg bg-warning/90 px-3 py-2 text-center text-xs font-medium text-white hover:bg-warning transition-colors">
            Complete KYC →
          </a>
        </div>
      );
    }
    return (
      <button onClick={() => setStep("form")} className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
        Invest Now →
      </button>
    );
  }

  if (step === "done") {
    return (
      <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-center space-y-2">
        <CheckCircle2 className="h-8 w-8 text-success mx-auto" />
        <p className="font-semibold text-sm text-success">Investment Confirmed!</p>
        {walletReceipt && (
          <p className="text-xs text-muted-foreground font-mono">Receipt: {walletReceipt}</p>
        )}
        <button onClick={() => router.push("/dashboard/investments")}
          className="mt-2 w-full rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80">
          Go to My Investments
        </button>
      </div>
    );
  }

  // ── Investment form ───────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* Amount input — shared between both tabs */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Investment Amount (BDT) <span className="text-destructive">*</span>
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          min={project.minInvestmentBdt}
          max={project.maxInvestmentBdt}
          className="w-full rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          Min: ৳{project.minInvestmentBdt.toLocaleString("en-BD")}
          {project.maxInvestmentBdt ? ` · Max: ৳${project.maxInvestmentBdt.toLocaleString("en-BD")}` : ""}
        </p>
      </div>

      {/* Return preview */}
      <div className="rounded-lg bg-muted/40 p-3 space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Expected return</span>
          <span className="font-semibold text-success">+৳{Number(expectedReturn).toLocaleString("en-BD")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Return type</span>
          <span className="font-medium">{RETURN_TYPE_LABELS[project.returnType] ?? project.returnType}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium">{project.durationDays} days</span>
        </div>
      </div>

      {/* Payment method tabs */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Payment Method</p>
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => { setActiveTab("manual"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors ${
              activeTab === "manual"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <CreditCard className="h-3.5 w-3.5" /> Bank / Mobile
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("wallet"); setError(""); }}
            className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors ${
              activeTab === "wallet"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40"
            }`}
          >
            <Wallet className="h-3.5 w-3.5" /> Wallet
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{error}
        </div>
      )}

      {/* Wallet tab content */}
      {activeTab === "wallet" && (
        <div className="space-y-3">
          <div className={`rounded-lg border px-3 py-2.5 text-xs ${canPayFromWallet ? "border-success/30 bg-success/5" : "border-warning/30 bg-warning/5"}`}>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Wallet Balance</span>
              <span className={`font-semibold ${canPayFromWallet ? "text-success" : "text-warning"}`}>
                ৳{walletBalance.toLocaleString("en-BD")}
              </span>
            </div>
            {!canPayFromWallet && (
              <p className="mt-1 text-warning">
                Insufficient wallet balance. <a href="/dashboard/wallet" className="underline font-medium">Deposit funds →</a>
              </p>
            )}
            {canPayFromWallet && amtNum > walletBalance && (
              <p className="mt-1 text-warning">Amount exceeds your balance.</p>
            )}
          </div>
          <form onSubmit={handleWalletSubmit} className="flex gap-2">
            <button type="button" onClick={() => setStep("cta")} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || !canPayFromWallet || amtNum > walletBalance || amtNum < project.minInvestmentBdt}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wallet className="h-3.5 w-3.5" />}
              {isPending ? "Processing…" : "Pay from Wallet"}
            </button>
          </form>
        </div>
      )}

      {/* Manual payment tab content */}
      {activeTab === "manual" && (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <button type="button" onClick={() => setStep("cta")} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60">
            {loading ? "Processing…" : "Continue →"}
          </button>
        </form>
      )}
    </div>
  );
}

type ProjectInvestFormProps = {
  project: Project;
  isLoggedIn: boolean;
  kycApproved: boolean;
  currentPath: string;
  walletBalance?: number;
};

export function ProjectInvestForm(props: ProjectInvestFormProps) {
  return (
    <Suspense fallback={null}>
      <ProjectInvestFormInner {...props} />
    </Suspense>
  );
}
