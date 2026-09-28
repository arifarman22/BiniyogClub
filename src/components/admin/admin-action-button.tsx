"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/loading";
import { AlertTriangle } from "lucide-react";
import type { ActionResult } from "@/server/actions/auth.actions";

interface AdminActionButtonProps {
  label: string;
  confirmTitle: string;
  confirmDescription: string;
  onConfirm: (reason?: string) => Promise<ActionResult<unknown>>;
  requireReason?: boolean;
  reasonPlaceholder?: string;
  variant?: "default" | "destructive" | "outline" | "ghost";
  size?: "default" | "sm" | "xs";
  className?: string;
  disabled?: boolean;
}

export function AdminActionButton({
  label,
  confirmTitle,
  confirmDescription,
  onConfirm,
  requireReason = false,
  reasonPlaceholder = "Enter reason...",
  variant = "outline",
  size = "xs",
  className,
  disabled,
}: AdminActionButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setReason("");
    setError(null);
  }

  function handleConfirm() {
    if (requireReason && !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await onConfirm(reason || undefined);
      if (!result.success) {
        setError(result.error);
      } else {
        close();
      }
    });
  }

  const isDestructive = variant === "destructive";

  return (
    <>
      <Button variant={variant} size={size} onClick={() => setOpen(true)} disabled={disabled} className={className}>
        {label}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-start gap-3">
              {isDestructive && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangle className="size-5" />
                </div>
              )}
              <div>
                <DialogTitle>{confirmTitle}</DialogTitle>
                <DialogDescription className="mt-1">{confirmDescription}</DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {requireReason && (
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              className="text-sm"
            />
          )}

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>Cancel</Button>
            <Button
              variant={isDestructive ? "destructive" : "default"}
              onClick={handleConfirm}
              disabled={isPending || (requireReason && !reason.trim())}
            >
              {isPending && <Spinner size="xs" className="mr-1.5" />}
              {label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
