"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Opt { id: string; name: string; }

interface AddressValue {
  address: string;
  division: string;
  district: string;
  upazila: string;
  postOffice: string; // kept in type for DB compat, not shown in UI
  postalCode: string;
  // internal IDs for cascading — not persisted
  divisionId?: string;
  districtId?: string;
  upazilaId?: string;
}

interface Props {
  prefix: string; // "present" | "permanent"
  label: string;
  value: AddressValue;
  onChange: (val: AddressValue) => void;
  fieldErrors?: Record<string, string>;
  disabled?: boolean;
}

function SearchSelect({
  id, label, options, value, onChange, disabled, loading, placeholder, error,
}: {
  id: string; label: string; options: Opt[]; value: string;
  onChange: (v: string) => void; disabled?: boolean; loading?: boolean;
  placeholder: string; error?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = options.filter((o) =>
    o.name.toLowerCase().includes(search.toLowerCase())
  );
  const selected = options.find((o) => o.id === value || o.name === value);

  return (
    <div className="relative">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative mt-1.5">
        <button
          type="button"
          id={id}
          disabled={disabled || loading}
          onClick={() => { setOpen((p) => !p); setSearch(""); }}
          className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm text-left outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
        >
          <span className={selected ? "text-foreground" : "text-muted-foreground"}>
            {loading ? "Loading…" : selected ? selected.name : placeholder}
          </span>
          <svg className="h-4 w-4 text-muted-foreground shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && !disabled && !loading && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-background shadow-lg">
            <div className="p-2 border-b border-border">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${label.toLowerCase()}…`}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <ul className="max-h-48 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted-foreground">No results found</li>
              ) : (
                filtered.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(o.id); setOpen(false); setSearch(""); }}
                      className={`w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors ${o.id === value ? "bg-primary/10 text-primary font-medium" : ""}`}
                    >
                      {o.name}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export function BdAddressSelector({ prefix, label, value, onChange, fieldErrors = {}, disabled }: Props) {
  const [divisions, setDivisions] = useState<Opt[]>([]);
  const [districts, setDistricts] = useState<Opt[]>([]);
  const [upazilas, setUpazilas] = useState<Opt[]>([]);
  const [loadingDiv, setLoadingDiv] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingUpz, setLoadingUpz] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load divisions once
  useEffect(() => {
    setLoadingDiv(true);
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => { setDivisions(Array.isArray(d) ? d : []); setLoadingDiv(false); })
      .catch(() => { setError("Unable to load divisions. Please try again."); setLoadingDiv(false); });
  }, []);

  // Load districts when divisionId changes
  useEffect(() => {
    if (!value.divisionId) { setDistricts([]); return; }
    setLoadingDist(true);
    fetch(`/api/locations/districts?divisionId=${value.divisionId}`)
      .then((r) => r.json())
      .then((d) => { setDistricts(Array.isArray(d) ? d : []); setLoadingDist(false); })
      .catch(() => { setError("Unable to load districts."); setLoadingDist(false); });
  }, [value.divisionId]);

  // Load upazilas when districtId changes
  useEffect(() => {
    if (!value.districtId) { setUpazilas([]); return; }
    setLoadingUpz(true);
    fetch(`/api/locations/upazilas?districtId=${value.districtId}`)
      .then((r) => r.json())
      .then((d) => { setUpazilas(Array.isArray(d) ? d : []); setLoadingUpz(false); })
      .catch(() => { setError("Unable to load upazilas."); setLoadingUpz(false); });
  }, [value.districtId]);

  function setByOpt(field: "division" | "district" | "upazila", opt: Opt) {
    const next = { ...value };
    if (field === "division") {
      next.division = opt.name; next.divisionId = opt.id;
      next.district = ""; next.districtId = ""; next.upazila = ""; next.upazilaId = ""; next.postalCode = "";
    } else if (field === "district") {
      next.district = opt.name; next.districtId = opt.id;
      next.upazila = ""; next.upazilaId = ""; next.postalCode = "";
    } else if (field === "upazila") {
      next.upazila = opt.name; next.upazilaId = opt.id;
      next.postalCode = "";
    }
    onChange(next);
  }

  function set(field: keyof AddressValue, val: string) {
    onChange({ ...value, [field]: val });
  }

  const p = (f: string) => `${prefix}.${f}`;

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {error && <p className="text-xs text-destructive">{error}</p>}

      <div>
        <Label htmlFor={`${prefix}-address`}>Address / House / Road *</Label>
        <Input
          id={`${prefix}-address`}
          value={value.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="House no, road, area"
          className="mt-1.5"
          disabled={disabled}
        />
        {fieldErrors[p("address")] && <p className="mt-1 text-xs text-destructive">{fieldErrors[p("address")]}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <SearchSelect
          id={`${prefix}-division`}
          label="Division *"
          options={divisions}
          value={value.divisionId ?? ""}
          onChange={(v) => { const o = divisions.find((d) => d.id === v); if (o) setByOpt("division", o); }}
          loading={loadingDiv}
          disabled={disabled}
          placeholder="Select Division"
          error={fieldErrors[p("division")]}
        />
        <SearchSelect
          id={`${prefix}-district`}
          label="District *"
          options={districts}
          value={value.districtId ?? ""}
          onChange={(v) => { const o = districts.find((d) => d.id === v); if (o) setByOpt("district", o); }}
          loading={loadingDist}
          disabled={disabled || !value.divisionId}
          placeholder={value.divisionId ? "Select District" : "Select Division first"}
          error={fieldErrors[p("district")]}
        />
        <SearchSelect
          id={`${prefix}-upazila`}
          label="Upazila / Thana *"
          options={upazilas}
          value={value.upazilaId ?? ""}
          onChange={(v) => { const o = upazilas.find((u) => u.id === v); if (o) setByOpt("upazila", o); }}
          loading={loadingUpz}
          disabled={disabled || !value.districtId}
          placeholder={value.districtId ? "Select Upazila" : "Select District first"}
          error={fieldErrors[p("upazila")]}
        />

      </div>

      <div className="max-w-[200px]">
        <Label htmlFor={`${prefix}-postalcode`}>Postal Code</Label>
        <Input
          id={`${prefix}-postalcode`}
          value={value.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
          placeholder="e.g. 1207"
          className="mt-1.5"
          disabled={disabled}
          maxLength={10}
        />
        {fieldErrors[p("postalCode")] && <p className="mt-1 text-xs text-destructive">{fieldErrors[p("postalCode")]}</p>}
      </div>
    </div>
  );
}
