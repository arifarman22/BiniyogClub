"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { updateFarmerProfileAction } from "@/server/actions/farmer.actions";
import { Loader2, CheckCircle2 } from "lucide-react";
import type { getFarmerProfile } from "@/server/data/farmer.data";

interface Props {
  profile: Awaited<ReturnType<typeof getFarmerProfile>>;
}

export function FarmerProfileForm({ profile }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    name: profile.name ?? "",
    phone: profile.phone ?? "",
    address: profile.farmerProfile?.address ?? "",
    city: profile.farmerProfile?.city ?? "",
    yearsExperience: String(profile.farmerProfile?.yearsExperience ?? ""),
    specializations: (profile.farmerProfile?.specializations ?? []).join(", "),
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
    setSaved(false);
  }

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateFarmerProfileAction({
        name: form.name || undefined,
        phone: form.phone || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        yearsExperience: form.yearsExperience ? parseInt(form.yearsExperience) : undefined,
        specializations: form.specializations
          ? form.specializations.split(",").map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      } else {
        setSaved(true);
        router.refresh();
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <h2 className="font-semibold">Personal Information</h2>

      {error && <Alert variant="destructive"><p className="text-sm">{error}</p></Alert>}
      {saved && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm">Profile updated successfully.</p>
        </Alert>
      )}

      <FormSection>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="name" error={fieldErrors.name}>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={fieldErrors.phone}>
            <Input id="phone" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" className="font-mono" />
          </FormField>
          <FormField label="Email" htmlFor="email">
            <Input id="email" value={profile.email} disabled className="bg-muted/50" />
          </FormField>
          <FormField label="Years of experience" htmlFor="yearsExperience" error={fieldErrors.yearsExperience}>
            <Input id="yearsExperience" type="number" min="0" max="80" value={form.yearsExperience} onChange={(e) => set("yearsExperience", e.target.value)} />
          </FormField>
          <FormField label="City" htmlFor="city" error={fieldErrors.city} className="sm:col-span-2">
            <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
          </FormField>
          <FormField label="Address" htmlFor="address" error={fieldErrors.address} className="sm:col-span-2">
            <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
          </FormField>
          <FormField
            label="Specializations"
            htmlFor="specializations"
            hint="Comma-separated, e.g. Rice, Vegetables, Aquaculture"
            error={fieldErrors.specializations}
            className="sm:col-span-2"
          >
            <Input id="specializations" value={form.specializations} onChange={(e) => set("specializations", e.target.value)} placeholder="Rice, Vegetables, Poultry" />
          </FormField>
        </div>
      </FormSection>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
