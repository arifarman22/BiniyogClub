"use client";

import { useState, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadPaymentProofAction } from "@/server/actions/upload-proof.actions";
import { submitManualPaymentAction } from "@/server/actions/manual-payment.actions";
import { initiatePaymentAction } from "@/server/actions/investment.actions";
import { Upload, FileText, X, CheckCircle2, Loader2 } from "lucide-react";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
};

type Props = {
  investmentId: string;
  bankAccounts: BankAccount[];
  amountBdt: number;
};

export function PaymentProofForm({ investmentId, bankAccounts, amountBdt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "uploading" | "done">("form");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a payment proof file."); return; }
    if (!bankAccountId) { setError("Please select a bank account."); return; }
    if (!transactionRef.trim()) { setError("Transaction reference is required."); return; }

    setError("");
    setStep("uploading");

    startTransition(async () => {
      // Step 1: Move investment to PAYMENT_PENDING
      const initiateResult = await initiatePaymentAction(investmentId, "BANK_TRANSFER");
      if (!initiateResult.success) {
        // Already PAYMENT_PENDING is fine — continue
        if (!initiateResult.error?.includes("PAYMENT_PENDING")) {
          setError(initiateResult.error ?? "Failed to initiate payment.");
          setStep("form");
          return;
        }
      }

      // Step 2: Upload proof to Cloudinary
      const fd = new FormData();
      fd.append("file", file);
      const uploadResult = await uploadPaymentProofAction(fd);
      if (!uploadResult.success) {
        setError(uploadResult.error ?? "File upload failed.");
        setStep("form");
        return;
      }

      // Step 3: Submit proof for review
      const submitResult = await submitManualPaymentAction({
        investmentId,
        bankAccountId,
        transactionRef: transactionRef.trim(),
        proofFileUrl: uploadResult.data!.url,
        proofMimeType: uploadResult.data!.mimeType,
        notes: notes.trim() || undefined,
      });

      if (!submitResult.success) {
        setError(submitResult.error ?? "Submission failed.");
        setStep("form");
        return;
      }

      setStep("done");
    });
  }

  if (step === "done") {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/5 p-6 text-center space-y-3">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
        <p className="font-semibold text-success">Payment proof submitted!</p>
        <p className="text-sm text-muted-foreground">
          Our finance team will verify your payment within 1–2 business days. You&apos;ll receive a notification once approved.
        </p>
        <button
          onClick={() => router.push("/dashboard/investments")}
          className="mt-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          Go to My Investments
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <div>
        <h2 className="font-semibold text-sm">Submit Payment Proof</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Transfer <span className="font-semibold text-foreground">৳{amountBdt.toLocaleString("en-BD")}</span> to one of the accounts above, then fill in the details below.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {/* Bank account selector */}
      {bankAccounts.length > 1 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium">Bank Account You Transferred To <span className="text-destructive">*</span></label>
          <select
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {bankAccounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.bankName} — {acc.accountNumber}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Transaction reference */}
      <div>
        <label className="mb-1.5 block text-xs font-medium">Transaction Reference / TxID <span className="text-destructive">*</span></label>
        <input
          type="text"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="e.g. TXN123456789"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Proof file */}
      <div>
        <label className="mb-1.5 block text-xs font-medium">Payment Proof (Screenshot / PDF) <span className="text-destructive">*</span></label>
        <div
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-6 transition-colors hover:border-primary/50 hover:bg-muted/50"
        >
          {file ? (
            <div className="flex items-center gap-2 text-sm">
              <FileText className="h-5 w-5 text-primary" />
              <span className="font-medium">{file.name}</span>
              <span className="text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setFile(null); if (inputRef.current) inputRef.current.value = ""; }}
                className="ml-1 text-muted-foreground hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-7 w-7 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Click to upload screenshot or PDF</p>
              <p className="text-xs text-muted-foreground">JPEG, PNG, WebP, or PDF · Max 10 MB</p>
            </>
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional information for the reviewer..."
          rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit"
        disabled={isPending || step === "uploading"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60 transition-colors"
      >
        {(isPending || step === "uploading") && <Loader2 className="h-4 w-4 animate-spin" />}
        {step === "uploading" ? "Uploading…" : "Submit Payment Proof"}
      </button>
    </form>
  );
}
