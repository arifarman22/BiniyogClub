"use client";

import { useState, useRef } from "react";
import { submitGroupPaymentProofAction } from "@/server/actions/group-investment.actions";

type BankAccount = {
  id: string; bankName: string; accountName: string;
  accountNumber: string; routingNumber: string | null;
  branchName: string | null; instructions: string | null;
};

type Props = {
  groupInvestmentId: string;
  amountBdt: number;
  bankAccounts: BankAccount[];
};

export function GroupPaymentProofButton({ groupInvestmentId, amountBdt, bankAccounts }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState(bankAccounts[0]?.id ?? "");
  const [txRef, setTxRef] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const bank = bankAccounts.find((b) => b.id === selectedBank);

  async function handleSubmit(e: React.FormEvent) {
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
      notes: notes || undefined,
    });

    setLoading(false);
    if (result.success) {
      setOpen(false);
      setTxRef(""); setNotes(""); setFile(null);
    } else {
      setError(result.error ?? "Submission failed");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/80 transition-colors shrink-0">
        Submit Payment Proof
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Submit Payment Proof</h2>
          <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 p-5">
          {error && <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">{error}</p>}

          <div className="rounded-lg bg-muted/40 px-3 py-2 text-xs">
            Transfer <span className="font-semibold text-primary">৳{amountBdt.toLocaleString("en-BD")}</span> to the bank account below.
          </div>

          {bankAccounts.length > 1 && (
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Bank Account</label>
              <select value={selectedBank} onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                {bankAccounts.map((b) => <option key={b.id} value={b.id}>{b.bankName} — {b.accountNumber}</option>)}
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
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Payment Screenshot / Receipt <span className="text-destructive">*</span></label>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm file:mr-2 file:rounded file:border-0 file:bg-primary file:px-2 file:py-1 file:text-xs file:text-primary-foreground" />
            {file && <p className="mt-0.5 text-[10px] text-muted-foreground">{file.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/40">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60">
              {loading ? "Submitting…" : "Submit Proof"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
