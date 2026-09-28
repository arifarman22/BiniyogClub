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
import { recordExpenseAction } from "@/server/actions/farmer.actions";
import { Loader2, Plus } from "lucide-react";
import type { getFarmerProjects } from "@/server/data/farmer.data";

const CATEGORIES = [
  "SEEDS", "FERTILIZER", "PESTICIDE", "LABOR", "EQUIPMENT",
  "IRRIGATION", "TRANSPORT", "STORAGE", "INSURANCE", "LAND_LEASE", "OTHER",
];

const CATEGORY_LABEL: Record<string, string> = {
  SEEDS: "Seeds", FERTILIZER: "Fertilizer", PESTICIDE: "Pesticide",
  LABOR: "Labor", EQUIPMENT: "Equipment", IRRIGATION: "Irrigation",
  TRANSPORT: "Transport", STORAGE: "Storage", INSURANCE: "Insurance",
  LAND_LEASE: "Land Lease", OTHER: "Other",
};

interface Props {
  projects: Awaited<ReturnType<typeof getFarmerProjects>>;
}

export function RecordExpenseDialog({ projects }: Props) {
  return (
    <FarmerDialog
      title="Record Expense"
      trigger={<Button size="sm"><Plus className="mr-1.5 h-4 w-4" /> Record Expense</Button>}
    >
      {(close) => <RecordExpenseForm projects={projects} onSuccess={close} />}
    </FarmerDialog>
  );
}

function RecordExpenseForm({ projects, onSuccess }: Props & { onSuccess: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    projectId: "", category: "", description: "",
    amountBdt: "", incurredAt: new Date().toISOString().split("T")[0],
  });

  function set(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
    setFieldErrors((e) => { const n = { ...e }; delete n[k]; return n; });
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await recordExpenseAction({
        ...form,
        amountBdt: parseFloat(form.amountBdt),
        incurredAt: new Date(form.incurredAt),
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

        <FormField label="Category" htmlFor="category" required error={fieldErrors.category}>
          <Select value={form.category} onValueChange={(v) => set("category", v)}>
            <SelectTrigger id="category" className="w-full"><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{CATEGORY_LABEL[c]}</SelectItem>)}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Description" htmlFor="description" required error={fieldErrors.description}>
          <Textarea id="description" value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What was this expense for?" rows={2} />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Amount (BDT)" htmlFor="amountBdt" required error={fieldErrors.amountBdt}>
            <Input id="amountBdt" type="number" step="0.01" min="0.01" value={form.amountBdt} onChange={(e) => set("amountBdt", e.target.value)} placeholder="0.00" />
          </FormField>
          <FormField label="Date" htmlFor="incurredAt" required error={fieldErrors.incurredAt}>
            <Input id="incurredAt" type="date" value={form.incurredAt} onChange={(e) => set("incurredAt", e.target.value)} />
          </FormField>
        </div>
      </FormSection>

      <div className="flex justify-end pt-2">
        <Button type="button" onClick={handleSubmit} disabled={isPending}>
          {isPending && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
          Record Expense
        </Button>
      </div>
    </div>
  );
}
