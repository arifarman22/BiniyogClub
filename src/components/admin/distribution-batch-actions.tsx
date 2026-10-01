"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  submitDistributionAction,
  approveDistributionAction,
  rejectDistributionAction,
  postDistributionAction,
  voidDistributionAction,
} from "@/server/actions/distribution.actions";

type Status = "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "POSTED" | "VOIDED";

export function DistributionBatchActions({
  batchId,
  status,
  submittedBy,
  currentUserId,
}: {
  batchId: string;
  status: Status;
  submittedBy: string | null;
  currentUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reasonInput, setReasonInput] = useState("");
  const [showReasonFor, setShowReasonFor] = useState<"reject" | "void" | null>(null);

  async function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setLoading(true);
    setError("");
    const res = await action();
    setLoading(false);
    if (!res.success) { setError(res.error ?? "Action failed"); return; }
    router.refresh();
  }

  const isSelfSubmitted = submittedBy === currentUserId;

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      )}

      {status === "DRAFT" && (
        <button
          onClick={() => run(() => submitDistributionAction(batchId))}
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60"
        >
          {loading ? "Submitting…" : "Submit for Approval"}
        </button>
      )}

      {status === "PENDING_APPROVAL" && !isSelfSubmitted && (
        <>
          <button
            onClick={() => run(() => approveDistributionAction(batchId))}
            disabled={loading}
            className="w-full rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-success/80 disabled:opacity-60"
          >
            {loading ? "Approving…" : "Approve"}
          </button>
          <button
            onClick={() => setShowReasonFor("reject")}
            disabled={loading}
            className="w-full rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
          >
            Reject
          </button>
        </>
      )}

      {status === "PENDING_APPROVAL" && isSelfSubmitted && (
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground text-center">
          Awaiting approval from another staff member
        </p>
      )}

      {status === "APPROVED" && (
        <button
          onClick={() => run(() => postDistributionAction(batchId))}
          disabled={loading}
          className="w-full rounded-lg bg-finance-600 px-4 py-2 text-sm font-medium text-white hover:bg-finance-700 disabled:opacity-60"
        >
          {loading ? "Posting…" : "Post to Ledger"}
        </button>
      )}

      {status === "POSTED" && (
        <button
          onClick={() => setShowReasonFor("void")}
          disabled={loading}
          className="w-full rounded-lg border border-destructive/40 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-60"
        >
          Void Batch
        </button>
      )}

      {showReasonFor && (
        <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-xs font-medium">
            {showReasonFor === "reject" ? "Rejection reason" : "Void reason"}{" "}
            <span className="text-destructive">*</span>
          </p>
          <textarea
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { setShowReasonFor(null); setReasonInput(""); }}
              className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs hover:bg-muted/40"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (!reasonInput.trim()) { setError("Reason is required"); return; }
                if (showReasonFor === "reject") run(() => rejectDistributionAction(batchId, reasonInput));
                else run(() => voidDistributionAction(batchId, reasonInput));
                setShowReasonFor(null);
                setReasonInput("");
              }}
              disabled={loading}
              className="flex-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-white hover:bg-destructive/80 disabled:opacity-60"
            >
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
