"use client";

import { useState, useTransition } from "react";
import {
  createBankAccountAction,
  updateBankAccountAction,
  deleteBankAccountAction,
} from "@/server/actions/manual-payment.actions";
import { toast } from "@/components/ui/toast";
import { Building2, Star, Pencil, Trash2, Check, X, Plus, Loader2, ChevronDown, ChevronUp } from "lucide-react";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string | null;
  branchName: string | null;
  swiftCode: string | null;
  iban: string | null;
  mobileNumber: string | null;
  email: string | null;
  branchAddress: string | null;
  instructions: string | null;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  createdAt: Date;
};

type Props = { accounts: BankAccount[] };

const EMPTY = {
  bankName: "", accountName: "", accountNumber: "",
  routingNumber: "", branchName: "", swiftCode: "", iban: "",
  mobileNumber: "", email: "", branchAddress: "", instructions: "",
  isDefault: false, displayOrder: 0,
};

type FormState = typeof EMPTY;

export function BankAccountManager({ accounts: initial }: Props) {
  const [accounts, setAccounts] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function f(k: keyof FormState, v: string | boolean | number) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY, displayOrder: accounts.length });
    setFormOpen(true);
  }

  function openEdit(a: BankAccount) {
    setEditing(a);
    setForm({
      bankName: a.bankName, accountName: a.accountName, accountNumber: a.accountNumber,
      routingNumber: a.routingNumber ?? "", branchName: a.branchName ?? "",
      swiftCode: a.swiftCode ?? "", iban: a.iban ?? "",
      mobileNumber: a.mobileNumber ?? "", email: a.email ?? "",
      branchAddress: a.branchAddress ?? "", instructions: a.instructions ?? "",
      isDefault: a.isDefault, displayOrder: a.displayOrder,
    });
    setFormOpen(true);
  }

  function closeForm() { setFormOpen(false); setEditing(null); }

  function buildData() {
    return {
      bankName: form.bankName.trim(),
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
      routingNumber: form.routingNumber.trim() || undefined,
      branchName: form.branchName.trim() || undefined,
      swiftCode: form.swiftCode.trim() || undefined,
      iban: form.iban.trim() || undefined,
      mobileNumber: form.mobileNumber.trim() || undefined,
      email: form.email.trim() || undefined,
      branchAddress: form.branchAddress.trim() || undefined,
      instructions: form.instructions.trim() || undefined,
      isDefault: form.isDefault,
      displayOrder: Number(form.displayOrder) || 0,
    };
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data = buildData();
    startTransition(async () => {
      if (editing) {
        const result = await updateBankAccountAction(editing.id, data);
        if (result.success) {
          setAccounts((prev) => {
            const updated = prev.map((a) =>
              a.id === editing.id
                ? { ...a, ...data, routingNumber: data.routingNumber ?? null, branchName: data.branchName ?? null, swiftCode: data.swiftCode ?? null, iban: data.iban ?? null, mobileNumber: data.mobileNumber ?? null, email: data.email ?? null, branchAddress: data.branchAddress ?? null, instructions: data.instructions ?? null }
                : data.isDefault ? { ...a, isDefault: false } : a
            );
            return updated.sort((a, b) => a.displayOrder - b.displayOrder);
          });
          toast.add({ title: "Bank account updated", type: "success" });
          closeForm();
        } else {
          toast.add({ title: "Failed", description: result.error, type: "error" });
        }
      } else {
        const result = await createBankAccountAction(data);
        if (result.success) {
          toast.add({ title: "Bank account added", type: "success" });
          closeForm();
          window.location.reload();
        } else {
          toast.add({ title: "Failed", description: result.error, type: "error" });
        }
      }
    });
  }

  function handleToggleActive(id: string, current: boolean) {
    startTransition(async () => {
      const result = current
        ? await deleteBankAccountAction(id)
        : await updateBankAccountAction(id, { isActive: true });
      if (result.success) {
        setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, isActive: !current } : a));
        toast.add({ title: current ? "Deactivated" : "Reactivated", type: current ? "info" : "success" });
      } else {
        toast.add({ title: "Failed", description: result.error, type: "error" });
      }
    });
  }

  function handleSetDefault(id: string) {
    startTransition(async () => {
      const result = await updateBankAccountAction(id, { isDefault: true });
      if (result.success) {
        setAccounts((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
        toast.add({ title: "Default account set", type: "success" });
      } else {
        toast.add({ title: "Failed", description: result.error, type: "error" });
      }
    });
  }

  const inp = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add Bank Account
        </button>
      </div>

      <div className="space-y-3">
        {accounts.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No bank accounts yet. Add one so investors can make manual transfers.
          </p>
        )}

        {accounts.map((a) => {
          const isExpanded = expanded === a.id;
          return (
            <div key={a.id} className={`rounded-xl border bg-card transition-opacity ${a.isActive ? "border-border" : "border-border/40 opacity-60"}`}>
              {/* Header row */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">{a.bankName}</p>
                      {a.isDefault && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                          <Star className="h-2.5 w-2.5" /> Default
                        </span>
                      )}
                      {!a.isActive && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inactive</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.accountName} · ****{a.accountNumber.slice(-4)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {!a.isDefault && a.isActive && (
                    <button
                      onClick={() => handleSetDefault(a.id)}
                      disabled={isPending}
                      className="rounded border border-border px-2.5 py-1.5 text-xs hover:bg-muted/40 transition-colors"
                      title="Set as default"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(a)}
                    className="rounded border border-border p-1.5 hover:bg-muted/40 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(a.id, a.isActive)}
                    disabled={isPending}
                    className={`rounded border px-2.5 py-1.5 text-xs transition-colors ${
                      a.isActive
                        ? "border-destructive/30 text-destructive hover:bg-destructive/10"
                        : "border-success/30 text-success hover:bg-success/10"
                    }`}
                  >
                    {a.isActive ? "Deactivate" : "Reactivate"}
                  </button>
                  <button
                    onClick={() => setExpanded(isExpanded ? null : a.id)}
                    className="rounded border border-border p-1.5 hover:bg-muted/40 transition-colors"
                    title={isExpanded ? "Collapse" : "View details"}
                  >
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
                    {([
                      ["Account Name", a.accountName],
                      ["Account No.", a.accountNumber],
                      ["Bank Name", a.bankName],
                      a.branchName ? ["Branch", a.branchName] : null,
                      a.routingNumber ? ["Routing No.", a.routingNumber] : null,
                      a.swiftCode ? ["SWIFT Code", a.swiftCode] : null,
                      a.iban ? ["IBAN", a.iban] : null,
                      a.mobileNumber ? ["Mobile", a.mobileNumber] : null,
                      a.email ? ["Email", a.email] : null,
                      a.branchAddress ? ["Branch Address", a.branchAddress] : null,
                    ] as ([string, string] | null)[]).filter((x): x is [string, string] => x !== null).map(([label, value]) => (
                      <div key={label as string}>
                        <p className="text-muted-foreground">{label}</p>
                        <p className="font-medium mt-0.5 break-all">{value}</p>
                      </div>
                    ))}
                  </div>
                  {a.instructions && (
                    <div className="mt-3 rounded-lg bg-warning/10 border border-warning/20 px-3 py-2 text-xs text-warning-foreground">
                      <span className="font-semibold">Instructions: </span>{a.instructions}
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground">Display order: {a.displayOrder}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Create / Edit modal */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-10">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">{editing ? "Edit Bank Account" : "Add Bank Account"}</h2>
              <button onClick={closeForm} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                {/* Required fields */}
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Bank Name <span className="text-destructive">*</span></label>
                  <input value={form.bankName} onChange={(e) => f("bankName", e.target.value)} required className={inp} placeholder="e.g. Dutch-Bangla Bank Limited" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Account Name <span className="text-destructive">*</span></label>
                  <input value={form.accountName} onChange={(e) => f("accountName", e.target.value)} required className={inp} placeholder="e.g. Marinozz PLC" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Account Number <span className="text-destructive">*</span></label>
                  <input value={form.accountNumber} onChange={(e) => f("accountNumber", e.target.value)} required className={`${inp} font-mono`} placeholder="e.g. 1141100488564" />
                </div>

                {/* Optional fields */}
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Branch</label>
                  <input value={form.branchName} onChange={(e) => f("branchName", e.target.value)} className={inp} placeholder="e.g. Mohakhali" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Routing Number</label>
                  <input value={form.routingNumber} onChange={(e) => f("routingNumber", e.target.value)} className={`${inp} font-mono`} placeholder="e.g. 090263194" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">SWIFT Code</label>
                  <input value={form.swiftCode} onChange={(e) => f("swiftCode", e.target.value)} className={`${inp} font-mono`} placeholder="e.g. DBBLBDDH-114" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">IBAN</label>
                  <input value={form.iban} onChange={(e) => f("iban", e.target.value)} className={`${inp} font-mono`} placeholder="Optional" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Mobile Number</label>
                  <input value={form.mobileNumber} onChange={(e) => f("mobileNumber", e.target.value)} className={`${inp} font-mono`} placeholder="e.g. 01742161920" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                  <input type="email" value={form.email} onChange={(e) => f("email", e.target.value)} className={inp} placeholder="e.g. mfaltbd@gmail.com" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Branch Address</label>
                  <input value={form.branchAddress} onChange={(e) => f("branchAddress", e.target.value)} className={inp} placeholder="e.g. Medona Tower, 28, A.K. Khandaker Road..." />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Instructions for investors</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => f("instructions", e.target.value)}
                    rows={2}
                    placeholder='e.g. "Use your investment ID as the transfer reference"'
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Display Order</label>
                  <input type="number" min="0" value={form.displayOrder} onChange={(e) => f("displayOrder", Number(e.target.value))} className={inp} />
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={form.isDefault}
                    onChange={(e) => f("isDefault", e.target.checked)}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <label htmlFor="isDefault" className="text-xs font-medium text-muted-foreground cursor-pointer">
                    Set as default account
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm} className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/40">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
                >
                  {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {isPending ? "Saving…" : editing ? "Save Changes" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
