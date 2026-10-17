"use client";

import { useMemo, useState } from "react";
import { DIVISIONS, districtsOf, thanasOf } from "@/lib/bd-locations";
import type { BdAddress } from "@/validations/auth";

export const EMPTY_BD_ADDRESS: BdAddress = { line: "", division: "", district: "", thana: "", postalCode: "" };

type FieldErrors = Partial<Record<keyof BdAddress, { message?: string }>>;

type Props = {
  id: string;
  value: BdAddress;
  onChange: (next: BdAddress) => void;
  errors?: FieldErrors;
  disabled?: boolean;
};

const OTHER = "__other__";

const controlCls =
  "h-11 w-full rounded-xl border border-border/80 bg-background px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:bg-muted/40 disabled:opacity-70";

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label} <span className="text-destructive">*</span>
      </label>
      {children}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Bangladeshi address: house/road line, then Division → District → Thana
 * dropdowns (each list depends on the previous choice) and a postal code.
 * Thanas not in the list can be typed in.
 */
export function BdAddressFields({ id, value, onChange, errors = {}, disabled }: Props) {
  // Names are stored (that's what the KYC record keeps); ids drive the cascade.
  const division = DIVISIONS.find((d) => d.name === value.division);
  const districts = useMemo(() => (division ? districtsOf(division.id) : []), [division]);
  const district = districts.find((d) => d.name === value.district);
  const thanas = useMemo(() => (district ? thanasOf(district.id) : []), [district]);

  const listed = thanas.some((t) => t.name === value.thana);
  const [typing, setTyping] = useState(false);
  const showOther = typing || (!!value.thana && !listed);

  const set = (patch: Partial<BdAddress>) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <Field id={`${id}-line`} label="House / Road / Area" error={errors.line?.message}>
        <input
          id={`${id}-line`}
          type="text"
          value={value.line}
          disabled={disabled}
          onChange={(e) => set({ line: e.target.value })}
          placeholder="e.g. House 12, Road 5, Block C"
          autoComplete="address-line1"
          className={`${controlCls} placeholder:text-muted-foreground/30`}
          aria-invalid={!!errors.line}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field id={`${id}-division`} label="Division" error={errors.division?.message}>
          <select
            id={`${id}-division`}
            value={value.division}
            disabled={disabled}
            onChange={(e) => { setTyping(false); set({ division: e.target.value, district: "", thana: "" }); }}
            className={controlCls}
            aria-invalid={!!errors.division}
          >
            <option value="">Select division</option>
            {DIVISIONS.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </Field>

        <Field id={`${id}-district`} label="District" error={errors.district?.message}>
          <select
            id={`${id}-district`}
            value={value.district}
            disabled={disabled || !division}
            onChange={(e) => { setTyping(false); set({ district: e.target.value, thana: "" }); }}
            className={controlCls}
            aria-invalid={!!errors.district}
          >
            <option value="">{division ? "Select district" : "Select division first"}</option>
            {districts.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </Field>

        <Field id={`${id}-thana`} label="Thana / Upazila" error={errors.thana?.message}>
          <select
            id={`${id}-thana`}
            value={showOther ? OTHER : value.thana}
            disabled={disabled || !district}
            onChange={(e) => {
              if (e.target.value === OTHER) { setTyping(true); set({ thana: "" }); }
              else { setTyping(false); set({ thana: e.target.value }); }
            }}
            className={controlCls}
            aria-invalid={!!errors.thana}
          >
            <option value="">{district ? "Select thana" : "Select district first"}</option>
            {thanas.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
            {district && <option value={OTHER}>My thana isn&apos;t listed</option>}
          </select>
          {showOther && (
            <input
              type="text"
              value={value.thana}
              disabled={disabled}
              onChange={(e) => set({ thana: e.target.value })}
              placeholder="Type your thana"
              className={`${controlCls} mt-2 placeholder:text-muted-foreground/30`}
              aria-label="Thana name"
            />
          )}
        </Field>

        <Field id={`${id}-postal`} label="Postal Code" error={errors.postalCode?.message}>
          <input
            id={`${id}-postal`}
            type="text"
            inputMode="numeric"
            maxLength={4}
            value={value.postalCode}
            disabled={disabled}
            onChange={(e) => set({ postalCode: e.target.value.replace(/\D/g, "").slice(0, 4) })}
            placeholder="e.g. 1207"
            autoComplete="postal-code"
            className={`${controlCls} placeholder:text-muted-foreground/30`}
            aria-invalid={!!errors.postalCode}
          />
        </Field>
      </div>
    </div>
  );
}
