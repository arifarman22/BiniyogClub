"use client";

import { useState } from "react";
import { cancelGroupInvestmentAction } from "@/server/actions/group-investment.actions";

export function CancelGroupInvestmentButton({ groupInvestmentId }: { groupInvestmentId: string }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this investment?")) return;
    setLoading(true);
    const result = await cancelGroupInvestmentAction(groupInvestmentId);
    setLoading(false);
    if (result.success) setDone(true);
  }

  if (done) return <span className="text-xs text-muted-foreground">Cancelled</span>;

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
    >
      {loading ? "Cancelling…" : "Cancel Investment"}
    </button>
  );
}
