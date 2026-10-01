"use client";

import { useTransition, useState } from "react";
import { cancelWithdrawalAction } from "@/server/actions/wallet.actions";
import { Loader2 } from "lucide-react";

export function CancelWithdrawalButton({ withdrawalId }: { withdrawalId: string }) {
  const [isPending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");

  function handleCancel() {
    setError("");
    startTransition(async () => {
      const result = await cancelWithdrawalAction(withdrawalId);
      if (!result.success) {
        setError(result.error ?? "Failed to cancel");
        setConfirm(false);
      }
    });
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="text-xs text-destructive hover:underline"
      >
        Cancel
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive">{error}</span>}
      <button
        onClick={() => setConfirm(false)}
        disabled={isPending}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        No
      </button>
      <button
        onClick={handleCancel}
        disabled={isPending}
        className="flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-50"
      >
        {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
        Confirm cancel
      </button>
    </div>
  );
}
