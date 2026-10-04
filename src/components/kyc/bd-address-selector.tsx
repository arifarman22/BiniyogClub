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
  postOffice: string;
  postalCode: string;
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
  const selected = options.find((o) => o.id === value);

  return (
    <div className="relative">
      <Label htmlFor={id} className="text-sm font-medium">{label}</Label>
      <div className="relative mt-1.5">
        <button
          type="button"
          id={id}
          disabled={disabled || loading}
          onClick={() => { setOpen((p) => !p); setSearch(""); }}
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-left outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
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
  const [postOffices, setPostOffices] = useState<Opt[]>([]);

  const [loadingDiv, setLoadingDiv] = useState(false);
  const [loadingDist, setLoadingDist] = useState(false);
  const [loadingUpz, setLoadingUpz] = useState(false);
  const [loadingPo, setLoadingPo] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // Load divisions once
  useEffect(() => {
    setLoadingDiv(true);
    fetch("/api/locations")
      .then((r) => r.json())
      .then((d) => { setDivisions(Array.isArray(d) ? d : []); setLoadingDiv(false); })
      .catch(() => { setError("Unable to load divisions. Please try again."); setLoadingDiv(false); });
  }, []);

  // Load districts when division changes
  useEffect(() => {
    if (!value.division) { setDistricts([]); return; }
    setLoadingDist(true);
    fetch(`/api/locations/districts?divisionId=${value.division}`)
      .then((r) => r.json())
      .then((d) => { setDistricts(Array.isArray(d) ? d : []); setLoadingDist(false); })
      .catch(() => { setError("Unable to load districts."); setLoadingDist(false); });
  }, [value.division]);

  // Load upazilas when district changes
  useEffect(() => {
    if (!value.district) { setUpazilas([]); return; }
    setLoadingUpz(true);
    fetch(`/api/locations/upazilas?districtId=${value.district}`)
      .then((r) => r.json())
      .then((d) => { setUpazilas(Array.isArray(d) ? d : []); setLoadingUpz(false); })
      .catch(() => { setError("Unable to load upazilas."); setLoadingUpz(false); });
  }, [value.district]);

  // Load post offices when upazila changes
  useEffect(() => {
    if (!value.upazila) { setPostOffices([]); return; }
    setLoadingPo(true);
    fetch(`/api/locations/postoffices?upazilaId=${value.upazila}`)
      .then((r) => r.json())
      .then((d) => { setPostOffices(Array.isArray(d) ? d : []); setLoadingPo(false); })
      .catch(() => { setError("Unable to load post offices."); setLoadingPo(false); });
  }, [value.upazila]);

  function set(field: keyof AddressValue, val: string) {
    const next = { ...value, [field]: val };
    // Cascade resets
    if (field === "division")  { next.district = ""; next.upazila = ""; next.postOffice = ""; next.postalCode = ""; }
    if (field === "district")  { next.upazila = ""; next.postOffice = ""; next.postalCode = ""; }
    if (field === "upazila")   { next.postOffice = ""; next.postalCode = ""; }
    if (field === "postOffice") {
      // auto-fill postal code not available from this API — user types it
    }
    onChange(next);
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
          value={value.division}
          onChange={(v) => set("division", v)}
          loading={loadingDiv}
          disabled={disabled}
          placeholder="Select Division"
          error={fieldErrors[p("division")]}
        />
        <SearchSelect
          id={`${prefix}-district`}
          label="District *"
          options={districts}
          value={value.district}
          onChange={(v) => set("district", v)}
          loading={loadingDist}
          disabled={disabled || !value.division}
          placeholder={value.division ? "Select District" : "Select Division first"}
          error={fieldErrors[p("district")]}
        />
        <SearchSelect
          id={`${prefix}-upazila`}
          label="Upazila / Thana *"
          options={upazilas}
          value={value.upazila}
          onChange={(v) => set("upazila", v)}
          loading={loadingUpz}
          disabled={disabled || !value.district}
          placeholder={value.district ? "Select Upazila" : "Select District first"}
          error={fieldErrors[p("upazila")]}
        />
        <SearchSelect
          id={`${prefix}-postoffice`}
          label="Post Office"
          options={postOffices}
          value={value.postOffice}
          onChange={(v) => set("postOffice", v)}
          loading={loadingPo}
          disabled={disabled || !value.upazila}
          placeholder={value.upazila ? "Select Post Office" : "Select Upazila first"}
          error={fieldErrors[p("postOffice")]}
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
