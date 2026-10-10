"use client";

import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { updateGroupTierAction } from "@/server/actions/group-investment.actions";

type Props = {
  tier: {
    id: string;
    name: string;
    description: string;
    benefits: string[];
    minAmountBdt: number;
    maxAmountBdt: number | null;
    expectedReturnPct: number | null;
    durationMonths: number | null;
    totalUnits: number | null;
    availableUnits: number | null;
    isActive: boolean;
  };
};

export function EditTierDialog({ tier }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState(tier.name);
  const [description, setDescription] = useState(tier.description);
  const [benefits, setBenefits] = useState(tier.benefits.join("\n"));
  const [minAmount, setMinAmount] = useState(String(tier.minAmountBdt));
  const [maxAmount, setMaxAmount] = useState(tier.maxAmountBdt != null ? String(tier.maxAmountBdt) : "");
  const [returnPct, setReturnPct] = useState(tier.expectedReturnPct != null ? String(tier.expectedReturnPct) : "");
  const [duration, setDuration] = useState(tier.durationMonths != null ? String(tier.durationMonths) : "");
  const [totalUnits, setTotalUnits] = useState(tier.totalUnits != null ? String(tier.totalUnits) : "");
  const [availableUnits, setAvailableUnits] = useState(tier.availableUnits != null ? String(tier.availableUnits) : "");
  const [isActive, setIsActive] = useState(tier.isActive);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const parsedMin = parseFloat(minAmount);
    if (isNaN(parsedMin) || parsedMin <= 0) { setError("Enter a valid minimum amount."); return; }
    if (!name.trim()) { setError("Name is required."); return; }

    setLoading(true);
    const result = await updateGroupTierAction(tier.id, {
      name: name.trim(),
      description: description.trim(),
      benefits: benefits.split("\n").map((b) => b.trim()).filter(Boolean),
      minAmountBdt: parsedMin,
      maxAmountBdt: maxAmount ? parseFloat(maxAmount) : null,
      expectedReturnPct: returnPct ? parseFloat(returnPct) : null,
      durationMonths: duration ? parseInt(duration) : null,
      totalUnits: totalUnits ? parseInt(totalUnits) : null,
      availableUnits: availableUnits ? parseInt(availableUnits) : null,
      isActive,
    });
    setLoading(false);
    if (result.success) {
      setOpen(false);
    } else {
      setError(result.error ?? "Failed to update.");
    }
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg surface-card shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <div>
                <h2 className="font-semibold">Edit Tier</h2>
                <p className="text-xs text-muted-foreground mt-0.5">{tier.name}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-5 space-y-4">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tier Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {/* Benefits */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Benefits <span className="normal-case font-normal">(one per line)</span></label>
                <textarea
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  rows={3}
                  placeholder="e.g. Annual profit sharing&#10;Priority allocation&#10;Certificate of membership"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                />
              </div>

              {/* Min / Max amount */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Min Amount (BDT)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                    <input
                      type="number"
                      value={minAmount}
                      onChange={(e) => setMinAmount(e.target.value)}
                      min={1}
                      step="0.01"
                      required
                      className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Max Amount (BDT)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">৳</span>
                    <input
                      type="number"
                      value={maxAmount}
                      onChange={(e) => setMaxAmount(e.target.value)}
                      min={1}
                      step="0.01"
                      placeholder="No limit"
                      className="w-full rounded-xl border border-border bg-background pl-7 pr-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>

              {/* Return % / Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Expected Return %</label>
                  <input
                    type="number"
                    value={returnPct}
                    onChange={(e) => setReturnPct(e.target.value)}
                    min={0}
                    max={100}
                    step="0.0001"
                    placeholder="e.g. 12.5"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Duration (months)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min={1}
                    step={1}
                    placeholder="e.g. 24"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Total / Available units */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Units</label>
                  <input
                    type="number"
                    value={totalUnits}
                    onChange={(e) => setTotalUnits(e.target.value)}
                    min={0}
                    step={1}
                    placeholder="Leave blank if N/A"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Available Units</label>
                  <input
                    type="number"
                    value={availableUnits}
                    onChange={(e) => setAvailableUnits(e.target.value)}
                    min={0}
                    step={1}
                    placeholder="Leave blank if N/A"
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div
                  onClick={() => setIsActive((v) => !v)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${isActive ? "bg-success" : "bg-muted-foreground/30"}`}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isActive ? "translate-x-4" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm">{isActive ? "Active" : "Inactive"}</span>
              </label>

              {error && <p className="text-xs text-destructive">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted/40 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 disabled:opacity-60 transition-colors"
                >
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
