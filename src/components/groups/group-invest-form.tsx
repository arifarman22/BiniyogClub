"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createGroupInvestmentAction, submitGroupPaymentProofAction } from "@/server/actions/group-investment.actions";

type BankAccount = {
  id: string; bankName: string; accountName: string;
  accountNumber: string; routingNumber: string | null;
  branchName: string | null; instructions: string | null;
};

type Tier = {
  id: string; name: string; type: string;
  minAmountBdt: number; maxAmountBdt?: number;
  plotSizeSqft?: number; pricePerSqftBdt?: number;
};

type Props = {
  tier: Tier;
  bankAccounts: BankAccount[];
  entityName: string;
  groupName: string;
  isLoggedIn: boolean;
  kycApproved: boolean;
  currentPath: string;
};

type Step = "cta" | "form" | "payment" | "done";

function GroupInvestFormInner({ tier, bankAccounts, entityName, groupName, isLoggedIn, kycApproved, currentPath }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>("cta");
  const [groupInvestmentId, setGroupInvestmentId] = useState("");
  const [amount, setAmount] = useState(tier.minAmountBdt.toString());
  const [plotNumber, setPlotNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]?.id ?? "");
  const [txRef, setTxRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-open form if ?invest=tierId matches this tier (returned from login)
  useEffect(() => {
    if (isLoggedIn && searchParams.get("invest") === tier.id && bankAccounts.length > 0) {
      setStep("form");
      // Clean the URL param without reload
      const url = new URL(window.location.href);
      url.searchParams.delete("invest");
      window.history.replaceState({}, "", url.toString());
    }
  }, [isLoggedIn, searchParams, tier.id, bankAccounts.length]);

  const isPlot = tier.type === "PLOT_BOOKING";
  const bank = bankAccounts.find((b) => b.id === selectedBank);

  // Login URL includes callbackUrl with ?invest=tierId so form auto-opens after login
  const loginUrl = `/auth/login?callbackUrl=${encodeURIComponent(`${currentPath}?invest=${tier.id}`)}`;

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await createGroupInvestmentAction({
      tierId: tier.id,
      amountBdt: Number(amount),
      plotNumber: isPlot ? plotNumber || undefined : undefined,
      notes: notes || undefined,
    });
    setLoading(false);
    if (result.success && result.data) {
      setGroupInvestmentId(result.data.groupInvestmentId);
      setStep("payment");
    } else if (!result.success) {
      setError(result.error ?? "Failed to submit application");
    }
  }

  async function handlePaymentProof(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please attach your payment proof"); return; }
    setError("");
    setLoading(true);

    const proofFileUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const result = await submitGroupPaymentProofAction({
      groupInvestmentId,
      bankAccountId: selectedBank,
      transactionRef: txRef.trim(),
      proofFileUrl,
      proofMimeType: file.type,
      notes: paymentNotes || undefined,
    });
    setLoading(false);
    if (result.success) {
      setStep("done");
    } else {
      setError(result.error ?? "Failed to submit proof");
    }
  }

  // ── CTA step ──
  if (step === "cta") {
    if (!isLoggedIn) {
      return (
        <a
          href={loginUrl}
          className="block w-full rounded-lg bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Login to Invest
        </a>
      );
    }
    if (!kycApproved) {
      return (
        <div className="rounded-lg border border-warning/40 bg-warning/5 px-4 py-3 space-y-1.5">
          <p className="text-xs font-semibold text-warning">KYC Verification Required</p>
          <p className="text-xs text-muted-foreground">Complete your KYC to unlock investing.</p>
          <a
            href="/dashboard/kyc"
            className="block w-full rounded-lg bg-warning/90 px-3 py-2 text-center text-xs font-medium text-white hover:bg-warning transition-colors"
          >
            Complete KYC →
          </a>
        </div>
      );
    }
    if (bankAccounts.length === 0) {
      return (
        <p className="rounded-lg bg-muted px-4 py-3 text-center text-xs text-muted-foreground">
          Investment currently unavailable. Please check back soon.
        </p>
      );
    }
    return (
      <button
        onClick={() => setStep("form")}
        className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        Invest in {tier.name}
      </button>
    );
  }

  // ── Done step ──
  if (step === "done") {
    return (
      <div className="rounded-lg bg-success/10 border border-success/30 p-4 text-center space-y-2">
        <p className="text-2xl">✅</p>
        <p className="font-semibold text-sm text-success">Proof Submitted!</p>
        <p className="text-xs text-muted-foreground">Our finance team will verify your payment within 1–2 business days.</p>
        <button
          onClick={() => router.push("/dashboard/groups")}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/80"
        >
          View My Investments
        </button>
      </div>
    );
  }

  // ── Form & Payment steps ──
  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {step === "form" && (
        <form onSubmit={handleApply} className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {groupName} — {entityName} — {tier.name}
          </p>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Investment Amount (BDT) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={tier.minAmountBdt}
              max={tier.maxAmountBdt}
              required
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Min: ৳{tier.minAmountBdt.toLocaleString("en-BD")}
              {tier.maxAmountBdt ? ` · Max: ৳${tier.maxAmountBdt.toLocaleString("en-BD")}` : ""}
            </p>
          </div>

          {isPlot && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Preferred Plot Number (optional)</label>
              <input
                type="text"
                value={plotNumber}
                onChange={(e) => setPlotNumber(e.target.value)}
                placeholder="e.g. A-12"
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
            />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("cta")} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60">
              {loading ? "Submitting…" : "Continue to Payment"}
            </button>
          </div>
        </form>
      )}

      {step === "payment" && (
        <form onSubmit={handlePaymentProof} className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Step 2 — Submit Payment Proof</p>

          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
            Transfer <span className="font-semibold text-primary">৳{Number(amount).toLocaleString("en-BD")}</span> to the bank account below.
          </div>

          {bankAccounts.length > 1 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Bank Account</label>
              <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10">
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.bankName} — {b.accountNumber}</option>
                ))}
              </select>
            </div>
          )}

          {bank && (
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1 text-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span className="font-medium">{bank.bankName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-medium">{bank.accountName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Number</span><span className="font-mono font-medium">{bank.accountNumber}</span></div>
              {bank.routingNumber && <div className="flex justify-between"><span className="text-muted-foreground">Routing</span><span className="font-medium">{bank.routingNumber}</span></div>}
              {bank.instructions && <p className="mt-1 rounded bg-warning/10 px-2 py-1 text-warning-foreground border border-warning/20">{bank.instructions}</p>}
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Transaction Reference <span className="text-destructive">*</span></label>
            <input type="text" value={txRef} onChange={(e) => setTxRef(e.target.value)} required placeholder="e.g. TXN123456"
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Screenshot / Receipt <span className="text-destructive">*</span></label>
            <input type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10" />
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep("form")} className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
              Back
            </button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60">
              {loading ? "Submitting…" : "Submit Proof"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function GroupInvestForm(props: Props) {
  return (
    <Suspense fallback={null}>
      <GroupInvestFormInner {...props} />
    </Suspense>
  );
}
