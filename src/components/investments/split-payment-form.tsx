"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Banknote, Building2, Check, CheckCircle2, Copy, FileText, Landmark, Loader2, ReceiptText, Upload, X } from "lucide-react";
import { uploadPaymentProofAction } from "@/server/actions/upload-proof.actions";
import { submitPaymentPartsAction } from "@/server/actions/manual-payment.actions";
import { initiatePaymentAction } from "@/server/actions/investment.actions";
import {
  CASH_RECEIVERS,
  METHOD_META,
  PAYMENT_OPTIONS,
  ledgerPaymentMethod,
  toPaisa,
  type ManualPaymentMethod,
  type PaymentOption,
} from "@/lib/payments/split-payment";

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

type Part = {
  method: ManualPaymentMethod;
  amount: string;
  bankAccountId: string;
  cashReceivedBy: string;
  ref: string;
  file: File | null;
  notes: string;
};

type Props = {
  investmentId: string;
  bankAccounts: BankAccount[];
  /** Amount still owed (investment amount − approved − under review). */
  outstandingBdt: number;
  /** True while the investment is still PENDING and the payment must be initiated first. */
  needsInitiate: boolean;
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10";

const fmt = (n: number) => `৳${n.toLocaleString("en-BD", { maximumFractionDigits: 2 })}`;

const METHOD_ICON = { BANK_TRANSFER: Landmark, CHECK: ReceiptText, CASH: Banknote } as const;

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })}
      className="ml-1.5 inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
    >
      {copied ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function BankDetails({ account }: { account: BankAccount }) {
  const rows = [
    { label: "Account name", value: account.accountName },
    { label: "Account no.", value: account.accountNumber, mono: true },
    { label: "Bank", value: account.bankName },
    ...(account.branchName ? [{ label: "Branch", value: account.branchName }] : []),
    ...(account.routingNumber ? [{ label: "Routing no.", value: account.routingNumber, mono: true }] : []),
    ...(account.swiftCode ? [{ label: "SWIFT", value: account.swiftCode, mono: true }] : []),
  ];
  return (
    <div className="mt-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center justify-between gap-2 border-b border-border/50 py-1.5 last:border-0">
          <span className="w-24 shrink-0 text-xs text-muted-foreground">{r.label}</span>
          <span className="flex min-w-0 flex-1 items-center justify-end">
            <span className={`break-all text-right text-xs font-medium ${r.mono ? "font-mono" : ""}`}>{r.value}</span>
            <CopyButton value={r.value} />
          </span>
        </div>
      ))}
    </div>
  );
}

function ProofPicker({ file, label, required, onChange }: { file: File | null; label: string; required: boolean; onChange: (f: File | null) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium">
        {label} {required ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
      </label>
      <div
        onClick={() => ref.current?.click()}
        className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-4 py-4 text-sm transition-colors hover:border-primary/50 hover:bg-muted/50"
      >
        {file ? (
          <>
            <FileText className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate font-medium">{file.name}</span>
            <span className="shrink-0 text-xs text-muted-foreground">({(file.size / 1024).toFixed(0)} KB)</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); if (ref.current) ref.current.value = ""; }}
              className="text-muted-foreground hover:text-destructive"
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <>
            <Upload className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Upload image or PDF · max 10 MB</span>
          </>
        )}
        <input
          ref={ref}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

function blankPart(method: ManualPaymentMethod, amount: number, bankAccountId: string): Part {
  return {
    method,
    amount: amount > 0 ? String(amount) : "",
    bankAccountId,
    cashReceivedBy: "",
    ref: "",
    file: null,
    notes: "",
  };
}

export function SplitPaymentForm({ investmentId, bankAccounts, outstandingBdt, needsInitiate }: Props) {
  const router = useRouter();
  const defaultBank = bankAccounts[0]?.id ?? "";

  const [option, setOption] = useState<PaymentOption>("BANK");
  const [parts, setParts] = useState<Part[]>(() => [blankPart("BANK_TRANSFER", outstandingBdt, defaultBank)]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<"form" | "submitting" | "done">("form");
  const [progressText, setProgressText] = useState("");

  const isCombined = parts.length > 1;
  const allocated = parts.reduce((s, p) => s + toPaisa(Number(p.amount) || 0), 0) / 100;
  const remaining = (toPaisa(outstandingBdt) - toPaisa(allocated)) / 100;
  const balanced = toPaisa(remaining) === 0;

  function chooseOption(value: PaymentOption) {
    const opt = PAYMENT_OPTIONS.find((o) => o.value === value)!;
    setOption(value);
    setError("");
    // Keep details already typed for a method that stays in the new option; the
    // full amount starts on the first method and the investor moves part of it.
    setParts((prev) =>
      opt.methods.map((m, i) => {
        const amount = i === 0 ? outstandingBdt : 0;
        const kept = prev.find((p) => p.method === m);
        return kept ? { ...kept, amount: amount > 0 ? String(amount) : "" } : blankPart(m, amount, defaultBank);
      }),
    );
  }

  function update(index: number, patch: Partial<Part>) {
    setParts((ps) => {
      const next = ps.map((p, i) => (i === index ? { ...p, ...patch } : p));
      // In a combined payment, editing one amount fills the other with the rest.
      if (patch.amount !== undefined && next.length === 2) {
        const other = 1 - index;
        const rest = (toPaisa(outstandingBdt) - toPaisa(Number(patch.amount) || 0)) / 100;
        next[other] = { ...next[other], amount: rest > 0 ? String(rest) : "" };
      }
      return next;
    });
  }

  function validate(): string | null {
    for (const p of parts) {
      const meta = METHOD_META[p.method];
      const n = isCombined ? `${meta.label}: ` : "";
      if (!(Number(p.amount) > 0)) return `${n}enter an amount`;
      if (p.method === "BANK_TRANSFER" && !p.bankAccountId) return `${n}select the bank account you paid into`;
      if (p.method === "CASH" && !p.cashReceivedBy) return `${n}select who received the cash`;
      if (meta.refRequired && !p.ref.trim()) return `${n}${meta.refLabel.toLowerCase()} is required`;
      if (meta.proofRequired && !p.file) return `${n}upload ${meta.proofLabel.toLowerCase()}`;
      if (p.file && p.file.size > 10 * 1024 * 1024) return `${n}proof file must be under 10 MB`;
    }
    if (!balanced) {
      return remaining > 0
        ? `${fmt(remaining)} is still unallocated — the amounts must add up to ${fmt(outstandingBdt)}`
        : `The amounts are ${fmt(-remaining)} more than ${fmt(outstandingBdt)}`;
    }
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) { setError(problem); return; }
    setError("");
    setStatus("submitting");

    try {
      if (needsInitiate) {
        setProgressText("Preparing payment…");
        const init = await initiatePaymentAction(investmentId, ledgerPaymentMethod());
        if (!init.success && !init.error?.includes("PAYMENT_PENDING")) throw new Error(init.error ?? "Failed to start payment.");
      }

      const uploaded: ({ url: string; mimeType: string } | null)[] = [];
      for (const p of parts) {
        if (!p.file) { uploaded.push(null); continue; }
        setProgressText(`Uploading ${METHOD_META[p.method].label.toLowerCase()} proof…`);
        const fd = new FormData();
        fd.append("file", p.file);
        const res = await uploadPaymentProofAction(fd);
        if (!res.success) throw new Error(`${METHOD_META[p.method].label}: ${res.error ?? "File upload failed."}`);
        uploaded.push({ url: res.data.url, mimeType: res.data.mimeType });
      }

      setProgressText("Submitting for approval…");
      const result = await submitPaymentPartsAction({
        investmentId,
        parts: parts.map((p, i) => ({
          paymentMethod: p.method,
          amountBdt: Number(p.amount),
          bankAccountId: p.method === "BANK_TRANSFER" ? p.bankAccountId : null,
          cashReceivedBy: p.method === "CASH" ? p.cashReceivedBy : null,
          transactionRef: p.ref.trim() || undefined,
          proofFileUrl: uploaded[i]?.url,
          proofMimeType: uploaded[i]?.mimeType,
          notes: p.notes.trim() || undefined,
        })),
      });
      if (!result.success) throw new Error(result.error ?? "Submission failed.");

      setStatus("done");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("form");
    }
  }

  if (status === "done") {
    return (
      <div className="space-y-3 rounded-2xl border border-success/30 bg-success/5 p-6 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <p className="font-semibold text-success">Payment submitted for approval!</p>
        <p className="text-sm text-muted-foreground">
          Our finance team will verify your payment within 1–2 business days. You&apos;ll be notified once it&apos;s approved
          and your investment is active.
        </p>
        <button
          onClick={() => router.push("/dashboard/investments")}
          className="mt-2 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Go to My Investments
        </button>
      </div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="surface-card space-y-5 p-5">
      <div>
        <h2 className="text-sm font-semibold">Submit Payment Proof</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Pay <span className="font-semibold text-foreground">{fmt(outstandingBdt)}</span> with one method, or combine two.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>
      )}

      {/* ── Payment option ── */}
      <div>
        <label className="mb-2 block text-xs font-medium">How are you paying? <span className="text-destructive">*</span></label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {PAYMENT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              disabled={submitting}
              onClick={() => chooseOption(o.value)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-xs font-medium transition-colors ${
                option === o.value
                  ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                  : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              <span className="flex shrink-0 -space-x-1">
                {o.methods.map((m) => {
                  const Icon = METHOD_ICON[m];
                  return <Icon key={m} className="h-4 w-4" />;
                })}
              </span>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── One section per method ── */}
      <div className="space-y-4">
        {parts.map((p, i) => {
          const meta = METHOD_META[p.method];
          const Icon = METHOD_ICON[p.method];
          const account = bankAccounts.find((a) => a.id === p.bankAccountId) ?? null;
          return (
            <fieldset key={p.method} disabled={submitting} className="space-y-4 rounded-xl border border-border bg-muted/10 p-4">
              <legend className="sr-only">{meta.label} details</legend>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" /> {meta.label} {isCombined && "details"}
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    {isCombined ? `Amount paid by ${meta.label.toLowerCase()}` : "Amount"} (BDT) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={1}
                      step="0.01"
                      value={p.amount}
                      readOnly={!isCombined}
                      onChange={(e) => update(i, { amount: e.target.value })}
                      className={`${inputCls} pl-7 ${!isCombined ? "bg-muted/40" : ""}`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    {meta.refLabel}{" "}
                    {meta.refRequired ? <span className="text-destructive">*</span> : <span className="font-normal text-muted-foreground">(optional)</span>}
                  </label>
                  <input
                    type="text"
                    value={p.ref}
                    onChange={(e) => update(i, { ref: e.target.value })}
                    placeholder={meta.refPlaceholder}
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Bank: which admin-configured account */}
              {p.method === "BANK_TRANSFER" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Bank account you paid into <span className="text-destructive">*</span>
                  </label>
                  {bankAccounts.length === 0 ? (
                    <p className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-xs">
                      No bank accounts are configured for this project. Choose cheque or cash, or contact support.
                    </p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {bankAccounts.map((acc) => (
                          <button
                            key={acc.id}
                            type="button"
                            onClick={() => update(i, { bankAccountId: acc.id })}
                            className={`flex w-full items-center justify-between gap-2 rounded-xl border p-3 text-left transition-colors ${
                              p.bankAccountId === acc.id
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border bg-background hover:border-primary/40"
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <span>
                                <span className="block text-sm font-semibold">{acc.bankName}</span>
                                <span className="block text-xs text-muted-foreground">{acc.accountName} · ****{acc.accountNumber.slice(-4)}</span>
                              </span>
                            </span>
                            <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                              p.bankAccountId === acc.id ? "border-primary bg-primary" : "border-muted-foreground"
                            }`}>
                              {p.bankAccountId === acc.id && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                            </span>
                          </button>
                        ))}
                      </div>
                      {account && <BankDetails account={account} />}
                    </>
                  )}
                </div>
              )}

              {/* Cash: who received it */}
              {p.method === "CASH" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium">
                    Cash handed over to <span className="text-destructive">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {CASH_RECEIVERS.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => update(i, { cashReceivedBy: r.value })}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                          p.cashReceivedBy === r.value
                            ? "border-primary bg-primary/5 text-primary ring-1 ring-primary"
                            : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <ProofPicker file={p.file} label={meta.proofLabel} required={meta.proofRequired} onChange={(f) => update(i, { file: f })} />

              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
                <input
                  type="text"
                  value={p.notes}
                  onChange={(e) => update(i, { notes: e.target.value })}
                  placeholder={meta.notesPlaceholder}
                  className={inputCls}
                />
              </div>
            </fieldset>
          );
        })}
      </div>

      {/* ── Total check (combined payments) ── */}
      {isCombined && (
        <div className="rounded-xl border border-border bg-muted/20 p-4">
          <div className="flex h-2 overflow-hidden rounded-full bg-muted">
            {parts.map((p, i) => (
              <div
                key={p.method}
                className={i === 0 ? "bg-primary" : "bg-amber-500"}
                style={{ width: `${outstandingBdt > 0 ? Math.min(100, ((Number(p.amount) || 0) / outstandingBdt) * 100) : 0}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-muted-foreground">
              {parts.map((p) => `${METHOD_META[p.method].label} ${fmt(Number(p.amount) || 0)}`).join(" + ")} ={" "}
              <span className="font-semibold text-foreground">{fmt(allocated)}</span> of {fmt(outstandingBdt)}
            </span>
            {balanced ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                <CheckCircle2 className="h-3.5 w-3.5" /> Matches total
              </span>
            ) : remaining > 0 ? (
              <span className="text-xs font-medium text-warning">{fmt(remaining)} short</span>
            ) : (
              <span className="text-xs font-medium text-destructive">{fmt(-remaining)} over</span>
            )}
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-60"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? progressText : `Submit ${fmt(outstandingBdt)} for approval`}
      </button>
    </form>
  );
}
