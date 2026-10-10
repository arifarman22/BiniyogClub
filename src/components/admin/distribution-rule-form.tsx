"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertDistributionRuleAction } from "@/server/actions/distribution.actions";

export function DistributionRuleForm({
  projectId,
  existing,
}: {
  projectId: string;
  existing?: { investorSharePct: number; platformFeePct: number; notes?: string | null } | null;
}) {
  const router = useRouter();
  const [investorSharePct, setInvestorSharePct] = useState(
    existing ? String(Number(existing.investorSharePct)) : "80",
  );
  const [platformFeePct, setPlatformFeePct] = useState(
    existing ? String(Number(existing.platformFeePct)) : "2.5",
  );
  const [notes, setNotes] = useState(existing?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await upsertDistributionRuleAction(projectId, {
      investorSharePct: Number(investorSharePct),
      platformFeePct: Number(platformFeePct),
      notes: notes || undefined,
    });
    setLoading(false);
    if (!res.success) { setError(res.error ?? "Failed to save rule"); return; }
    setSaved(true);
    router.refresh();
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-lg bg-success/10 border border-success/20 px-3 py-2 text-xs text-success">
          Rule saved successfully.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Investor Share % <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            value={investorSharePct}
            onChange={(e) => setInvestorSharePct(e.target.value)}
            min="0.01" max="100" step="0.01" required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-0.5 text-[10px] text-muted-foreground">% of net revenue allocated to investors</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Platform Fee % <span className="text-destructive">*</span>
          </label>
          <input
            type="number"
            value={platformFeePct}
            onChange={(e) => setPlatformFeePct(e.target.value)}
            min="0" max="99.99" step="0.01" required
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-0.5 text-[10px] text-muted-foreground">% deducted from each investor&apos;s gross payout</p>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted-foreground">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
      >
        {loading ? "Saving…" : existing ? "Update Rule" : "Save Rule"}
      </button>
    </form>
  );
}
