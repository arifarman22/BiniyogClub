"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FarmerDialog } from "./farmer-dialog";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { createFieldAction } from "@/server/actions/farmer.actions";
import { Loader2, Plus } from "lucide-react";

const SOIL_TYPES = ["Clay", "Sandy", "Loam", "Silt", "Peat", "Chalk", "Mixed"];
const IRRIGATION_TYPES = ["Drip", "Sprinkler", "Flood", "Furrow", "Rain-fed", "Canal"];

export function AddFieldDialog({ farmId }: { farmId: string }) {
  return (
    <FarmerDialog
      title="Add Field"
      description="Add a field to track individual plots"
      trigger={
        <Button size="sm" variant="outline">
          <Plus className="mr-1.5 h-4 w-4" /> Add Field
        </Button>
      }
    >
      {(close) => <AddFieldForm farmId={farmId} onSuccess={close} />}
    </FarmerDialog>
  );
}

function AddFieldForm({ farmId, onSuccess }: { farmId: string; onSuccess: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    name: "", areaAcres: "", soilType: "", irrigationType: "",
    latitude: "", longitude: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createFieldAction(farmId, {
        ...form,
        areaAcres: parseFloat(form.areaAcres),
        soilType: form.soilType || undefined,
        irrigationType: form.irrigationType || undefined,
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

      <FormSection>
        <FormField label="Field name" htmlFor="name" required error={fieldErrors.name}>
          <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. North Plot" />
        </FormField>
        <FormField label="Area (acres)" htmlFor="areaAcres" required error={fieldErrors.areaAcres}>
          <Input id="areaAcres" type="number" step="0.01" min="0.01" value={form.areaAcres} onChange={(e) => set("areaAcres", e.target.value)} />
        </FormField>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Soil type" htmlFor="soilType" error={fieldErrors.soilType}>
            <Input id="soilType" list="soil-types" value={form.soilType} onChange={(e) => set("soilType", e.target.value)} placeholder="Optional" />
            <datalist id="soil-types">
              {SOIL_TYPES.map((s) => <option key={s} value={s} />)}
            </datalist>
          </FormField>
          <FormField label="Irrigation" htmlFor="irrigationType" error={fieldErrors.irrigationType}>
            <Input id="irrigationType" list="irrigation-types" value={form.irrigationType} onChange={(e) => set("irrigationType", e.target.value)} placeholder="Optional" />
            <datalist id="irrigation-types">
              {IRRIGATION_TYPES.map((t) => <option key={t} value={t} />)}
            </datalist>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Latitude" htmlFor="lat" error={fieldErrors.latitude}>
            <Input id="lat" type="number" step="0.000001" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} placeholder="Optional" />
          </FormField>
          <FormField label="Longitude" htmlFor="lng" error={fieldErrors.longitude}>
            <Input id="lng" type="number" step="0.000001" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} placeholder="Optional" />
          </FormField>
        </div>
      </FormSection>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Add Field
        </Button>
      </div>
    </div>
  );
}
