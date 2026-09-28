"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { submitProjectForReviewAction } from "@/server/actions/farmer.actions";
import { Loader2, Send } from "lucide-react";

export function SubmitProjectButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  function handleClick() {
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitProjectForReviewAction(projectId);
      if (!result.success) {
        setError(result.error);
        setConfirmed(false);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {error && (
        <Alert variant="destructive" className="text-xs py-2 px-3">
          {error}
        </Alert>
      )}
      <Button size="sm" onClick={handleClick} disabled={isPending}>
        {isPending ? (
          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
        ) : (
          <Send className="mr-1.5 h-4 w-4" />
        )}
        {confirmed ? "Confirm Submit" : "Submit for Review"}
      </Button>
      {confirmed && !isPending && (
        <p className="text-xs text-muted-foreground">Click again to confirm</p>
      )}
    </div>
  );
}
