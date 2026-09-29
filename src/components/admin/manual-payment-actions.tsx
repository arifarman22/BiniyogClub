"use client";

import { useState } from "react";
import {
  approveManualPaymentAction,
  rejectManualPaymentAction,
  markUnderReviewAction,
} from "@/server/actions/manual-payment.actions";
import {
  approveGroupPaymentAction,
  rejectGroupPaymentAction,
} from "@/server/actions/group-investment.actions";

type Props = {
  submissionId: string;
  status: string;
  proofFileUrl: string;
  proofMimeType: string;
  notes?: string;
  rejectionReason?: string;
  isGroupPayment?: boolean;
};

export function ManualPaymentActions({
  submissionId,
  status,
  proofFileUrl,
  proofMimeType,
  notes,
  rejectionReason,
  isGroupPayment = false,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [proofOpen, setProofOpen] = useState(false);
  const [msg, setMsg] = useState("");

  const isTerminal = status === "APPROVED" || status === "REJECTED";

  async function handleApprove() {
    setLoading("approve");
    const result = isGroupPayment
      ? await approveGroupPaymentAction(submissionId)
      : await approveManualPaymentAction(submissionId);
    setLoading(null);
    if (result.success) {
      setMsg(`Approved — Receipt: ${result.data?.receiptNumber}`);
    } else {
      setMsg(`Error: ${result.error}`);
    }
  }

  async function handleMarkReview() {
    setLoading("review");
    const result = await markUnderReviewAction(submissionId);
    setLoading(null);
    if (!result.success) setMsg(`Error: ${result.error}`);
  }

  async function handleReject(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim()) return;
    setLoading("reject");
    const result = isGroupPayment
      ? await rejectGroupPaymentAction(submissionId, reason)
      : await rejectManualPaymentAction(submissionId, reason);
    setLoading(null);
    if (result.success) {
      setRejectOpen(false);
      setReason("");
    } else {
      setMsg(`Error: ${result.error}`);
    }
  }

  return (
    <>
      {msg && (
        <p className="mb-1 text-xs text-muted-foreground">{msg}</p>
      )}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setProofOpen(true)}
          className="rounded border border-border px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
        >
          View Proof
        </button>

        {!isTerminal && (
          <>
            {status === "SUBMITTED" && !isGroupPayment && (
              <button
                onClick={handleMarkReview}
                disabled={loading === "review"}
                className="rounded border border-border px-2 py-1 text-xs hover:bg-muted/40 disabled:opacity-50 transition-colors"
              >
                {loading === "review" ? "…" : "Mark Review"}
              </button>
            )}
            <button
              onClick={handleApprove}
              disabled={!!loading}
              className="rounded bg-success/10 border border-success/30 px-2 py-1 text-xs text-success hover:bg-success/20 disabled:opacity-50 transition-colors"
            >
              {loading === "approve" ? "…" : "Approve"}
            </button>
            <button
              onClick={() => setRejectOpen(true)}
              disabled={!!loading}
              className="rounded bg-destructive/10 border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/20 disabled:opacity-50 transition-colors"
            >
              Reject
            </button>
          </>
        )}

        {status === "REJECTED" && rejectionReason && (
          <span className="text-xs text-muted-foreground italic truncate max-w-[120px]" title={rejectionReason}>
            {rejectionReason}
          </span>
        )}
      </div>

      {rejectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card shadow-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold">Reject Submission</h3>
            <form onSubmit={handleReject} className="space-y-3">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for rejection (shown to investor)"
                rows={3}
                required
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-3">
                <button type="button" onClick={() => setRejectOpen(false)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40">
                  Cancel
                </button>
                <button type="submit" disabled={loading === "reject"}
                  className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/80 disabled:opacity-60">
                  {loading === "reject" ? "…" : "Reject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {proofOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setProofOpen(false)}>
          <div className="relative max-w-2xl w-full rounded-2xl overflow-hidden bg-card" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <span className="text-sm font-medium">Payment Proof</span>
              {notes && <span className="text-xs text-muted-foreground">Note: {notes}</span>}
              <button onClick={() => setProofOpen(false)} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
            </div>
            <div className="p-4 max-h-[70vh] overflow-auto">
              {proofMimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={proofFileUrl} alt="Payment proof" className="w-full rounded-lg" />
              ) : (
                <iframe src={proofFileUrl} className="w-full h-[60vh] rounded-lg border border-border" title="Payment proof PDF" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
