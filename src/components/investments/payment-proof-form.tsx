"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import { uploadPaymentProofAction } from "@/server/actions/upload-proof.actions";
import { submitManualPaymentAction } from "@/server/actions/manual-payment.actions";
import { initiatePaymentAction } from "@/server/actions/investment.actions";
import { Upload, FileText, X, CheckCircle2, Loader2, Copy, Check, Building2 } from "lucide-react";

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

type Props = {
  investmentId: string;
  bankAccounts: BankAccount[];
  amountBdt: number;
};

const PAYMENT_METHODS = [
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CHECK",         label: "Check" },
  { value: "CASH",          label: "Cash" },
  { value: "MOBILE_BANKING", label: "Mobile Banking" },
  { value: "OTHER",         label: "Other" },
] as const;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function BankDetailRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground shrink-0 w-28">{label}</span>
      <div className="flex items-center gap-0 min-w-0 flex-1 justify-end">
        <span className={`text-xs font-medium text-right break-all ${mono ? "font-mono" : ""}`}>{value}</span>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

export function PaymentProofForm({ investmentId, bankAccounts, amountBdt }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("BANK_TRANSFER");
  const [bankAccountId, setBankAccountId] = useState(bankAccounts[0]?.id ?? "");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "uploading" | "done">("form");
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedAccount = bankAccounts.find((a) => a.id === bankAccountId) ?? null;
  const needsBankAccount = paymentMethod === "BANK_TRANSFER";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please select a payment proof file."); return; }
    if (needsBankAccount && !bankAccountId) { setError("Please select a bank account."); return; }
    if (!transactionRef.trim()) { setError("Transaction reference is required."); return; }

    setError("");
    setStep("uploading");

    startTransition(async () => {
      const initiateResult = await initiatePaymentAction(investmentId, paymentMethod);
      if (!initiateResult.success && !initiateResult.error?.includes("PAYMENT_PENDING")) {
        setError(initiateResult.error ?? "Failed to initiate payment.");
        setStep("form");
        return;
      }

      const fd = new FormData();
      fd.append("file", file);
      const uploadResult = await uploadPaymentProofAction(fd);
      if (!uploadResult.success) {
        setError(uploadResult.error ?? "File upload failed.");
        setStep("form");
        return;
      }

      const submitResult = await submitManualPaymentAction({
        investmentId,
        bankAccountId: needsBankAccount ? bankAccountId : null,
        paymentMethod,
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
          Transfer <span className="font-semibold text-foreground">৳{amountBdt.toLocaleString("en-BD")}</span> using your preferred method, then fill in the details below.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {/* ── Payment Method ── */}
      <div>
        <label className="mb-2 block text-xs font-medium">Payment Method <span className="text-destructive">*</span></label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setPaymentMethod(m.value)}
              className={`rounded-xl border px-3 py-2.5 text-xs font-medium text-left transition-colors ${
                paymentMethod === m.value
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Bank Account Selection (Bank Transfer only) ── */}
      {needsBankAccount && (
        <div>
          <label className="mb-2 block text-xs font-medium">
            Select Bank Account <span className="text-destructive">*</span>
          </label>

          {bankAccounts.length === 0 ? (
            <p className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs text-warning-foreground">
              No bank accounts configured for this project. Please contact support.
            </p>
          ) : (
            <div className="space-y-2">
              {bankAccounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setBankAccountId(acc.id)}
                  className={`w-full rounded-xl border p-3.5 text-left transition-colors ${
                    bankAccountId === acc.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div>
                        <p className="font-semibold text-sm">{acc.bankName}</p>
                        <p className="text-xs text-muted-foreground">{acc.accountName} · ****{acc.accountNumber.slice(-4)}</p>
                      </div>
                    </div>
                    <span className={`h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      bankAccountId === acc.id ? "border-primary bg-primary" : "border-muted-foreground"
                    }`}>
                      {bankAccountId === acc.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected account full details with copy buttons */}
          {selectedAccount && (
            <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Bank Account Details</p>
              <div className="space-y-0">
                <BankDetailRow label="Account Name" value={selectedAccount.accountName} />
                <BankDetailRow label="Account No." value={selectedAccount.accountNumber} mono />
                <BankDetailRow label="Bank Name" value={selectedAccount.bankName} />
                {selectedAccount.branchName && <BankDetailRow label="Branch" value={selectedAccount.branchName} />}
                {selectedAccount.routingNumber && <BankDetailRow label="Routing No." value={selectedAccount.routingNumber} mono />}
                {selectedAccount.swiftCode && <BankDetailRow label="SWIFT Code" value={selectedAccount.swiftCode} mono />}
                {selectedAccount.mobileNumber && <BankDetailRow label="Mobile" value={selectedAccount.mobileNumber} mono />}
                {selectedAccount.email && <BankDetailRow label="Email" value={selectedAccount.email} />}
                {selectedAccount.branchAddress && <BankDetailRow label="Branch Address" value={selectedAccount.branchAddress} />}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Transaction Reference ── */}
      <div>
        <label className="mb-1.5 block text-xs font-medium">
          Transaction Reference / TxID <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="e.g. TXN123456789"
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* ── Proof File ── */}
      <div>
        <label className="mb-1.5 block text-xs font-medium">
          Payment Proof (Screenshot / PDF) <span className="text-destructive">*</span>
        </label>
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

      {/* ── Notes ── */}
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
