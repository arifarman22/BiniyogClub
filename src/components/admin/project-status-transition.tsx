"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { transitionProjectAction, archiveProjectAction } from "@/server/actions/project.actions";
import type { ProjectStatus } from "@prisma/client";

type Props = {
  projectId: string;
  currentStatus: ProjectStatus;
};

const TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
  DRAFT:            ["PENDING_APPROVAL", "CANCELLED"],
  PENDING_APPROVAL: ["APPROVED", "DRAFT", "CANCELLED"],
  APPROVED:         ["FUNDRAISING", "CANCELLED"],
  FUNDRAISING:      ["FUNDED", "CANCELLED"],
  FUNDED:           ["ACTIVE", "CANCELLED"],
  ACTIVE:           ["COMPLETED", "CANCELLED"],
  COMPLETED:        ["ACTIVE", "FUNDRAISING", "CANCELLED"],
  CANCELLED:        [],
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Submit for Approval",
  APPROVED: "Approve",
  FUNDRAISING: "Open Fundraising",
  FUNDED: "Mark as Funded",
  ACTIVE: "Activate",
  COMPLETED: "Complete",
  CANCELLED: "Cancel",
};

const DESTRUCTIVE: ProjectStatus[] = ["CANCELLED"];
const NEEDS_REASON: ProjectStatus[] = ["CANCELLED", "DRAFT"]; // DRAFT here = rejection

export function ProjectStatusTransition({ projectId, currentStatus }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [confirmTo, setConfirmTo] = useState<ProjectStatus | null>(null);

  const nextStatuses = TRANSITIONS[currentStatus] ?? [];
  const archiveable = ["COMPLETED", "CANCELLED"].includes(currentStatus);

  function handleTransition(to: ProjectStatus) {
    if (NEEDS_REASON.includes(to) && !reason.trim()) {
      setConfirmTo(to);
      return;
    }
    execute(to, reason);
  }

  function execute(to: ProjectStatus, r?: string) {
    setError(null);
    startTransition(async () => {
      const result = await transitionProjectAction(projectId, to, r);
      if (!result.success) setError(result.error);
      setConfirmTo(null);
      setReason("");
    });
  }

  function handleArchive() {
    startTransition(async () => {
      const result = await archiveProjectAction(projectId);
      if (!result.success) setError(result.error);
    });
  }

  if (nextStatuses.length === 0 && !archiveable) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Lifecycle Actions</h3>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {/* Reason input for cancellation/rejection */}
      {(confirmTo || nextStatuses.some((s) => NEEDS_REASON.includes(s))) && (
        <div>
          <label className="text-xs text-muted-foreground">
            Reason {confirmTo ? `(required for ${STATUS_LABELS[confirmTo]})` : "(optional)"}
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="Provide a reason..."
            className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((to) => (
          <Button
            key={to}
            size="sm"
            variant={DESTRUCTIVE.includes(to) ? "destructive" : "default"}
            disabled={isPending}
            onClick={() => handleTransition(to)}
          >
            {STATUS_LABELS[to]}
          </Button>
        ))}

        {archiveable && (
          <Button size="sm" variant="outline" disabled={isPending} onClick={handleArchive}>
            Archive
          </Button>
        )}
      </div>

      {confirmTo && (
        <p className="text-xs text-muted-foreground">
          Add a reason above then click the button again to confirm.
        </p>
      )}
    </div>
  );
}
