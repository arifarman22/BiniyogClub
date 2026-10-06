"use client";

import { useState, useRef, useTransition } from "react";
import { X, Upload, CheckCircle2, AlertCircle, Loader2, Plus, Building2, Smartphone } from "lucide-react";
import { submitDepositRequestAction } from "@/server/actions/wallet.actions";

interface Props {
  walletId: string;
}

const METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2 },
  { value: "MOBILE_BANKING", label: "Mobile Banking", icon: Smartphone },
];

export function AddMoneyDialog({ walletId }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [method, setMethod] = useState("BANK_TRANSFER");
  const [amount, setAmount] = useState("");
  const [txRef, setTxRef] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofName, setProofName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    // Reuse the existing project image upload endpoint for proof files
    const res = await fetch("/api/upload/proof", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) { setError("Failed to upload proof. Try again."); return; }
    const data = await res.json();
    setProofUrl(data.url);
    setProofName(file.name);
    if (fileRef.current) fileRef.current.value = "";
  }

  function reset() {
    setStep("form"); setMethod("BANK_TRANSFER"); setAmount(""); setTxRef("");
    setProofUrl(""); setProofName(""); setError(null);
  }

  function handleClose() { setOpen(false); setTimeout(reset, 300); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount."); return; }
    if (!txRef.trim()) { setError("Transaction reference is required."); return; }
    if (!proofUrl) { setError("Please upload payment proof."); return; }
    setError(null);

    startTransition(async () => {
      const result = await submitDepositRequestAction({
        walletId,
        amountBdt: amt,
        paymentMethod: method,
        transactionRef: txRef.trim(),
        proofFileUrl: proofUrl,
      });
      if (!result.success) { setError(result.error); return; }
      setStep("success");
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/25"
      >
        <Plus className="h-4 w-4" /> Add Money
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />
          <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="font-semibold">Add Money to Wallet</h2>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            {step === "success" ? (
              <div className="px-6 py-10 text-center space-y-3">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-muted">
                  <CheckCircle2 className="h-7 w-7 text-success" />
                </div>
                <p className="font-semibold">Deposit Request Submitted</p>
                <p className="text-sm text-muted-foreground">
                  Our finance team will verify your payment and credit your wallet within 1–2 business days.
                </p>
                <button onClick={handleClose} className="mt-2 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
                {error && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Payment method */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-foreground">Payment Method</label>
                  <div className="grid grid-cols-2 gap-2">
                    {METHODS.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMethod(value)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition ${
                          method === value
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "border-border text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        <Icon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label htmlFor="amount" className="text-sm font-medium text-foreground">Amount (BDT)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">৳</span>
                    <input
                      id="amount"
                      type="number"
                      min="100"
                      step="1"
                      placeholder="5000"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground py-2.5 pl-7 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      required
                    />
                  </div>
                </div>

                {/* Transaction reference */}
                <div className="space-y-1.5">
                  <label htmlFor="txRef" className="text-sm font-medium text-foreground">Transaction Reference</label>
                  <input
                    id="txRef"
                    type="text"
                    placeholder="e.g. TXN123456789"
                    value={txRef}
                    onChange={(e) => setTxRef(e.target.value)}
                    className="w-full rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>

                {/* Proof upload */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Payment Proof</label>
                  {proofUrl ? (
                    <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success-muted/30 px-3 py-2.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        <span className="text-sm truncate">{proofName}</span>
                      </div>
                      <button type="button" onClick={() => { setProofUrl(""); setProofName(""); }} className="ml-2 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploading}
                      className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-4 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/30 transition disabled:opacity-50"
                    >
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      {uploading ? "Uploading…" : "Upload screenshot or receipt"}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileUpload} />
                  <p className="text-xs text-muted-foreground">JPEG, PNG, WebP or PDF · max 5 MB</p>
                </div>

                <button
                  type="submit"
                  disabled={isPending || uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {isPending ? "Submitting…" : "Submit Deposit Request"}
                </button>

                <p className="text-center text-xs text-muted-foreground">
                  Finance team verifies within 1–2 business days
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
