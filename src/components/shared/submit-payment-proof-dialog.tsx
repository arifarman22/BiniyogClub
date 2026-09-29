"use client";

import { useState, useRef } from "react";
import { submitManualPaymentAction } from "@/server/actions/manual-payment.actions";
import { toast } from "@/components/ui/toast";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string | null;
  branchName: string | null;
  instructions: string | null;
};

type Props = {
  investmentId: string;
  amountBdt: number;
  bankAccounts: BankAccount[];
  onSuccess?: () => void;
};

export function SubmitPaymentProofDialog({ investmentId, amountBdt, bankAccounts, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]?.id ?? "");
  const [transactionRef, setTransactionRef] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.add({ title: "Please attach your payment proof", type: "error" }); return; }
    if (!selectedBank) { toast.add({ title: "Please select a bank account", type: "error" }); return; }
    if (!transactionRef.trim()) { toast.add({ title: "Transaction reference is required", type: "error" }); return; }

    setLoading(true);
    try {
      // In production replace with a real upload to S3/storage.
      // For now we use a data URL so the flow works end-to-end in dev.
      const proofFileUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await submitManualPaymentAction({
        investmentId,
        bankAccountId: selectedBank,
        transactionRef: transactionRef.trim(),
        proofFileUrl,
        proofMimeType: file.type,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        toast.add({ title: "Proof submitted!", description: "Finance team will review within 1–2 business days.", type: "success" });
        setOpen(false);
        setTransactionRef("");
        setNotes("");
        setFile(null);
        onSuccess?.();
      } else {
        toast.add({ title: "Submission failed", description: result.error, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  }

  const bank = bankAccounts.find((b) => b.id === selectedBank);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
      >
        Submit Payment Proof
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Submit Payment Proof</h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {/* Amount reminder */}
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm">
            Transfer exactly <span className="font-semibold text-primary">৳{amountBdt.toLocaleString("en-BD")}</span> to the bank account below.
          </div>

          {/* Bank account selector */}
          {bankAccounts.length > 1 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Select Bank Account</label>
              <select
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {bankAccounts.map((b) => (
                  <option key={b.id} value={b.id}>{b.bankName} — {b.accountNumber}</option>
                ))}
              </select>
            </div>
          )}

          {/* Bank details card */}
          {bank && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-1.5 text-sm">
              <Row label="Bank" value={bank.bankName} />
              <Row label="Account Name" value={bank.accountName} />
              <Row label="Account Number" value={bank.accountNumber} />
              {bank.routingNumber && <Row label="Routing No." value={bank.routingNumber} />}
              {bank.branchName && <Row label="Branch" value={bank.branchName} />}
              {bank.instructions && (
                <p className="mt-2 rounded bg-warning/10 px-3 py-2 text-xs text-warning-foreground border border-warning/20">
                  {bank.instructions}
                </p>
              )}
            </div>
          )}

          {/* Transaction reference */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
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

          {/* Proof upload */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Payment Screenshot / Receipt <span className="text-destructive">*</span>
            </label>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground"
            />
            {file && <p className="mt-1 text-xs text-muted-foreground">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
          </div>

          {/* Optional notes */}
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional information for the finance team"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60 transition-colors"
            >
              {loading ? "Submitting…" : "Submit Proof"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
