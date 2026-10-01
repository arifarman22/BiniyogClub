"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { calculateDistributionAction } from "@/server/actions/distribution.actions";

type Project = {
  id: string;
  title: string;
  status: string;
  distributionRule: { investorSharePct: number; platformFeePct: number } | null;
  _count: { investments: number };
};

export function CalculateDistributionForm({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? "");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedProject = projects.find((p) => p.id === projectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!selectedProject?.distributionRule) {
      setError("This project has no distribution rule configured. Set one first.");
      return;
    }
    setLoading(true);
    const res = await calculateDistributionAction({
      projectId,
      totalRevenueBdt: Number(revenue),
      totalExpensesBdt: Number(expenses),
      notes: notes || undefined,
    });
    setLoading(false);
    if (!res.success) { setError(res.error ?? "Calculation failed"); return; }
    router.push(`/admin/distributions/${res.data!.batchId}`);
  }

  const net = revenue && expenses ? Math.max(0, Number(revenue) - Number(expenses)) : null;
  const rule = selectedProject?.distributionRule;
  const pool = net !== null && rule ? (net * Number(rule.investorSharePct)) / 100 : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">
          Project <span className="text-destructive">*</span>
        </label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title} ({p._count.investments} active investors)
            </option>
          ))}
        </select>
        {selectedProject && !selectedProject.distributionRule && (
          <p className="mt-1 text-xs text-warning">⚠ No distribution rule configured for this project.</p>
        )}
        {rule && (
          <p className="mt-1 text-xs text-muted-foreground">
            Rule: {Number(rule.investorSharePct)}% investor share · {Number(rule.platformFeePct)}% platform fee
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Total Revenue (BDT) <span className="text-destructive">*</span>
          </label>
          <input
            type="number" value={revenue} onChange={(e) => setRevenue(e.target.value)}
            min="0.01" step="0.01" required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Eligible Expenses (BDT) <span className="text-destructive">*</span>
          </label>
          <input
            type="number" value={expenses} onChange={(e) => setExpenses(e.target.value)}
            min="0" step="0.01" required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {net !== null && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Net Revenue</span>
            <span className="font-medium">৳{net.toLocaleString("en-BD")}</span>
          </div>
          {pool !== null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Investor Pool ({Number(rule!.investorSharePct)}%)</span>
              <span className="font-semibold text-success">৳{pool.toLocaleString("en-BD")}</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
        <textarea
          value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <button
        type="submit" disabled={loading || !selectedProject?.distributionRule}
        className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
      >
        {loading ? "Calculating…" : "Calculate & Preview"}
      </button>
    </form>
  );
}
