"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { upsertProjectBankAccountAction, deleteProjectBankAccountAction } from "@/server/actions/project-bank.actions";
import { Plus, Pencil, Trash2, Loader2, Building2, X, Check } from "lucide-react";

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
  isActive: boolean;
};

type Props = {
  projectId: string;
  bankAccounts: BankAccount[];
};

const EMPTY = {
  accountName: "", accountNumber: "", bankName: "",
  branchName: "", routingNumber: "", swiftCode: "",
  mobileNumber: "", email: "", branchAddress: "",
};

export function ProjectBankAccountManager({ projectId, bankAccounts: initial }: Props) {
  const [accounts, setAccounts] = useState<BankAccount[]>(initial);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setForm(EMPTY);
    setEditing("new");
    setError(null);
    setFieldErrors({});
  }

  function openEdit(acc: BankAccount) {
    setForm({
      accountName:   acc.accountName,
      accountNumber: acc.accountNumber,
      bankName:      acc.bankName,
      branchName:    acc.branchName ?? "",
      routingNumber: acc.routingNumber ?? "",
      swiftCode:     acc.swiftCode ?? "",
      mobileNumber:  acc.mobileNumber ?? "",
      email:         acc.email ?? "",
      branchAddress: acc.branchAddress ?? "",
    });
    setEditing(acc.id);
    setError(null);
    setFieldErrors({});
  }

  function cancel() {
    setEditing(null);
    setError(null);
    setFieldErrors({});
  }

  function set(k: keyof typeof EMPTY, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function handleSave() {
    startTransition(async () => {
      const result = await upsertProjectBankAccountAction(
        projectId,
        editing === "new" ? null : editing,
        form,
      );
      if (!result.success) {
        setError(result.error ?? "Failed to save");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      // Optimistic update
      if (editing === "new") {
        setAccounts((prev) => [...prev, { id: result.data.id, ...form, isActive: true,
          branchName: form.branchName || null, routingNumber: form.routingNumber || null,
          swiftCode: form.swiftCode || null, mobileNumber: form.mobileNumber || null,
          email: form.email || null, branchAddress: form.branchAddress || null,
        }]);
      } else {
        setAccounts((prev) => prev.map((a) => a.id === editing ? {
          ...a, ...form,
          branchName: form.branchName || null, routingNumber: form.routingNumber || null,
          swiftCode: form.swiftCode || null, mobileNumber: form.mobileNumber || null,
          email: form.email || null, branchAddress: form.branchAddress || null,
        } : a));
      }
      setEditing(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this bank account?")) return;
    startTransition(async () => {
      const result = await deleteProjectBankAccountAction(projectId, id);
      if (!result.success) { setError(result.error ?? "Failed to delete"); return; }
      setAccounts((prev) => prev.filter((a) => a.id !== id));
    });
  }

  const inp = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="space-y-4">
      {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

      {/* Existing accounts */}
      {accounts.map((acc) => (
        <div key={acc.id} className="rounded-xl border border-border bg-muted/20 p-4">
          {editing === acc.id ? (
            <BankForm form={form} set={set} fieldErrors={fieldErrors} inp={inp}
              onSave={handleSave} onCancel={cancel} isPending={isPending} />
          ) : (
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <p className="font-semibold text-sm">{acc.bankName}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground mt-2">
                  <span>Account Name</span><span className="text-foreground font-medium">{acc.accountName}</span>
                  <span>Account No.</span><span className="text-foreground font-mono">{acc.accountNumber}</span>
                  {acc.branchName && <><span>Branch</span><span className="text-foreground">{acc.branchName}</span></>}
                  {acc.routingNumber && <><span>Routing</span><span className="text-foreground font-mono">{acc.routingNumber}</span></>}
                  {acc.swiftCode && <><span>SWIFT</span><span className="text-foreground font-mono">{acc.swiftCode}</span></>}
                  {acc.mobileNumber && <><span>Mobile</span><span className="text-foreground font-mono">{acc.mobileNumber}</span></>}
                  {acc.email && <><span>Email</span><span className="text-foreground">{acc.email}</span></>}
                  {acc.branchAddress && <><span>Address</span><span className="text-foreground">{acc.branchAddress}</span></>}
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="ghost" onClick={() => openEdit(acc)} className="h-7 w-7 p-0">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(acc.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* New account form */}
      {editing === "new" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">New Bank Account</p>
          <BankForm form={form} set={set} fieldErrors={fieldErrors} inp={inp}
            onSave={handleSave} onCancel={cancel} isPending={isPending} />
        </div>
      )}

      {editing === null && (
        <Button type="button" variant="outline" size="sm" onClick={openNew} className="w-full">
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Bank Account
        </Button>
      )}
    </div>
  );
}

function BankForm({ form, set, fieldErrors, inp, onSave, onCancel, isPending }: {
  form: Record<string, string>;
  set: (k: keyof typeof EMPTY, v: string) => void;
  fieldErrors: Record<string, string>;
  inp: string;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const field = (name: keyof typeof EMPTY, label: string, required = false, mono = false) => (
    <div>
      <Label htmlFor={`bank-${name}`}>{label}{required && " *"}</Label>
      <input
        id={`bank-${name}`}
        value={form[name] ?? ""}
        onChange={(e) => set(name, e.target.value)}
        className={`${inp}${mono ? " font-mono" : ""}`}
      />
      {fieldErrors[name] && <p className="mt-0.5 text-xs text-destructive">{fieldErrors[name]}</p>}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {field("bankName", "Bank Name", true)}
        {field("accountName", "Account Name", true)}
        {field("accountNumber", "Account Number", true, true)}
        {field("branchName", "Branch Name")}
        {field("routingNumber", "Routing Number", false, true)}
        {field("swiftCode", "SWIFT Code", false, true)}
        {field("mobileNumber", "Mobile Number", false, true)}
        {field("email", "Email")}
      </div>
      {field("branchAddress", "Branch Address")}
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          <X className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}
