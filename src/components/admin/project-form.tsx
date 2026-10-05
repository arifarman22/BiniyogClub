"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { X, Plus, Pencil, Trash2, Check, Building2, Loader2 } from "lucide-react";
import { createProjectAction, updateProjectAction, uploadProjectCoverImageAction } from "@/server/actions/project.actions";
import { upsertProjectBankAccountAction, deleteProjectBankAccountAction } from "@/server/actions/project-bank.actions";

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
  returnPctMin?: number | string | null;
  returnPctMax?: number | string | null;
  durationDays: number | string;
  fundingDeadline: string;
  startDate: string | null;
  endDate: string | null;
  riskInfo: string | null;
  status?: string;
  coverImageUrl: string | null;
}>;

type BankAccount = {
  id: string; accountName: string; accountNumber: string; bankName: string;
  branchName: string | null; routingNumber: string | null; swiftCode: string | null;
  mobileNumber: string | null; email: string | null; branchAddress: string | null;
  isActive: boolean;
};
type LocalBank = { localId: string; accountName: string; accountNumber: string; bankName: string; branchName: string | null; routingNumber: string | null; swiftCode: string | null; mobileNumber: string | null; email: string | null; branchAddress: string | null; };
const BANK_EMPTY = { accountName: "", accountNumber: "", bankName: "", branchName: "", routingNumber: "", swiftCode: "", mobileNumber: "", email: "", branchAddress: "" };

type Props = {
  mode: "create" | "edit";
  projectId?: string;
  managers: Manager[];
  groups: Group[];
  defaultValues?: DefaultValues;
  initialBankAccounts?: BankAccount[];
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

export function ProjectForm({ mode, projectId, managers, groups, defaultValues = {}, initialBankAccounts = [] }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [coverImageUrl, setCoverImageUrl] = useState<string>(defaultValues.coverImageUrl ?? "");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [returnMode, setReturnMode] = useState<"fixed" | "range">(
    defaultValues.returnPctMin ? "range" : "fixed"
  );
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Bank accounts — local for create, saved for edit
  const [savedBanks, setSavedBanks] = useState<BankAccount[]>(initialBankAccounts);
  const [localBanks, setLocalBanks] = useState<LocalBank[]>([]);
  const [bankEditing, setBankEditing] = useState<string | "new" | null>(null);
  const [bankForm, setBankForm] = useState(BANK_EMPTY);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankFieldErrors, setBankFieldErrors] = useState<Record<string, string>>({});
  const [bankPending, startBankTransition] = useTransition();

  async function handleExtraImagesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setImageError(null);
    setImageUploading(true);
    const results = await Promise.all(
      files.map(async (file) => {
        const fd = new FormData();
        fd.append("file", file);
        return uploadProjectCoverImageAction(fd);
      })
    );
    setImageUploading(false);
    const failed = results.find((r) => !r.success);
    if (failed && !failed.success) { setImageError(failed.error); return; }
    const urls = results.filter((r) => r.success).map((r) => (r as { success: true; data: { url: string } }).data.url);
    if (!coverImageUrl && urls.length > 0) {
      setCoverImageUrl(urls[0]);
      setImageUrls((prev) => [...prev, ...urls.slice(1)]);
    } else {
      setImageUrls((prev) => [...prev, ...urls]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
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
      expectedReturnPct: returnMode === "fixed" ? Number(raw.expectedReturnPct) : Number(raw.returnPctMin),
      returnPctMin: returnMode === "range" ? Number(raw.returnPctMin) : null,
      returnPctMax: returnMode === "range" ? Number(raw.returnPctMax) : null,
      durationDays: Number(raw.durationDays),
      fundingDeadline: new Date(raw.fundingDeadline as string),
      startDate: raw.startDate ? new Date(raw.startDate as string) : null,
      endDate: raw.endDate ? new Date(raw.endDate as string) : null,
      riskInfo: (raw.riskInfo as string) || null,
      coverImageUrl: coverImageUrl || null,
      imageUrls: [coverImageUrl, ...imageUrls].filter(Boolean),
      groupId: (raw.groupId as string) || null,
      status: (raw.status as string) || undefined,
    };

    startTransition(async () => {
      const banks = localBanks.map(({ localId: _l, ...b }) => b);
      const result =
        mode === "create"
          ? await createProjectAction(data, banks)
          : await updateProjectAction(projectId!, data);

      if (!result.success) {
        setError(result.error);
        if (result.fieldErrors) setFieldErrors(result.fieldErrors);
        return;
      }

      router.push(mode === "create" ? `/admin/projects/${result.data.id}/edit` : `/admin/projects/${result.data.id}`);
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
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <Label>Expected Return (%) *</Label>
              <div className="flex rounded-lg border border-input overflow-hidden text-xs">
                <button type="button" onClick={() => setReturnMode("fixed")}
                  className={`px-3 py-1 transition-colors ${returnMode === "fixed" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                  Fixed
                </button>
                <button type="button" onClick={() => setReturnMode("range")}
                  className={`px-3 py-1 transition-colors ${returnMode === "range" ? "bg-primary text-primary-foreground" : "bg-background text-muted-foreground hover:bg-muted"}`}>
                  Range
                </button>
              </div>
            </div>
            {returnMode === "fixed" ? (
              <div>
                <Input name="expectedReturnPct" type="number" min="0.01" max="100" step="0.01"
                  defaultValue={String(defaultValues.expectedReturnPct ?? "")} placeholder="18.5" />
                <FieldError msg={fieldErrors.expectedReturnPct} />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <Input name="returnPctMin" type="number" min="0.01" max="100" step="0.01"
                    defaultValue={String(defaultValues.returnPctMin ?? "")} placeholder="10" />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Min %</p>
                  <FieldError msg={fieldErrors.returnPctMin} />
                </div>
                <span className="text-muted-foreground text-sm mt-[-14px]">–</span>
                <div className="flex-1">
                  <Input name="returnPctMax" type="number" min="0.01" max="100" step="0.01"
                    defaultValue={String(defaultValues.returnPctMax ?? "")} placeholder="15" />
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Max %</p>
                  <FieldError msg={fieldErrors.returnPctMax} />
                </div>
              </div>
            )}
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
          <p className="text-xs text-muted-foreground">Upload at least 3 images. The first image is the cover. All images rotate as a slider on project cards.</p>

          {/* Primary images grid */}
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {/* Existing slots */}
            {[coverImageUrl, ...imageUrls].filter(Boolean).map((url, i) => (
              <div key={url} className="relative aspect-video rounded-lg overflow-hidden border border-border group">
                <Image src={url} alt={`Image ${i + 1}`} fill className="object-cover" sizes="200px" />
                {i === 0 && (
                  <span className="absolute top-1 left-1 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-white">Cover</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (i === 0) {
                      const remaining = imageUrls.filter(Boolean);
                      setCoverImageUrl(remaining[0] ?? "");
                      setImageUrls(remaining.slice(1));
                    } else {
                      setImageUrls((prev) => prev.filter((_, j) => j !== i - 1));
                    }
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            ))}

            {/* Add slot */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageUploading}
              className="aspect-video rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-muted/30 transition-colors disabled:opacity-50"
            >
              {imageUploading
                ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                : <Plus className="h-5 w-5 text-muted-foreground" />}
              <span className="text-[10px] text-muted-foreground">{imageUploading ? "Uploading…" : "Add"}</span>
            </button>
          </div>

          {[coverImageUrl, ...imageUrls].filter(Boolean).length < 3 && (
            <p className="text-xs text-warning flex items-center gap-1">
              <span>⚠</span> Add at least {3 - [coverImageUrl, ...imageUrls].filter(Boolean).length} more image{3 - [coverImageUrl, ...imageUrls].filter(Boolean).length > 1 ? "s" : ""} for the slider.
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleExtraImagesChange}
          />
          {imageError && <p className="text-xs text-destructive">{imageError}</p>}
        </div>
      </SectionCard>

      <SectionCard title="Bank Accounts">
        <p className="-mt-3 text-xs text-muted-foreground">Investors will see these details when making payments.</p>
        {bankError && <Alert variant="destructive" className="text-sm">{bankError}</Alert>}

        {/* Saved banks (edit mode) */}
        {savedBanks.map((acc) => (
          <div key={acc.id} className="rounded-xl border border-border bg-muted/20 p-4">
            {bankEditing === acc.id ? (
              <BankForm form={bankForm} setField={(k, v) => { setBankForm((f) => ({ ...f, [k]: v })); }} fieldErrors={bankFieldErrors}
                onSave={() => { startBankTransition(async () => {
                  const r = await upsertProjectBankAccountAction(projectId!, acc.id, bankForm);
                  if (!r.success) { setBankError(r.error ?? "Failed"); setBankFieldErrors(r.fieldErrors ?? {}); return; }
                  setSavedBanks((p) => p.map((a) => a.id === acc.id ? { ...a, ...bankForm, branchName: bankForm.branchName||null, routingNumber: bankForm.routingNumber||null, swiftCode: bankForm.swiftCode||null, mobileNumber: bankForm.mobileNumber||null, email: bankForm.email||null, branchAddress: bankForm.branchAddress||null } : a));
                  setBankEditing(null);
                }); }}
                onCancel={() => setBankEditing(null)} isPending={bankPending} />
            ) : (
              <BankRow acc={acc}
                onEdit={() => { setBankForm({ accountName: acc.accountName, accountNumber: acc.accountNumber, bankName: acc.bankName, branchName: acc.branchName??"" , routingNumber: acc.routingNumber??"", swiftCode: acc.swiftCode??"", mobileNumber: acc.mobileNumber??"", email: acc.email??"", branchAddress: acc.branchAddress??"" }); setBankEditing(acc.id); setBankError(null); setBankFieldErrors({}); }}
                onDelete={() => { if (!confirm("Delete?")) return; startBankTransition(async () => { const r = await deleteProjectBankAccountAction(projectId!, acc.id); if (!r.success) { setBankError(r.error??"Failed"); return; } setSavedBanks((p) => p.filter((a) => a.id !== acc.id)); }); }} />
            )}
          </div>
        ))}

        {/* Local banks (create mode) */}
        {localBanks.map((acc) => (
          <div key={acc.localId} className="rounded-xl border border-border bg-muted/20 p-4">
            {bankEditing === acc.localId ? (
              <BankForm form={bankForm} setField={(k, v) => { setBankForm((f) => ({ ...f, [k]: v })); }} fieldErrors={bankFieldErrors}
                onSave={() => {
                  if (!bankForm.bankName || !bankForm.accountName || !bankForm.accountNumber) { setBankFieldErrors({ ...(!bankForm.bankName&&{bankName:"Required"}), ...(!bankForm.accountName&&{accountName:"Required"}), ...(!bankForm.accountNumber&&{accountNumber:"Required"}) }); return; }
                  setLocalBanks((p) => p.map((a) => a.localId === acc.localId ? { ...a, ...bankForm, branchName: bankForm.branchName||null, routingNumber: bankForm.routingNumber||null, swiftCode: bankForm.swiftCode||null, mobileNumber: bankForm.mobileNumber||null, email: bankForm.email||null, branchAddress: bankForm.branchAddress||null } : a));
                  setBankEditing(null);
                }}
                onCancel={() => setBankEditing(null)} isPending={false} />
            ) : (
              <BankRow acc={{ ...acc, id: acc.localId, isActive: true }}
                onEdit={() => { setBankForm({ accountName: acc.accountName, accountNumber: acc.accountNumber, bankName: acc.bankName, branchName: acc.branchName??"", routingNumber: acc.routingNumber??"", swiftCode: acc.swiftCode??"", mobileNumber: acc.mobileNumber??"", email: acc.email??"", branchAddress: acc.branchAddress??"" }); setBankEditing(acc.localId); setBankError(null); setBankFieldErrors({}); }}
                onDelete={() => setLocalBanks((p) => p.filter((a) => a.localId !== acc.localId))} />
            )}
          </div>
        ))}

        {bankEditing === "new" ? (
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-4">New Bank Account</p>
            <BankForm form={bankForm} setField={(k, v) => { setBankForm((f) => ({ ...f, [k]: v })); setBankFieldErrors((e) => { const n={...e}; delete n[k]; return n; }); }} fieldErrors={bankFieldErrors}
              onSave={() => {
                if (!bankForm.bankName || !bankForm.accountName || !bankForm.accountNumber) { setBankFieldErrors({ ...(!bankForm.bankName&&{bankName:"Required"}), ...(!bankForm.accountName&&{accountName:"Required"}), ...(!bankForm.accountNumber&&{accountNumber:"Required"}) }); return; }
                if (mode === "edit" && projectId) {
                  startBankTransition(async () => {
                    const r = await upsertProjectBankAccountAction(projectId, null, bankForm);
                    if (!r.success) { setBankError(r.error??"Failed"); setBankFieldErrors(r.fieldErrors??{}); return; }
                    setSavedBanks((p) => [...p, { id: r.data.id, ...bankForm, isActive: true, branchName: bankForm.branchName||null, routingNumber: bankForm.routingNumber||null, swiftCode: bankForm.swiftCode||null, mobileNumber: bankForm.mobileNumber||null, email: bankForm.email||null, branchAddress: bankForm.branchAddress||null }]);
                    setBankEditing(null);
                  });
                } else {
                  setLocalBanks((p) => [...p, { localId: crypto.randomUUID(), ...bankForm, branchName: bankForm.branchName||null, routingNumber: bankForm.routingNumber||null, swiftCode: bankForm.swiftCode||null, mobileNumber: bankForm.mobileNumber||null, email: bankForm.email||null, branchAddress: bankForm.branchAddress||null }]);
                  setBankEditing(null);
                }
              }}
              onCancel={() => setBankEditing(null)} isPending={bankPending} />
          </div>
        ) : (
          <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => { setBankForm(BANK_EMPTY); setBankEditing("new"); setBankError(null); setBankFieldErrors({}); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Bank Account
          </Button>
        )}
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

function BankRow({ acc, onEdit, onDelete }: { acc: BankAccount; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="font-semibold text-sm">{acc.bankName}</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-xs text-muted-foreground mt-2">
          <span>Account Name</span><span className="text-foreground font-medium">{acc.accountName}</span>
          <span>Account No.</span><span className="text-foreground font-mono">{acc.accountNumber}</span>
          {acc.branchName && <><span>Branch</span><span className="text-foreground">{acc.branchName}</span></>}
          {acc.routingNumber && <><span>Routing</span><span className="text-foreground font-mono">{acc.routingNumber}</span></>}
          {acc.swiftCode && <><span>SWIFT</span><span className="text-foreground font-mono">{acc.swiftCode}</span></>}
          {acc.mobileNumber && <><span>Mobile</span><span className="text-foreground font-mono">{acc.mobileNumber}</span></>}
          {acc.email && <><span>Email</span><span className="text-foreground">{acc.email}</span></>}
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button size="sm" variant="ghost" type="button" onClick={onEdit} className="h-7 w-7 p-0"><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" type="button" onClick={onDelete} className="h-7 w-7 p-0 text-destructive hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}

function BankForm({ form, setField, fieldErrors, onSave, onCancel, isPending }: {
  form: typeof BANK_EMPTY;
  setField: (k: keyof typeof BANK_EMPTY, v: string) => void;
  fieldErrors: Record<string, string>;
  onSave: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  const inp = "mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const f = (name: keyof typeof BANK_EMPTY, label: string, required = false, mono = false) => (
    <div>
      <Label htmlFor={`bf-${name}`}>{label}{required && " *"}</Label>
      <input id={`bf-${name}`} value={form[name]} onChange={(e) => setField(name, e.target.value)} className={`${inp}${mono ? " font-mono" : ""}`} />
      {fieldErrors[name] && <p className="mt-0.5 text-xs text-destructive">{fieldErrors[name]}</p>}
    </div>
  );
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {f("bankName", "Bank Name", true)}
        {f("accountName", "Account Name", true)}
        {f("accountNumber", "Account Number", true, true)}
        {f("branchName", "Branch Name")}
        {f("routingNumber", "Routing Number", false, true)}
        {f("swiftCode", "SWIFT Code", false, true)}
        {f("mobileNumber", "Mobile Number", false, true)}
        {f("email", "Email")}
      </div>
      {f("branchAddress", "Branch Address")}
      <div className="flex gap-2 pt-1">
        <Button type="button" size="sm" onClick={onSave} disabled={isPending}>
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />} Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel} disabled={isPending}>
          <X className="h-3.5 w-3.5 mr-1" /> Cancel
        </Button>
      </div>
    </div>
  );
}
