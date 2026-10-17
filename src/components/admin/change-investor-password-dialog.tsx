"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/loading";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { resetInvestorPasswordAction } from "@/server/actions/admin.actions";

export function ChangeInvestorPasswordDialog({ userId, userName }: { userId: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function close() {
    setOpen(false);
    setPassword("");
    setConfirm("");
    setShowPassword(false);
    setShowConfirm(false);
    setError(null);
  }

  function handleConfirm() {
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError(null);
    startTransition(async () => {
      const result = await resetInvestorPasswordAction(userId, password);
      if (!result.success) { setError(result.error ?? "Failed to reset password."); }
      else { close(); }
    });
  }

  return (
    <>
      <Button variant="outline" size="xs" onClick={() => setOpen(true)}>
        <KeyRound className="h-3.5 w-3.5 mr-1.5" /> Change Password
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) close(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Set a new password for {userName}. Their existing sessions will be invalidated.</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirm ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className="pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter>
            <Button variant="outline" onClick={close} disabled={isPending}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={isPending || !password || !confirm}>
              {isPending && <Spinner size="xs" className="mr-1.5" />}
              Set Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
