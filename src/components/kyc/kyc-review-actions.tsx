"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert } from "@/components/ui/alert";
import {
  startKycReviewAction,
  verifyKycAction,
  rejectKycAction,
  requestResubmissionAction,
} from "@/server/actions/kyc.actions";
import { CheckCircle2, XCircle, RefreshCw, Eye, Loader2 } from "lucide-react";

interface Props {
  kycId: string;
  currentStatus: string;
}

type ActionType = "verify" | "reject" | "resubmit" | null;

export function KycReviewActions({ kycId, currentStatus }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<ActionType>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleStartReview() {
    setError(null);
    startTransition(async () => {
      const result = await startKycReviewAction(kycId);
      if (!result.success) setError(result.error);
      else router.refresh();
    });
  }

  async function handleConfirm() {
    setError(null);

    startTransition(async () => {
      let result;

      if (activeAction === "verify") {
        result = await verifyKycAction({ kycId });
      } else if (activeAction === "reject") {
        result = await rejectKycAction({ kycId, reviewNote });
      } else if (activeAction === "resubmit") {
        result = await requestResubmissionAction({ kycId, reviewNote });
      } else {
        return;
      }

      if (!result.success) {
        setError(result.error);
      } else {
        setActiveAction(null);
        setReviewNote("");
        router.refresh();
      }
    });
  }

  const needsNote = activeAction === "reject" || activeAction === "resubmit";
  const canConfirm = activeAction === "verify" || (needsNote && reviewNote.trim().length >= 10);

  return (
    <div className="surface-card p-6 space-y-4">
      <h2 className="font-semibold">Review Actions</h2>

      {error && (
        <Alert variant="destructive">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {/* Start review button (SUBMITTED → UNDER_REVIEW) */}
      {currentStatus === "SUBMITTED" && !activeAction && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleStartReview}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Eye className="mr-1.5 h-4 w-4" />
            )}
            Start Review
          </Button>
          <p className="text-xs text-muted-foreground">
            Marks this KYC as under review and assigns it to you.
          </p>
        </div>
      )}

      {/* Action buttons */}
      {!activeAction && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setActiveAction("verify")}
            disabled={isPending}
          >
            <CheckCircle2 className="mr-1.5 h-4 w-4" />
            Verify
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActiveAction("resubmit")}
            disabled={isPending}
          >
            <RefreshCw className="mr-1.5 h-4 w-4" />
            Request Resubmission
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setActiveAction("reject")}
            disabled={isPending}
          >
            <XCircle className="mr-1.5 h-4 w-4" />
            Reject
          </Button>
        </div>
      )}

      {/* Confirmation panel */}
      {activeAction && (
        <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm font-medium">
            {activeAction === "verify" && "Confirm verification"}
            {activeAction === "reject" && "Confirm rejection"}
            {activeAction === "resubmit" && "Request resubmission"}
          </p>

          {activeAction === "verify" && (
            <p className="text-sm text-muted-foreground">
              This will mark the KYC as verified and allow the user to invest.
            </p>
          )}

          {needsNote && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">
                {activeAction === "reject" ? "Rejection reason" : "Instructions for user"}
                <span className="ml-0.5 text-destructive">*</span>
              </label>
              <Textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder={
                  activeAction === "reject"
                    ? "Explain why the KYC was rejected..."
                    : "Explain what the user needs to correct or provide..."
                }
                rows={3}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                {reviewNote.length}/500 characters (minimum 10)
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeAction === "reject" ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={!canConfirm || isPending}
            >
              {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
              Confirm
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setActiveAction(null); setReviewNote(""); setError(null); }}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
