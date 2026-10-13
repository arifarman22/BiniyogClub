"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

export const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10";

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  wide,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className={`surface-card flex max-h-[90vh] w-full flex-col whitespace-normal text-left font-normal shadow-xl ${wide ? "max-w-2xl" : "max-w-lg"}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
        {hint && <span className="ml-1 font-normal normal-case">({hint})</span>}
      </label>
      {children}
    </div>
  );
}

export function ActiveToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!value)} className="flex items-center gap-3 select-none">
      <span className={`relative h-5 w-9 rounded-full transition-colors ${value ? "bg-success" : "bg-muted-foreground/30"}`}>
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${value ? "translate-x-4" : "translate-x-0.5"}`}
        />
      </span>
      <span className="text-sm">{value ? "Active — visible on the website" : "Inactive — hidden from the website"}</span>
    </button>
  );
}

export function FormFooter({ error, loading, submitLabel, onCancel }: {
  error: string;
  loading: boolean;
  submitLabel: string;
  onCancel: () => void;
}) {
  return (
    <>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-3 pt-1">
        <button type="button" onClick={onCancel}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80 disabled:opacity-60">
          {loading ? "Saving…" : submitLabel}
        </button>
      </div>
    </>
  );
}

/** Parse an optional numeric input: "" → null. */
export function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
