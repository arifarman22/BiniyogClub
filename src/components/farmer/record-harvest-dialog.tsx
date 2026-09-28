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
import { recordHarvestAction } from "@/server/actions/farmer.actions";
import { Loader2, Plus } from "lucide-react";
import type { getFarmerProjects, getFarmerActiveCropCycles } from "@/server/data/farmer.data";

interface Props {
  projects: Awaited<ReturnType<typeof getFarmerProjects>>;
  cropCycles: Awaited<ReturnType<typeof getFarmerActiveCropCycles>>;
}

export function RecordHarvestDialog({ projects, cropCycles }: Props) {
  return (
    <FarmerDialog
      title="Record Harvest"
      trigger={<Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Record Harvest</Button>}
    >
      {(close) => <RecordHarvestForm projects={projects} cropCycles={cropCycles} onSuccess={close} />}
    </FarmerDialog>
  );
}

function RecordHarvestForm({ projects, cropCycles, onSuccess }: Props & { onSuccess: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    projectId: "", cropCycleId: "", yieldKg: "",
    harvestedAt: new Date().toISOString().split("T")[0],
    qualityGrade: "", storageLocation: "", notes: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await recordHarvestAction({
        ...form,
        yieldKg: parseFloat(form.yieldKg),
        harvestedAt: new Date(form.harvestedAt),
        qualityGrade: form.qualityGrade || undefined,
        storageLocation: form.storageLocation || undefined,
        notes: form.notes || undefined,
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
        <FormField label="Project" htmlFor="projectId" required error={fieldErrors.projectId}>
          <Select value={form.projectId} onValueChange={(v) => set("projectId", v)}>
            <SelectTrigger id="projectId" className="w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Crop cycle" htmlFor="cropCycleId" required error={fieldErrors.cropCycleId}>
          <Select value={form.cropCycleId} onValueChange={(v) => set("cropCycleId", v)}>
            <SelectTrigger id="cropCycleId" className="w-full"><SelectValue placeholder="Select crop" /></SelectTrigger>
            <SelectContent>
              {cropCycles.map((cc) => (
                <SelectItem key={cc.id} value={cc.id}>
                  {cc.crop.name} — {cc.field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Yield (kg)" htmlFor="yieldKg" required error={fieldErrors.yieldKg}>
            <Input id="yieldKg" type="number" step="0.1" min="0.1" value={form.yieldKg} onChange={(e) => set("yieldKg", e.target.value)} />
          </FormField>
          <FormField label="Harvest date" htmlFor="harvestedAt" required error={fieldErrors.harvestedAt}>
            <Input id="harvestedAt" type="date" value={form.harvestedAt} onChange={(e) => set("harvestedAt", e.target.value)} />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quality grade" htmlFor="qualityGrade" error={fieldErrors.qualityGrade}>
            <Input id="qualityGrade" value={form.qualityGrade} onChange={(e) => set("qualityGrade", e.target.value)} placeholder="e.g. A, B, Premium" />
          </FormField>
          <FormField label="Storage location" htmlFor="storageLocation" error={fieldErrors.storageLocation}>
            <Input id="storageLocation" value={form.storageLocation} onChange={(e) => set("storageLocation", e.target.value)} placeholder="Optional" />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="notes" error={fieldErrors.notes}>
          <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional notes" />
        </FormField>
      </FormSection>

      <div className="flex justify-end pt-2">
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Record Harvest
        </Button>
      </div>
    </div>
  );
}
