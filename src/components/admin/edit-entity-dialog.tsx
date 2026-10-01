"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateGroupEntityAction } from "@/server/actions/group-investment.actions";

type Props = {
  entity: { id: string; name: string; description: string; isActive: boolean };
};

export function EditEntityDialog({ entity }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(entity.name);
  const [description, setDescription] = useState(entity.description);
  const [isActive, setIsActive] = useState(entity.isActive);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Name is required."); return; }
    setLoading(true);
    const result = await updateGroupEntityAction(entity.id, {
      name: name.trim(),
      description: description.trim(),
      isActive,
    });
    setLoading(false);
    if (result.success) setOpen(false);
    else setError(result.error ?? "Failed to update.");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted/40 transition-colors"
      >
        <Pencil className="h-3 w-3" /> Edit
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="font-semibold">Edit Entity</h2>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entity Name</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={() => setIsActive((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${isActive ? "bg-success" : "bg-muted-foreground/30"}`}>
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
              </label>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 transition-colors">Cancel</button>
                <button type="submit" disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60 transition-colors">
                  {loading ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
