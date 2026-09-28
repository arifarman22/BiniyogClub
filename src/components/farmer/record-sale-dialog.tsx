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
import { recordSaleAction } from "@/server/actions/farmer.actions";
import { Loader2, Plus } from "lucide-react";
import type { getFarmerProjects, getFarmerHarvests } from "@/server/data/farmer.data";

interface Props {
  projects: Awaited<ReturnType<typeof getFarmerProjects>>;
  harvests: Awaited<ReturnType<typeof getFarmerHarvests>>;
}

export function RecordSaleDialog({ projects, harvests }: Props) {
  return (
    <FarmerDialog
      title="Record Sale"
      trigger={<Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Record Sale</Button>}
    >
      {(close) => <RecordSaleForm projects={projects} harvests={harvests} onSuccess={close} />}
    </FarmerDialog>
  );
}

function RecordSaleForm({ projects, harvests, onSuccess }: Props & { onSuccess: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    projectId: "", harvestId: "", buyerName: "",
    quantityKg: "", pricePerKgBdt: "",
    soldAt: new Date().toISOString().split("T")[0],
    notes: "",
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  const total = parseFloat(form.quantityKg || "0") * parseFloat(form.pricePerKgBdt || "0");

  // Filter harvests by selected project
  const filteredHarvests = form.projectId
    ? harvests.filter((h) => h.projectId === form.projectId)
    : harvests;

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await recordSaleAction({
        ...form,
        quantityKg: parseFloat(form.quantityKg),
        pricePerKgBdt: parseFloat(form.pricePerKgBdt),
        soldAt: new Date(form.soldAt),
        buyerName: form.buyerName || undefined,
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
          <Select value={form.projectId} onValueChange={(v) => { set("projectId", v); set("harvestId", ""); }}>
            <SelectTrigger id="projectId" className="w-full"><SelectValue placeholder="Select project" /></SelectTrigger>
            <SelectContent>
              {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Harvest" htmlFor="harvestId" required error={fieldErrors.harvestId}>
          <Select value={form.harvestId} onValueChange={(v) => set("harvestId", v)} disabled={!form.projectId}>
            <SelectTrigger id="harvestId" className="w-full"><SelectValue placeholder="Select harvest" /></SelectTrigger>
            <SelectContent>
              {filteredHarvests.map((h) => (
                <SelectItem key={h.id} value={h.id}>
                  {h.cropCycle.crop.name} — {Number(h.yieldKg).toLocaleString()} kg
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Buyer name" htmlFor="buyerName" error={fieldErrors.buyerName}>
          <Input id="buyerName" value={form.buyerName} onChange={(e) => set("buyerName", e.target.value)} placeholder="Optional" />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quantity (kg)" htmlFor="quantityKg" required error={fieldErrors.quantityKg}>
            <Input id="quantityKg" type="number" step="0.1" min="0.1" value={form.quantityKg} onChange={(e) => set("quantityKg", e.target.value)} />
          </FormField>
          <FormField label="Price per kg (BDT)" htmlFor="pricePerKgBdt" required error={fieldErrors.pricePerKgBdt}>
            <Input id="pricePerKgBdt" type="number" step="0.01" min="0.01" value={form.pricePerKgBdt} onChange={(e) => set("pricePerKgBdt", e.target.value)} />
          </FormField>
        </div>

        {total > 0 && (
          <div className="rounded-lg bg-muted/40 px-4 py-2 text-sm">
            Total: <span className="font-mono font-semibold">৳{total.toLocaleString("en-BD", { minimumFractionDigits: 2 })}</span>
          </div>
        )}

        <FormField label="Sale date" htmlFor="soldAt" required error={fieldErrors.soldAt}>
          <Input id="soldAt" type="date" value={form.soldAt} onChange={(e) => set("soldAt", e.target.value)} />
        </FormField>

        <FormField label="Notes" htmlFor="notes" error={fieldErrors.notes}>
          <Textarea id="notes" value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} placeholder="Optional" />
        </FormField>
      </FormSection>

      <div className="flex justify-end pt-2">
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Record Sale
        </Button>
      </div>
    </div>
  );
}
