"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteProjectAction } from "@/server/actions/project.actions";

export function DeleteProjectButton({ projectId, projectTitle }: { projectId: string; projectTitle: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setLoading(true);
    const result = await deleteProjectAction(projectId);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Failed to delete.");
      setConfirm(false);
    } else {
      router.push("/admin/projects");
      router.refresh();
    }
  }

  if (confirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirm(false)}>
        <div className="w-full max-w-sm surface-card p-5 shadow-xl space-y-4" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-destructive/10">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="font-semibold">Delete Project?</p>
              <p className="text-xs text-muted-foreground mt-0.5">This cannot be undone. Projects with investments will be hidden; others will be permanently removed.</p>
            </div>
          </div>
          <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm font-medium line-clamp-2">{projectTitle}</p>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setConfirm(false)}
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 rounded-lg bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/80 disabled:opacity-60 transition-colors"
            >
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex items-center gap-1 rounded border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 transition-colors"
    >
      <Trash2 className="h-3 w-3" /> Delete
    </button>
  );
}
