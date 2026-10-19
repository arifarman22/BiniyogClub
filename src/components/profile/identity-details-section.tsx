"use client";

import { useState, useTransition, type ReactNode } from "react";
import { CalendarDays, CheckCircle2, CreditCard, Home, Mail, MapPin, Pencil, Phone, User, Users } from "lucide-react";
import { updateIdentityDetailsAction } from "@/server/actions/auth.actions";
import { BdAddressFields, EMPTY_BD_ADDRESS } from "@/components/auth/bd-address-fields";
import { DobInput } from "@/components/ui/dob-input";
import { dmyToIso, formatBdAddress, type BdAddress } from "@/validations/auth";

export type IdentityData = {
  name: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  dateOfBirth: string | null; // ISO
  nationalId: string | null;
  nomineeName: string | null;
  nomineeNationalId: string | null;
  presentAddress: BdAddress | null;
  permanentAddress: BdAddress | null;
};

const isoToDmy = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};

const inputCls =
  "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/10";

function Text({ label, value, onChange, required, hint, ...rest }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; hint?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : hint ? <span className="ml-1 font-normal">({hint})</span> : null}
      </label>
      <input value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} {...rest} />
    </div>
  );
}

function Row({ icon, label, value }: { icon: ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-muted/40 p-3">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${value ? "" : "text-muted-foreground/70"}`}>{value || "Not added"}</p>
      </div>
    </div>
  );
}

/** Personal & identity details — everything that used to be collected at signup. */
export function IdentityDetailsSection({ data, avatar, onSaved }: {
  data: IdentityData;
  avatar?: ReactNode;
  onSaved: (next: IdentityData) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, startSave] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState(data.name);
  const [email, setEmail] = useState(data.email ?? "");
  const [phone, setPhone] = useState(data.phone ?? "");
  const [dob, setDob] = useState(isoToDmy(data.dateOfBirth));
  const [nid, setNid] = useState(data.nationalId ?? "");
  const [nomineeName, setNomineeName] = useState(data.nomineeName ?? "");
  const [nomineeNid, setNomineeNid] = useState(data.nomineeNationalId ?? "");
  const [present, setPresent] = useState<BdAddress>(data.presentAddress ?? EMPTY_BD_ADDRESS);
  const [permanent, setPermanent] = useState<BdAddress>(data.permanentAddress ?? EMPTY_BD_ADDRESS);
  const [samePermanent, setSamePermanent] = useState(false);

  const isFilled = (a: BdAddress) => Object.values(a).some((v) => v.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const permanentAddr = samePermanent ? present : permanent;
    const payload = {
      name, email, phone, dateOfBirth: dob,
      nidNumber: nid, nomineeName, nomineeNidNumber: nomineeNid,
      // Only send an address once the investor has started filling it in.
      presentAddress: isFilled(present) ? present : undefined,
      permanentAddress: isFilled(permanentAddr) ? permanentAddr : undefined,
    };
    startSave(async () => {
      const res = await updateIdentityDetailsAction(payload);
      if (!res.success) { setError(res.error); return; }
      setSuccess(true);
      onSaved({
        ...data,
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim(),
        emailVerified: (email.trim() || null) === data.email ? data.emailVerified : false,
        dateOfBirth: dmyToIso(dob) ? `${dmyToIso(dob)}T00:00:00.000Z` : data.dateOfBirth,
        nationalId: nid.trim() || null,
        nomineeName: nomineeName.trim() || null,
        nomineeNationalId: nomineeNid.trim() || null,
        presentAddress: payload.presentAddress ?? data.presentAddress,
        permanentAddress: payload.permanentAddress ?? data.permanentAddress,
      });
      setTimeout(() => { setEditing(false); setSuccess(false); }, 800);
    });
  }

  return (
    <div className="surface-card space-y-5 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold">Personal &amp; Identity Details</h2>
          <p className="text-xs text-muted-foreground">Keep these up to date — they appear on your investment documents.</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            <Pencil className="h-3 w-3" /> Edit
          </button>
        )}
      </div>

      {avatar}

      {editing ? (
        <form onSubmit={handleSubmit} className="space-y-5 border-t border-border pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Text label="Full Name" value={name} onChange={setName} required />
            <Text label="Phone Number" value={phone} onChange={setPhone} type="tel" inputMode="tel" required />
            <Text label="Email" value={email} onChange={setEmail} type="email" hint="optional" />
            <div className="space-y-1">
              <label htmlFor="profile-dob" className="text-xs font-medium text-muted-foreground">
                Date of Birth<span className="ml-0.5 text-destructive">*</span>
              </label>
              <DobInput id="profile-dob" value={dob} onChange={setDob} inputClassName="rounded-xl border-border focus-visible:ring-4 focus-visible:ring-primary/10" />
            </div>
            <Text label="NID Number" value={nid} onChange={setNid} inputMode="numeric" placeholder="10 or 17 digits" hint="optional" />
          </div>

          <fieldset className="space-y-4 rounded-xl border border-border p-4">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Present Address
            </legend>
            <BdAddressFields id="profile-present" value={present} onChange={setPresent} />
          </fieldset>

          <fieldset className="space-y-4 rounded-xl border border-border p-4">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider">
              <Home className="h-3.5 w-3.5 text-primary" /> Permanent Address
            </legend>
            <label className="flex w-fit cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={samePermanent} onChange={(e) => setSamePermanent(e.target.checked)} className="h-3.5 w-3.5 accent-primary" />
              Same as present address
            </label>
            <BdAddressFields id="profile-permanent" value={samePermanent ? present : permanent} onChange={setPermanent} disabled={samePermanent} />
          </fieldset>

          <fieldset className="space-y-3 rounded-xl border border-amber-400/40 bg-amber-50/50 p-4 dark:bg-amber-950/20">
            <legend className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              <Users className="h-3.5 w-3.5" /> Nominee <span className="font-normal normal-case">(optional)</span>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
              <Text label="Nominee Name" value={nomineeName} onChange={setNomineeName} />
              <Text label="Nominee NID Number" value={nomineeNid} onChange={setNomineeNid} inputMode="numeric" />
            </div>
          </fieldset>

          {error && <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
          <div className="flex items-center gap-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/85 disabled:opacity-60">
              {saving ? "Saving…" : "Save details"}
            </button>
            <button type="button" onClick={() => { setEditing(false); setError(null); }} className="rounded-lg border border-border px-4 py-2 text-sm transition-colors hover:bg-muted/40">
              Cancel
            </button>
            {success && <span className="inline-flex items-center gap-1 text-xs text-success"><CheckCircle2 className="h-3.5 w-3.5" /> Saved</span>}
          </div>
        </form>
      ) : (
        <div className="space-y-3 border-t border-border pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Row icon={<User className="h-4 w-4" />} label="Full Name" value={data.name} />
            <Row icon={<Phone className="h-4 w-4" />} label="Phone" value={data.phone} />
            <Row icon={<Mail className="h-4 w-4" />} label="Email" value={data.email} />
            <Row icon={<CalendarDays className="h-4 w-4" />} label="Date of Birth" value={isoToDmy(data.dateOfBirth) || null} />
            <Row icon={<CreditCard className="h-4 w-4" />} label="NID Number" value={data.nationalId} />
            <Row
              icon={<Users className="h-4 w-4" />}
              label="Nominee"
              value={data.nomineeName ? `${data.nomineeName}${data.nomineeNationalId ? ` · NID ${data.nomineeNationalId}` : ""}` : null}
            />
          </div>
          <Row icon={<MapPin className="h-4 w-4" />} label="Present Address" value={data.presentAddress ? formatBdAddress(data.presentAddress) : null} />
          <Row icon={<Home className="h-4 w-4" />} label="Permanent Address" value={data.permanentAddress ? formatBdAddress(data.permanentAddress) : null} />
        </div>
      )}
    </div>
  );
}
