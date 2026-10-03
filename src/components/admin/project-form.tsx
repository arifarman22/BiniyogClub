"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Upload, X, ImageIcon } from "lucide-react";
import { createProjectAction, updateProjectAction, uploadProjectCoverImageAction } from "@/server/actions/project.actions";

type Manager = { id: string; name: string; role: string };
type Group = { id: string; name: string; slug: string };

type DefaultValues = Partial<{
  title: string;
  category: string;
  description: string;
  location: string;
  managerId: string | null;
  groupId: string | null;
  fundingGoalBdt: number | string;
  fundingMinBdt: number | string;
  minInvestmentBdt: number | string;
  maxInvestmentBdt: number | string | null;
  returnType: string;
  expectedReturnPct: number | string;
  durationDays: number | string;
  fundingDeadline: string;
  startDate: string | null;
  endDate: string | null;
  riskInfo: string | null;
  status?: string;
  coverImageUrl: string | null;
}>;

type Props = {
  mode: "create" | "edit";
  projectId?: string;
  managers: Manager[];
  groups: Group[];
  defaultValues?: DefaultValues;
};

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE:    "Real Estate",
  TRADE_FINANCE:  "Trade Finance",
  SME:            "SME",
  TECHNOLOGY:     "Technology",
  INFRASTRUCTURE: "Infrastructure",
  OTHER:          "Other",
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT:            "Draft",
  PENDING_APPROVAL: "Pending Approval",
  APPROVED:         "Approved",
  FUNDRAISING:      "Fundraising",
  FUNDED:           "Funded",
  ACTIVE:           "Active",
  COMPLETED:        "Completed",
  CANCELLED:        "Cancelled",
};

const RETURN_LABELS: Record<string, string> = {
  FIXED_RETURN: "Fixed Return",
  PROFIT_SHARE: "Profit Share",
  HYBRID:       "Hybrid",
};

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="mt-1 text-xs text-destructive">{msg}</p>;
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-5">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      {children}
    </div>
  );
}

export function ProjectForm({ mode, projectId, managers, groups, defaultValues = {} }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [coverImageUrl, setCoverImageUrl] = useState<string>(defaultValues.coverImageUrl ?? "");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageError(null);
    setImageUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadProjectCoverImageAction(fd);
    setImageUploading(false);
    if (!result.success) { setImageError(result.error); return; }
    setCoverImageUrl(result.data.url);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const fd = new FormData(e.currentTarget);
    const raw = Object.fromEntries(fd.entries());

    const data = {
      title: raw.title as string,
      category: raw.category as string,
      description: raw.description as string,
      location: raw.location as string,
      managerId: (raw.managerId as string) || null,
      fundingGoalBdt: Number(raw.fundingGoalBdt),
      fundingMinBdt: Number(raw.fundingMinBdt),
      minInvestmentBdt: Number(raw.minInvestmentBdt),
      maxInvestmentBdt: raw.maxInvestmentBdt ? Number(raw.maxInvestmentBdt) : null,
      returnType: raw.returnType as string,
      expectedReturnPct: Number(raw.expectedReturnPct),
      durationDays: Number(raw.durationDays),
      fundingDeadline: new Date(raw.fundingDeadline as string),
      startDate: raw.startDate ? new Date(raw.startDate as string) : null,
      endDate: raw.endDate ? new Date(raw.endDate as string) : null,
      riskInfo: (raw.riskInfo as string) || null,
      coverImageUrl: coverImageUrl || null,
      imageUrls: [],
      groupId: (raw.groupId as string) || null,
      status: (raw.status as string) || undefined,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createProjectAction(data)
          : await updateProjectAction(projectId!, data);

      if (!result.success) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      router.push(`/admin/projects/${result.data.id}`);
    });
  }

  const sel = "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="destructive" className="text-sm">{error}</Alert>}

      <SectionCard title="Basic Information">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">Project Title *</Label>
            <Input id="title" name="title" defaultValue={defaultValues.title} placeholder="e.g. Dhaka Commercial Tower Phase 1" className="mt-1.5" />
            <FieldError msg={fieldErrors.title} />
          </div>
          <div>
            <Label htmlFor="category">Category *</Label>
            <select name="category" id="category" defaultValue={defaultValues.category} className={`mt-1.5 ${sel}`}>
              <option value="">Select category</option>
              {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <FieldError msg={fieldErrors.category} />
          </div>
          <div>
            <Label htmlFor="location">Location *</Label>
            <Input id="location" name="location" defaultValue={defaultValues.location ?? ""} placeholder="e.g. Dhaka, Bangladesh" className="mt-1.5" />
            <FieldError msg={fieldErrors.location} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="description">Description * <span className="font-normal text-muted-foreground">(min 50 chars)</span></Label>
            <Textarea id="description" name="description" defaultValue={defaultValues.description} rows={6} placeholder="Describe the project, investment structure, expected outcomes..." className="mt-1.5 resize-none" />
            <FieldError msg={fieldErrors.description} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="riskInfo">Risk Information</Label>
            <Textarea id="riskInfo" name="riskInfo" defaultValue={defaultValues.riskInfo ?? ""} rows={3} placeholder="Describe key risks..." className="mt-1.5 resize-none" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Management">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <Label htmlFor="managerId">Project Manager</Label>
            <select name="managerId" id="managerId" defaultValue={defaultValues.managerId ?? ""} className={`mt-1.5 ${sel}`}>
              <option value="">Unassigned</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.role.replace(/_/g, " ")})</option>)}
            </select>
          </div>
          <div>
            <Label htmlFor="groupId">Business Group</Label>
            <select name="groupId" id="groupId" defaultValue={defaultValues.groupId ?? ""} className={`mt-1.5 ${sel}`}>
              <option value="">No group</option>
              {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          {mode === "edit" && (
            <div>
              <Label htmlFor="status">Lifecycle Status</Label>
              <select name="status" id="status" defaultValue={defaultValues.status ?? ""} className={`mt-1.5 ${sel}`}>
                <option value="">— No change —</option>
                {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Financial Terms">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Label htmlFor="fundingGoalBdt">Funding Goal (BDT) *</Label>
            <Input id="fundingGoalBdt" name="fundingGoalBdt" type="number" min="1" step="1" defaultValue={String(defaultValues.fundingGoalBdt ?? "")} placeholder="5000000" className="mt-1.5" />
            <FieldError msg={fieldErrors.fundingGoalBdt} />
          </div>
          <div>
            <Label htmlFor="fundingMinBdt">Minimum Funding (BDT) *</Label>
            <Input id="fundingMinBdt" name="fundingMinBdt" type="number" min="1" step="1" defaultValue={String(defaultValues.fundingMinBdt ?? "")} placeholder="3000000" className="mt-1.5" />
            <FieldError msg={fieldErrors.fundingMinBdt} />
          </div>
          <div>
            <Label htmlFor="minInvestmentBdt">Min Investment (BDT) *</Label>
            <Input id="minInvestmentBdt" name="minInvestmentBdt" type="number" min="1" step="1" defaultValue={String(defaultValues.minInvestmentBdt ?? "")} placeholder="5000" className="mt-1.5" />
            <FieldError msg={fieldErrors.minInvestmentBdt} />
          </div>
          <div>
            <Label htmlFor="maxInvestmentBdt">Max Investment (BDT)</Label>
            <Input id="maxInvestmentBdt" name="maxInvestmentBdt" type="number" min="1" step="1" defaultValue={String(defaultValues.maxInvestmentBdt ?? "")} placeholder="Optional" className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="returnType">Return Type *</Label>
            <select name="returnType" id="returnType" defaultValue={defaultValues.returnType} className={`mt-1.5 ${sel}`}>
              <option value="">Select type</option>
              {Object.entries(RETURN_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <FieldError msg={fieldErrors.returnType} />
          </div>
          <div>
            <Label htmlFor="expectedReturnPct">Expected Return (%) *</Label>
            <Input id="expectedReturnPct" name="expectedReturnPct" type="number" min="0.01" max="100" step="0.01" defaultValue={String(defaultValues.expectedReturnPct ?? "")} placeholder="18.5" className="mt-1.5" />
            <FieldError msg={fieldErrors.expectedReturnPct} />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Timeline">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="durationDays">Duration (days) *</Label>
            <Input id="durationDays" name="durationDays" type="number" min="1" max="3650" defaultValue={String(defaultValues.durationDays ?? "")} placeholder="365" className="mt-1.5" />
            <FieldError msg={fieldErrors.durationDays} />
          </div>
          <div>
            <Label htmlFor="fundingDeadline">Funding Deadline *</Label>
            <Input id="fundingDeadline" name="fundingDeadline" type="date" defaultValue={defaultValues.fundingDeadline} className="mt-1.5" />
            <FieldError msg={fieldErrors.fundingDeadline} />
          </div>
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input id="startDate" name="startDate" type="date" defaultValue={defaultValues.startDate ?? ""} className="mt-1.5" />
          </div>
          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input id="endDate" name="endDate" type="date" defaultValue={defaultValues.endDate ?? ""} className="mt-1.5" />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Media">
        <div className="space-y-3">
          <Label>Cover Image</Label>
          {coverImageUrl ? (
            <div className="relative w-full max-w-sm">
              <Image
                src={coverImageUrl}
                alt="Cover preview"
                width={400}
                height={225}
                className="rounded-lg border border-border object-cover w-full h-auto"
              />
              <button
                type="button"
                onClick={() => { setCoverImageUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="absolute top-2 right-2 rounded-full bg-background/80 p-1 hover:bg-background border border-border"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="flex w-full max-w-sm flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 py-10 text-sm text-muted-foreground hover:border-primary/50 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              {imageUploading ? (
                <span className="animate-pulse">Uploading…</span>
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 opacity-40" />
                  <span>Click to upload cover image</span>
                  <span className="text-xs opacity-60">JPEG, PNG, WebP · max 5 MB</span>
                </>
              )}
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
          {!coverImageUrl && (
            <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}>
              <Upload className="mr-2 h-4 w-4" /> {imageUploading ? "Uploading…" : "Upload Image"}
            </Button>
          )}
          {imageError && <p className="text-xs text-destructive">{imageError}</p>}
          <FieldError msg={fieldErrors.coverImageUrl} />
        </div>
      </SectionCard>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : mode === "create" ? "Create Project" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
