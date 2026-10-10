"use client";

export const dynamic = "force-dynamic";

import { useEffect, useRef, useState, useTransition } from "react";
import { Plus, Pencil, Trash2, Check, X, Building2 } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  getGlobalBankAccountsAction,
  upsertGlobalBankAccountAction,
  deleteGlobalBankAccountAction,
  type GlobalBankAccount,
} from "@/server/actions/project-bank.actions";

const EMPTY = { bankName: "", branchName: "", accountName: "", accountNumber: "" };

function BankForm({
  form, setField, fieldErrors, onSave, onCancel, isPending,
}: {
  form: typeof EMPTY;
  setField: (k: keyof typeof EMPTY, v: string) => void;
  fieldErrors: Record<string, string>;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const inp = "mt-1 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10";
  const f = (name: keyof typeof EMPTY, label: string, required = false) => (
    <div>
      <Label htmlFor={`gbf-${name}`}>{label}{required && " *"}</Label>
      <input id={`gbf-${name}`} value={form[name]} onChange={(e) => setField(name, e.target.value)} className={inp} />
      {fieldErrors[name] && <p className="mt-0.5 text-xs text-destructive">{fieldErrors[name]}</p>}
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {f("bankName", "Bank Name", true)}
        {f("branchName", "Branch Name")}
        {f("accountName", "Account Holder Name", true)}
        {f("accountNumber", "Account Number", true)}
      </div>
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={isPending}>
          <Check className="h-3.5 w-3.5 mr-1" /> Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          <X className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}

export default function BankAccountsPage() {
  const [accounts, setAccounts] = useState<GlobalBankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    getGlobalBankAccountsAction().then((r) => {
      if (r.success) setAccounts(r.data);
      setLoading(false);
    });
  }, []);

  function setField(k: keyof typeof EMPTY, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function handleSave(id: string | null) {
    startTransition(async () => {
      const r = await upsertGlobalBankAccountAction(id, form);
      if (!r.success) {
        setError(r.error);
        if ("fieldErrors" in r && r.fieldErrors) setFieldErrors(r.fieldErrors as Record<string, string>);
        return;
      }
      const updated = await getGlobalBankAccountsAction();
      if (updated.success) setAccounts(updated.data);
      setEditing(null);
      setError(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this bank account from the platform list?")) return;
    startTransition(async () => {
      const r = await deleteGlobalBankAccountAction(id);
      if (!r.success) { setError(r.error); return; }
      setAccounts((a) => a.filter((x) => x.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Platform Bank Accounts</h1>
          <p className="text-sm text-muted-foreground">These accounts appear as a quick-add dropdown when creating or editing projects.</p>
        </div>
        <Button size="sm" onClick={() => { setForm(EMPTY); setEditing("new"); setError(null); setFieldErrors({}); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Account
        </Button>
      </div>

      {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

      {/* New account form */}
      {editing === "new" && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">New Bank Account</p>
          <BankForm form={form} setField={setField} fieldErrors={fieldErrors}
            onSave={() => handleSave(null)} onCancel={() => setEditing(null)} isPending={pending} />
        </div>
      )}

      {loading ? (
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-muted" />)}
        </div>
      ) : (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr className="text-xs text-muted-foreground">
                <th className="px-4 py-3 text-left font-medium w-8">#</th>
                <th className="px-4 py-3 text-left font-medium">Bank</th>
                <th className="px-4 py-3 text-left font-medium hidden sm:table-cell">Branch</th>
                <th className="px-4 py-3 text-left font-medium">Account Holder</th>
                <th className="px-4 py-3 text-left font-medium hidden md:table-cell">Account No.</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {accounts.map((acc, i) => (
                <tr key={acc.id} className="hover:bg-primary/[0.03] transition-colors">
                  {editing === acc.id ? (
                    <td colSpan={6} className="px-4 py-4">
                      <BankForm form={form} setField={setField} fieldErrors={fieldErrors}
                        onSave={() => handleSave(acc.id)} onCancel={() => setEditing(null)} isPending={pending} />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="font-medium text-xs">{acc.bankName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">{acc.branchName ?? "—"}</td>
                      <td className="px-4 py-3 text-xs">{acc.accountName}</td>
                      <td className="px-4 py-3 font-mono text-xs hidden md:table-cell">{acc.accountNumber}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" type="button" className="h-7 w-7 p-0"
                            onClick={() => { setForm({ bankName: acc.bankName, branchName: acc.branchName ?? "", accountName: acc.accountName, accountNumber: acc.accountNumber }); setEditing(acc.id); setError(null); setFieldErrors({}); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" type="button" className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDelete(acc.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {accounts.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-10">No bank accounts yet.</p>
          )}
        </div>
      )}
    </div>
  );
}
