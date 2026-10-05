"use client";

import { useTransition, useState } from "react";
import { confirmDepositAction } from "@/server/actions/wallet.actions";
import { CheckCircle2, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function ConfirmDepositButton({ paymentId, amount }: { paymentId: string; amount: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleConfirm() {
    if (!confirm(`Confirm deposit of ৳${Number(amount).toLocaleString("en-BD")}? This will credit the investor's wallet.`)) return;
    startTransition(async () => {
      const result = await confirmDepositAction(paymentId);
      if (!result.success) { setError(result.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-destructive flex items-center gap-1"><X className="h-3 w-3" />{error}</span>}
      <button
        onClick={handleConfirm}
        disabled={isPending}
        className="flex items-center gap-1.5 rounded-lg bg-success/10 border border-success/30 px-3 py-1.5 text-xs font-semibold text-success hover:bg-success hover:text-white transition disabled:opacity-50"
      >
        {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Confirm
      </button>
    </div>
  );
}
