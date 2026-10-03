"use client";

import { useState } from "react";
import { Copy, Check, Building2 } from "lucide-react";

type BankAccount = {
  id: string;
  accountName: string;
  accountNumber: string;
  bankName: string;
  branchName: string | null;
  routingNumber: string | null;
  swiftCode: string | null;
  mobileNumber: string | null;
  email: string | null;
  branchAddress: string | null;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 flex h-7 w-7 items-center justify-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
        aria-label={`Copy ${label}`}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </div>
  );
}

export function ProjectBankDetails({ bankAccounts }: { bankAccounts: BankAccount[] }) {
  const [active, setActive] = useState(0);

  if (bankAccounts.length === 0) return null;

  const acc = bankAccounts[active];

  const fields: { label: string; value: string }[] = [
    { label: "Bank Name",      value: acc.bankName },
    { label: "Account Name",   value: acc.accountName },
    { label: "Account Number", value: acc.accountNumber },
    ...(acc.branchName    ? [{ label: "Branch Name",    value: acc.branchName }]    : []),
    ...(acc.routingNumber ? [{ label: "Routing Number", value: acc.routingNumber }] : []),
    ...(acc.swiftCode     ? [{ label: "SWIFT Code",     value: acc.swiftCode }]     : []),
    ...(acc.mobileNumber  ? [{ label: "Mobile Number",  value: acc.mobileNumber }]  : []),
    ...(acc.email         ? [{ label: "Email",          value: acc.email }]         : []),
    ...(acc.branchAddress ? [{ label: "Branch Address", value: acc.branchAddress }] : []),
  ];

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-5 py-3">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <p className="text-sm font-semibold">Payment Bank Details</p>
      </div>

      {/* Tab selector if multiple accounts */}
      {bankAccounts.length > 1 && (
        <div className="flex gap-1 border-b border-border px-4 pt-2">
          {bankAccounts.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setActive(i)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t-lg border-b-2 transition-colors ${
                i === active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {a.bankName}
            </button>
          ))}
        </div>
      )}

      <div className="p-4 space-y-2">
        {fields.map(({ label, value }) => (
          <CopyField key={label} label={label} value={value} />
        ))}
        <p className="text-[10px] text-muted-foreground pt-1 text-center">
          Click the copy icon to copy any field. Use these details to make your bank transfer.
        </p>
      </div>
    </div>
  );
}
