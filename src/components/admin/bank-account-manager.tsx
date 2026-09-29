"use client";

import { useState } from "react";
import {
  createBankAccountAction,
  updateBankAccountAction,
  deleteBankAccountAction,
} from "@/server/actions/manual-payment.actions";
import { toast } from "@/components/ui/toast";

type BankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string | null;
  branchName: string | null;
  instructions: string | null;
  isActive: boolean;
  createdAt: Date;
};

type Props = { accounts: BankAccount[] };

const EMPTY = { bankName: "", accountName: "", accountNumber: "", routingNumber: "", branchName: "", instructions: "" };

export function BankAccountManager({ accounts: initial }: Props) {
  const [accounts, setAccounts] = useState(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccount | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY);
    setFormOpen(true);
  }

  function openEdit(a: BankAccount) {
    setEditing(a);
    setForm({
      bankName: a.bankName,
      accountName: a.accountName,
      accountNumber: a.accountNumber,
      routingNumber: a.routingNumber ?? "",
      branchName: a.branchName ?? "",
      instructions: a.instructions ?? "",
    });
    setFormOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const data = {
      bankName: form.bankName.trim(),
      accountName: form.accountName.trim(),
      accountNumber: form.accountNumber.trim(),
      routingNumber: form.routingNumber.trim() || undefined,
      branchName: form.branchName.trim() || undefined,
      instructions: form.instructions.trim() || undefined,
    };

    if (editing) {
      const result = await updateBankAccountAction(editing.id, data);
      if (result.success) {
        setAccounts((prev) => prev.map((a) => a.id === editing.id ? { ...a, ...data, routingNumber: data.routingNumber ?? null, branchName: data.branchName ?? null, instructions: data.instructions ?? null } : a));
        toast.add({ title: "Bank account updated", type: "success" });
        setFormOpen(false);
      } else {
        toast.add({ title: "Failed", description: result.error, type: "error" });
      }
    } else {
      const result = await createBankAccountAction(data);
      if (result.success) {
        toast.add({ title: "Bank account added", type: "success" });
        setFormOpen(false);
        // Reload to get the new record with id/createdAt
        window.location.reload();
      } else {
        toast.add({ title: "Failed", description: result.error, type: "error" });
      }
    }
    setLoading(false);
  }

  async function handleDeactivate(id: string) {
    const result = await deleteBankAccountAction(id);
    if (result.success) {
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, isActive: false } : a));
      toast.add({ title: "Bank account deactivated", type: "info" });
    } else {
      toast.add({ title: "Failed", description: result.error, type: "error" });
    }
  }

  async function handleReactivate(id: string) {
    const result = await updateBankAccountAction(id, { isActive: true });
    if (result.success) {
      setAccounts((prev) => prev.map((a) => a.id === id ? { ...a, isActive: true } : a));
      toast.add({ title: "Bank account reactivated", type: "success" });
    } else {
      toast.add({ title: "Failed", description: result.error, type: "error" });
    }
  }

  return (
    <>
      <div className="flex justify-end">
        <button
          onClick={openCreate}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
        >
          + Add Bank Account
        </button>
      </div>

      <div className="space-y-3">
        {accounts.length === 0 && (
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            No bank accounts yet. Add one so investors can make manual transfers.
          </p>
        )}
        {accounts.map((a) => (
          <div key={a.id} className={`rounded-xl border bg-card p-4 ${a.isActive ? "border-border" : "border-border/40 opacity-60"}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{a.bankName}</p>
                  {!a.isActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{a.accountName} · {a.accountNumber}</p>
                {a.routingNumber && <p className="text-xs text-muted-foreground">Routing: {a.routingNumber}</p>}
                {a.branchName && <p className="text-xs text-muted-foreground">Branch: {a.branchName}</p>}
                {a.instructions && (
                  <p className="mt-1 rounded bg-warning/10 px-3 py-1.5 text-xs text-warning-foreground border border-warning/20">
                    {a.instructions}
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => openEdit(a)}
                  className="rounded border border-border px-3 py-1.5 text-xs hover:bg-muted/40 transition-colors"
                >
                  Edit
                </button>
                {a.isActive ? (
                  <button
                    onClick={() => handleDeactivate(a.id)}
                    className="rounded border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => handleReactivate(a.id)}
                    className="rounded border border-success/30 px-3 py-1.5 text-xs text-success hover:bg-success/10 transition-colors"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit dialog */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-semibold">{editing ? "Edit Bank Account" : "Add Bank Account"}</h2>
              <button onClick={() => setFormOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3 p-5">
              {(["bankName", "accountName", "accountNumber", "routingNumber", "branchName"] as const).map((field) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground capitalize">
                    {field.replace(/([A-Z])/g, " $1")}
                    {["bankName", "accountName", "accountNumber"].includes(field) && <span className="text-destructive"> *</span>}
                  </label>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                    required={["bankName", "accountName", "accountNumber"].includes(field)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              ))}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Instructions for investors</label>
                <textarea
                  value={form.instructions}
                  onChange={(e) => setForm((f) => ({ ...f, instructions: e.target.value }))}
                  rows={2}
                  placeholder='e.g. "Use your investment ID as the transfer reference"'
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="flex-1 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
                >
                  {loading ? "Saving…" : editing ? "Save Changes" : "Add Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
