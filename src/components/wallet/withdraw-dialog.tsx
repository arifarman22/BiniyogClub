"use client";

import { useState, useTransition } from "react";
import { requestWithdrawalAction } from "@/server/actions/wallet.actions";
import { Loader2, ArrowRight, CheckCircle2, Building2, Smartphone } from "lucide-react";

type Method = "BANK_TRANSFER" | "MOBILE_BANKING";
type Step = "amount" | "method" | "confirm" | "done";

const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay"];

function fmtBdt(n: number) {
  return `৳${n.toLocaleString("en-BD")}`;
}

export function WithdrawDialog({ availableBalance }: { availableBalance: number }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("amount");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Method>("BANK_TRANSFER");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [mobileProvider, setMobileProvider] = useState(MOBILE_PROVIDERS[0]);
  const [mobileNumber, setMobileNumber] = useState("");

  function reset() {
    setStep("amount"); setAmount(""); setMethod("BANK_TRANSFER");
    setBankName(""); setAccountNumber(""); setAccountName("");
    setMobileProvider(MOBILE_PROVIDERS[0]); setMobileNumber(""); setError("");
  }

  function close() { setOpen(false); setTimeout(reset, 300); }

  function validateAmount() {
    const n = Number(amount);
    if (!amount || isNaN(n) || n <= 0) return "Enter a valid amount";
    if (n > availableBalance) return `Insufficient balance. Available: ${fmtBdt(availableBalance)}`;
    if (n < 100) return "Minimum withdrawal is ৳100";
    return "";
  }

  function validateMethod() {
    if (method === "BANK_TRANSFER") {
      if (!bankName.trim()) return "Bank name is required";
      if (!accountNumber.trim()) return "Account number is required";
      if (!accountName.trim()) return "Account name is required";
    }
    if (method === "MOBILE_BANKING") {
      if (!mobileNumber.trim()) return "Mobile number is required";
      if (!/^01[3-9]\d{8}$/.test(mobileNumber.trim())) return "Enter a valid Bangladeshi mobile number";
    }
    return "";
  }

  function handleAmountNext() {
    const err = validateAmount();
    if (err) { setError(err); return; }
    setError(""); setStep("method");
  }

  function handleMethodNext() {
    const err = validateMethod();
    if (err) { setError(err); return; }
    setError(""); setStep("confirm");
  }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      const result = await requestWithdrawalAction({
        amountBdt: Number(amount),
        method,
        ...(method === "BANK_TRANSFER" && {
          bankName: bankName.trim(),
          accountNumber: accountNumber.trim(),
          accountName: accountName.trim(),
        }),
        ...(method === "MOBILE_BANKING" && { mobileNumber: mobileNumber.trim() }),
      });
      if (result.success) {
        setStep("done");
      } else {
        setError(result.error ?? "Failed to submit withdrawal");
        setStep("confirm");
      }
    });
  }

  const amountNum = Number(amount) || 0;
  const stepNum = step === "amount" ? 1 : step === "method" ? 2 : step === "confirm" ? 3 : 3;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        disabled={availableBalance < 100}
        className="rounded-lg bg-white/15 border border-white/30 px-4 py-2 text-sm font-medium text-white hover:bg-white/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Withdraw
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl">

        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">Withdraw Funds</h2>
            {step !== "done" && (
              <p className="text-xs text-muted-foreground mt-0.5">Step {stepNum} of 3</p>
            )}
          </div>
          <button onClick={close} className="text-muted-foreground hover:text-foreground text-xl leading-none">×</button>
        </div>

        {step !== "done" && (
          <div className="h-1 bg-muted">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(stepNum / 3) * 100}%` }} />
          </div>
        )}

        <div className="p-5 space-y-4">

          {step === "amount" && (
            <>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Available balance</p>
                <p className="text-2xl font-bold text-primary">{fmtBdt(availableBalance)}</p>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Amount (BDT) <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                  <input
                    type="number" value={amount} autoFocus
                    onChange={(e) => { setAmount(e.target.value); setError(""); }}
                    placeholder="0.00" min={100} max={availableBalance}
                    className="w-full rounded-lg border border-border bg-background pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="mt-2 flex gap-2">
                  {[25, 50, 75].map((pct) => (
                    <button key={pct} type="button"
                      onClick={() => setAmount(Math.floor(availableBalance * pct / 100).toString())}
                      className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted/40 transition-colors"
                    >
                      {pct}%
                    </button>
                  ))}
                  <button type="button"
                    onClick={() => setAmount(availableBalance.toString())}
                    className="rounded-md border border-border px-2.5 py-1 text-xs hover:bg-muted/40 transition-colors"
                  >
                    Max
                  </button>
                </div>
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button onClick={handleAmountNext}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </>
          )}

          {step === "method" && (
            <>
              <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
                Withdrawing <span className="font-semibold text-primary">{fmtBdt(amountNum)}</span>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Withdrawal method</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { value: "BANK_TRANSFER" as const, label: "Bank Transfer", Icon: Building2 },
                    { value: "MOBILE_BANKING" as const, label: "Mobile Banking", Icon: Smartphone },
                  ]).map(({ value, label, Icon }) => (
                    <button key={value} type="button" onClick={() => { setMethod(value); setError(""); }}
                      className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-xs font-medium transition-colors ${method === value ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                    >
                      <Icon className="h-5 w-5" />{label}
                    </button>
                  ))}
                </div>
              </div>

              {method === "BANK_TRANSFER" && (
                <div className="space-y-3">
                  {([
                    { label: "Bank name", val: bankName, set: setBankName, ph: "e.g. Dutch-Bangla Bank" },
                    { label: "Account number", val: accountNumber, set: setAccountNumber, ph: "Account number" },
                    { label: "Account name", val: accountName, set: setAccountName, ph: "Name on account" },
                  ]).map(({ label, val, set, ph }) => (
                    <div key={label}>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label} <span className="text-destructive">*</span></label>
                      <input type="text" value={val} placeholder={ph}
                        onChange={(e) => { set(e.target.value); setError(""); }}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  ))}
                </div>
              )}

              {method === "MOBILE_BANKING" && (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Provider</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {MOBILE_PROVIDERS.map((p) => (
                        <button key={p} type="button" onClick={() => setMobileProvider(p)}
                          className={`rounded-lg border py-1.5 text-xs font-medium transition-colors ${mobileProvider === p ? "border-primary bg-primary/5 text-primary" : "border-border hover:border-primary/40"}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">Mobile number <span className="text-destructive">*</span></label>
                    <input type="tel" value={mobileNumber} placeholder="01XXXXXXXXX"
                      onChange={(e) => { setMobileNumber(e.target.value); setError(""); }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
              )}

              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setStep("amount"); setError(""); }}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                >Back</button>
                <button onClick={handleMethodNext}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
                >
                  Review <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}

          {step === "confirm" && (
            <>
              <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border text-sm">
                {[
                  ["Amount", <span key="a" className="font-semibold text-primary">{fmtBdt(amountNum)}</span>],
                  ["Method", method === "BANK_TRANSFER" ? "Bank Transfer" : "Mobile Banking"],
                  ...(method === "BANK_TRANSFER" ? [
                    ["Bank", bankName],
                    ["Account No.", accountNumber],
                    ["Account Name", accountName],
                  ] : [
                    ["Provider", mobileProvider],
                    ["Number", mobileNumber],
                  ]),
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between px-4 py-3">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium text-right">{value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Funds are reserved immediately. Transfer completes within 1–2 business days after finance team approval.
              </p>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button onClick={() => { setStep("method"); setError(""); }} disabled={isPending}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 disabled:opacity-50 transition-colors"
                >Back</button>
                <button onClick={handleSubmit} disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60 transition-colors"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isPending ? "Submitting…" : "Confirm Withdrawal"}
                </button>
              </div>
            </>
          )}

          {step === "done" && (
            <div className="py-6 text-center space-y-3">
              <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
              <div>
                <p className="font-semibold">Withdrawal Requested</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {fmtBdt(amountNum)} reserved. Finance team will process within 1–2 business days.
                </p>
              </div>
              <button onClick={close}
                className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                Done
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
