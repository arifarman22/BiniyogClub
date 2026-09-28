"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FarmerDialog } from "./farmer-dialog";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { createFarmAction } from "@/server/actions/farmer.actions";
import { Loader2, Plus, Tractor } from "lucide-react";

const BD_DIVISIONS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"];

export function AddFarmDialog() {
  return (
    <FarmerDialog
      title="Register New Farm"
      description="Add a farm to start creating projects"
      trigger={
        <Button size="sm">
          <Plus className="mr-1.5 h-4 w-4" /> Add Farm
        </Button>
      }
    >
      {(close) => <AddFarmForm onSuccess={close} />}
    </FarmerDialog>
  );
}

function AddFarmForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "", description: "", totalAreaAcres: "",
    address: "", district: "", division: "",
    latitude: "", longitude: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createFarmAction({
        ...form,
        totalAreaAcres: parseFloat(form.totalAreaAcres),
        latitude: form.latitude ? parseFloat(form.latitude) : undefined,
        longitude: form.longitude ? parseFloat(form.longitude) : undefined,
      });
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      } else {
        router.refresh();
        onSuccess();
      }
    });
  }

  return (
    <div className="space-y-4 pt-2">
      {error && <Alert variant="destructive"><p className="text-sm">{error}</p></Alert>}

      <FormSection title="Farm Details">
        <FormField label="Farm name" htmlFor="name" required error={fieldErrors.name}>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Green Valley Farm" />
        </FormField>
        <FormField label="Description" htmlFor="description" error={fieldErrors.description}>
          <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Brief description of the farm" rows={2} />
        </FormField>
        <FormField label="Total area (acres)" htmlFor="totalAreaAcres" required error={fieldErrors.totalAreaAcres}>
          <Input id="totalAreaAcres" type="number" step="0.01" min="0.01" value={form.totalAreaAcres} onChange={(e) => set("totalAreaAcres", e.target.value)} placeholder="e.g. 5.5" />
        </FormField>
      </FormSection>

      <FormSection title="Location">
        <FormField label="Address" htmlFor="address" required error={fieldErrors.address}>
          <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Village, Upazila" />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="District" htmlFor="district" required error={fieldErrors.district}>
            <Input id="district" value={form.district} onChange={(e) => set("district", e.target.value)} />
          </FormField>
          <FormField label="Division" htmlFor="division" required error={fieldErrors.division}>
            <Select value={form.division} onValueChange={(v) => set("division", v)}>
              <SelectTrigger id="division" className="w-full"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {BD_DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Latitude" htmlFor="latitude" error={fieldErrors.latitude}>
            <Input id="latitude" type="number" step="0.000001" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="Optional" />
          </FormField>
          <FormField label="Longitude" htmlFor="longitude" error={fieldErrors.longitude}>
            <Input id="longitude" type="number" step="0.000001" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="Optional" />
          </FormField>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          <Tractor className="mr-1.5 h-4 w-4" /> Register Farm
        </Button>
      </div>
    </div>
  );
}
