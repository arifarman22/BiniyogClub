"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Pencil, Plus } from "lucide-react";
import {
  createGroupTierAction,
  updateGroupTierAction,
  type TierInput,
} from "@/server/actions/group-investment.actions";
import { ActiveToggle, Field, FormFooter, Modal, inputCls, num } from "./group-form-ui";

const TIER_TYPES: { value: TierInput["type"]; label: string }[] = [
  { value: "INVESTOR", label: "Investor" },
  { value: "SHAREHOLDER", label: "Shareholder" },
  { value: "DIRECTORSHIP", label: "Directorship" },
  { value: "PLOT_BOOKING", label: "Plot Booking" },
  { value: "LAND_SHARE", label: "Land Sharing" },
];

export type BankOption = { id: string; bankName: string; accountName: string; accountNumber: string; branchName: string | null };

type TierValues = {
  id: string;
  type: string;
  name: string;
  description: string;
  benefits: string[];
  minAmountBdt: number;
  maxAmountBdt: number | null;
  expectedReturnPct: number | null;
  durationMonths: number | null;
  plotSizeSqft: number | null;
  pricePerSqftBdt: number | null;
  totalUnits: number | null;
  availableUnits: number | null;
  sortOrder: number;
  bankAccountId: string | null;
  isActive: boolean;
};

type Props = { bankAccounts: BankOption[] } & (
  | { mode?: "edit"; tier: TierValues; entityId?: never; nextSortOrder?: never }
  | { mode: "create"; entityId: string; nextSortOrder: number; tier?: never }
);

const s = (v: number | null | undefined) => (v != null ? String(v) : "");

export function EditTierDialog(props: Props) {
  const router = useRouter();
  const isCreate = props.mode === "create";
  const t = props.tier;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState<TierInput["type"]>((t?.type as TierInput["type"]) ?? "INVESTOR");
  const [name, setName] = useState(t?.name ?? "");
  const [description, setDescription] = useState(t?.description ?? "");
  const [benefits, setBenefits] = useState(t?.benefits.join("\n") ?? "");
  const [minAmount, setMinAmount] = useState(s(t?.minAmountBdt));
  const [maxAmount, setMaxAmount] = useState(s(t?.maxAmountBdt));
  const [returnPct, setReturnPct] = useState(s(t?.expectedReturnPct));
  const [duration, setDuration] = useState(s(t?.durationMonths));
  const [plotSize, setPlotSize] = useState(s(t?.plotSizeSqft));
  const [pricePerSqft, setPricePerSqft] = useState(s(t?.pricePerSqftBdt));
  const [totalUnits, setTotalUnits] = useState(s(t?.totalUnits));
  const [availableUnits, setAvailableUnits] = useState(s(t?.availableUnits));
  const [sortOrder, setSortOrder] = useState(String(t?.sortOrder ?? props.nextSortOrder ?? 0));
  const [bankAccountId, setBankAccountId] = useState(t?.bankAccountId ?? "");
  const [isActive, setIsActive] = useState(t?.isActive ?? true);

  const isProperty = type === "PLOT_BOOKING" || type === "LAND_SHARE";
  const selectedBank = props.bankAccounts.find((b) => b.id === bankAccountId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const min = num(minAmount);
    if (!name.trim()) { setError("Name is required."); return; }
    if (min == null || min <= 0) { setError("Enter a valid minimum amount."); return; }

    const data: TierInput = {
      type,
      name,
      description,
      benefits: benefits.split("\n"),
      minAmountBdt: min,
      maxAmountBdt: num(maxAmount),
      expectedReturnPct: num(returnPct),
      durationMonths: num(duration),
      plotSizeSqft: isProperty ? num(plotSize) : null,
      pricePerSqftBdt: isProperty ? num(pricePerSqft) : null,
      totalUnits: num(totalUnits),
      availableUnits: num(availableUnits),
      sortOrder: num(sortOrder) ?? 0,
      bankAccountId: bankAccountId || null,
      isActive,
    };

    setLoading(true);
    const result = isCreate
      ? await createGroupTierAction(props.entityId, data)
      : await updateGroupTierAction(t!.id, data);
    setLoading(false);
    if (!result.success) { setError(result.error ?? "Failed to save."); return; }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs transition-colors hover:bg-muted/40"
      >
        {isCreate ? <><Plus className="h-3 w-3" /> Add Tier</> : <><Pencil className="h-3 w-3" /> Edit</>}
      </button>

      {open && (
        <Modal
          wide
          title={isCreate ? "Add Tier" : "Edit Tier"}
          subtitle={isCreate ? "A new investment tier for this entity." : t!.name}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto p-5">
            {/* Basics */}
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label="Tier Type">
                <select value={type} onChange={(e) => setType(e.target.value as TierInput["type"])} className={inputCls}>
                  {TIER_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Tier Name">
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
                </Field>
              </div>
            </div>
            <Field label="Description">
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`${inputCls} resize-none`} />
            </Field>
            <Field label="Benefits" hint="one per line">
              <textarea
                value={benefits}
                onChange={(e) => setBenefits(e.target.value)}
                rows={4}
                placeholder={"Annual profit sharing\nPriority allocation\nCertificate of membership"}
                className={`${inputCls} resize-none`}
              />
            </Field>

            {/* Figures */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Min Amount (BDT)">
                <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)} min={1} step="0.01" required className={inputCls} />
              </Field>
              <Field label="Max Amount (BDT)" hint="blank = no limit">
                <input type="number" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} min={1} step="0.01" className={inputCls} />
              </Field>
              <Field label="Expected Return %">
                <input type="number" value={returnPct} onChange={(e) => setReturnPct(e.target.value)} min={0} max={100} step="0.01" placeholder="e.g. 15" className={inputCls} />
              </Field>
              <Field label="Duration (months)">
                <input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min={1} step={1} placeholder="e.g. 24" className={inputCls} />
              </Field>
              {isProperty && (
                <>
                  <Field label="Plot Size (sqft)">
                    <input type="number" value={plotSize} onChange={(e) => setPlotSize(e.target.value)} min={0} step="0.01" className={inputCls} />
                  </Field>
                  <Field label="Price per sqft (BDT)">
                    <input type="number" value={pricePerSqft} onChange={(e) => setPricePerSqft(e.target.value)} min={0} step="0.01" className={inputCls} />
                  </Field>
                </>
              )}
              <Field label="Total Units" hint="blank = unlimited">
                <input type="number" value={totalUnits} onChange={(e) => setTotalUnits(e.target.value)} min={0} step={1} className={inputCls} />
              </Field>
              <Field label="Available Units">
                <input type="number" value={availableUnits} onChange={(e) => setAvailableUnits(e.target.value)} min={0} step={1} className={inputCls} />
              </Field>
              <Field label="Display Order" hint="lower shows first">
                <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} step={1} className={inputCls} />
              </Field>
            </div>

            {/* Payment account */}
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-4">
              <Field label="Payment Bank Account" hint="investors pay into this account">
                <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)} className={inputCls}>
                  <option value="">— Not assigned (investing disabled) —</option>
                  {props.bankAccounts.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.bankName} — {b.accountName} — {b.accountNumber}
                    </option>
                  ))}
                </select>
              </Field>
              {selectedBank ? (
                <p className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Landmark className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  Shown on the tier page: {selectedBank.bankName}, {selectedBank.accountName}, A/C {selectedBank.accountNumber}
                  {selectedBank.branchName ? `, ${selectedBank.branchName} branch` : ""}.
                </p>
              ) : (
                <p className="text-xs text-warning">Investors can&apos;t invest in this tier until an account is assigned.</p>
              )}
              <p className="text-[11px] text-muted-foreground">
                Accounts are managed under Payments → Bank Accounts.
              </p>
            </div>

            <ActiveToggle value={isActive} onChange={setIsActive} />
            <FormFooter error={error} loading={loading} submitLabel={isCreate ? "Add Tier" : "Save Changes"} onCancel={() => setOpen(false)} />
          </form>
        </Modal>
      )}
    </>
  );
}
