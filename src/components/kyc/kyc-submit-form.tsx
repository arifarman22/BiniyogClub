"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { saveDraftAction, uploadDocumentAction, deleteDocumentAction, submitKycAction } from "@/server/actions/kyc.actions";
import { Loader2, Trash2, CheckCircle2, ImageIcon, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "cn";
import type { KycRecord, KycDocumentRecord } from "@/db/repositories/kyc.repository";

interface Props {
  existing: (KycRecord & { documents: KycDocumentRecord[] }) | null;
}

const BD_DIVISIONS = ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Barisal", "Sylhet", "Rangpur", "Mymensingh"];
const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay", "SureCash"];
const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID (NID)",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving License",
};

type Side = "FRONT" | "BACK";

function getSideDoc(documents: KycDocumentRecord[], docType: string, side: Side) {
  return documents.find((d) => d.documentType === `${docType}_${side}`) ?? null;
}

function UploadSlot({
  side, label, doc, canUpload, isUploading, onUpload, onDelete,
}: {
  side: Side;
  label: string;
  doc: KycDocumentRecord | null;
  canUpload: boolean;
  isUploading: boolean;
  onUpload: (side: Side, file: File) => void;
  onDelete: (id: string) => void;
}) {
  const inputId = `doc-upload-${side.toLowerCase()}`;

  return (
    <div className="flex-1">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>

      {doc ? (
        <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">Uploaded</p>
              <p className="text-[10px] text-muted-foreground">{(doc.sizeBytes / 1024).toFixed(0)} KB · {doc.mimeType.split("/")[1].toUpperCase()}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDelete(doc.id)}
            className="ml-2 shrink-0 text-muted-foreground hover:text-destructive transition-colors"
            aria-label={`Remove ${label}`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={!canUpload || isUploading}
          onClick={() => document.getElementById(inputId)?.click()}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-8 transition-colors",
            canUpload && !isUploading
              ? "border-border hover:border-primary/50 hover:bg-muted/30 cursor-pointer"
              : "border-border/40 bg-muted/20 cursor-not-allowed opacity-50",
          )}
        >
          {isUploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-xs text-muted-foreground">
            {isUploading ? "Uploading…" : "Click to upload"}
          </span>
        </button>
      )}

      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(side, file);
          e.target.value = "";
        }}
      />
    </div>
  );
}

export function KycSubmitForm({ existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState<Side | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [kycId, setKycId] = useState<string | null>(existing?.id ?? null);
  const [documents, setDocuments] = useState<KycDocumentRecord[]>(existing?.documents ?? []);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    fullName: existing?.fullName ?? "",
    dateOfBirth: existing?.dateOfBirth
      ? new Date(existing.dateOfBirth).toISOString().split("T")[0]
      : "",
    nationality: existing?.nationality ?? "BD",
    addressLine: existing?.addressLine ?? "",
    city: existing?.city ?? "",
    district: existing?.district ?? "",
    division: existing?.division ?? "",
    postalCode: existing?.postalCode ?? "",
    documentType: existing?.documentType ?? "",
    documentNumber: existing?.documentNumber ?? "",
    bankName: existing?.bankName ?? "",
    bankAccountNumber: existing?.bankAccountNumber ?? "",
    mobileProvider: existing?.mobileProvider ?? "",
    mobileNumber: existing?.mobileNumber ?? "",
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    setSaved(false);
  }

  async function handleSaveDraft() {
    setError(null);
    startTransition(async () => {
      const result = await saveDraftAction(form);
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      } else {
        setKycId(result.data.kycId);
        setSaved(true);
      }
    });
  }

  async function handleFileUpload(side: Side, file: File) {
    if (!form.documentType) return;

    setIsUploading(side);
    setError(null);

    let resolvedKycId = kycId;
    if (!resolvedKycId) {
      const draft = await saveDraftAction(form);
      if (!draft.success) {
        setError(draft.error);
        setFieldErrors(draft.fieldErrors ?? {});
        setIsUploading(null);
        return;
      }
      resolvedKycId = draft.data.kycId;
      setKycId(resolvedKycId);
    }

    const fd = new FormData();
    fd.append("kycId", resolvedKycId);
    fd.append("documentType", form.documentType);
    fd.append("side", side);
    fd.append("file", file);

    const result = await uploadDocumentAction(fd);
    setIsUploading(null);

    if (!result.success) {
      setError(result.error);
    } else {
      setDocuments((d) => [
        ...d.filter((doc) => doc.documentType !== `${form.documentType}_${side}`),
        {
          id: result.data.documentId,
          kycId: resolvedKycId!,
          documentType: `${form.documentType}_${side}` as KycDocumentRecord["documentType"],
          storageKey: "",
          mimeType: file.type,
          sizeBytes: file.size,
          verifiedAt: null,
          createdAt: new Date(),
        },
      ]);
    }
  }

  async function handleDeleteDocument(documentId: string) {
    setError(null);
    const result = await deleteDocumentAction(documentId);
    if (!result.success) {
      setError(result.error);
    } else {
      setDocuments((d) => d.filter((doc) => doc.id !== documentId));
    }
  }

  async function handleSubmit() {
    setError(null);
    const draftResult = await saveDraftAction(form);
    if (!draftResult.success) {
      setError(draftResult.error);
      setFieldErrors(draftResult.fieldErrors ?? {});
      return;
    }
    startTransition(async () => {
      const result = await submitKycAction();
      if (!result.success) {
        setError(result.error);
      } else {
        router.push("/dashboard/kyc");
      }
    });
  }

  const canUpload = !!form.documentType;
  const frontDoc = getSideDoc(documents, form.documentType, "FRONT");
  const backDoc  = getSideDoc(documents, form.documentType, "BACK");
  const canSubmit = !!kycId && !!frontDoc && !isPending;
  const uploadedCount = [frontDoc, backDoc].filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* ── Left: form sections (2/3 width) ── */}
      <div className="lg:col-span-2 space-y-5">

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">{error}</p>
          </Alert>
        )}

        {saved && (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-sm">Draft saved successfully.</p>
          </Alert>
        )}

        {/* Personal */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Personal Information</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your legal name and date of birth as on your ID</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Full legal name" htmlFor="fullName" required error={fieldErrors.fullName}>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  placeholder="As on your ID document"
                />
              </FormField>
              <FormField label="Date of birth" htmlFor="dateOfBirth" required error={fieldErrors.dateOfBirth}>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Residential Address</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your current home address in Bangladesh</p>
          </div>
          <div className="p-6 space-y-4">
            <FormField label="Address" htmlFor="addressLine" required error={fieldErrors.addressLine}>
              <Input
                id="addressLine"
                value={form.addressLine}
                onChange={(e) => set("addressLine", e.target.value)}
                placeholder="House/flat, road, area"
              />
            </FormField>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="City" htmlFor="city" required error={fieldErrors.city}>
                <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
              </FormField>
              <FormField label="District" htmlFor="district" required error={fieldErrors.district}>
                <Input id="district" value={form.district} onChange={(e) => set("district", e.target.value)} />
              </FormField>
              <FormField label="Division" htmlFor="division" required error={fieldErrors.division}>
                <Select value={form.division} onValueChange={(v) => set("division", v)}>
                  <SelectTrigger id="division"><SelectValue placeholder="Select division" /></SelectTrigger>
                  <SelectContent>
                    {BD_DIVISIONS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Postal code" htmlFor="postalCode" error={fieldErrors.postalCode}>
                <Input
                  id="postalCode"
                  value={form.postalCode}
                  onChange={(e) => set("postalCode", e.target.value)}
                  placeholder="Optional"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Identity Document</p>
            <p className="text-xs text-muted-foreground mt-0.5">Select your document type and enter the number</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Document type" htmlFor="documentType" required error={fieldErrors.documentType}>
                <Select value={form.documentType} onValueChange={(v) => set("documentType", v)}>
                  <SelectTrigger id="documentType"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Document number" htmlFor="documentNumber" required error={fieldErrors.documentNumber}>
                <Input
                  id="documentNumber"
                  value={form.documentNumber}
                  onChange={(e) => set("documentNumber", e.target.value.toUpperCase())}
                  placeholder="e.g. 1234567890"
                  className="font-mono"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Payment */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Payment Information</p>
            <p className="text-xs text-muted-foreground mt-0.5">At least one method required for receiving returns</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Bank name" htmlFor="bankName" error={fieldErrors.bankName}>
                <Input
                  id="bankName"
                  value={form.bankName}
                  onChange={(e) => set("bankName", e.target.value)}
                  placeholder="e.g. Dutch-Bangla Bank"
                />
              </FormField>
              <FormField label="Bank account number" htmlFor="bankAccountNumber" error={fieldErrors.bankAccountNumber}>
                <Input
                  id="bankAccountNumber"
                  value={form.bankAccountNumber}
                  onChange={(e) => set("bankAccountNumber", e.target.value)}
                  placeholder="Account number"
                  className="font-mono"
                />
              </FormField>
              <FormField label="Mobile banking provider" htmlFor="mobileProvider" error={fieldErrors.mobileProvider}>
                <Select value={form.mobileProvider} onValueChange={(v) => set("mobileProvider", v)}>
                  <SelectTrigger id="mobileProvider"><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    {MOBILE_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Mobile number" htmlFor="mobileNumber" error={fieldErrors.mobileNumber}>
                <Input
                  id="mobileNumber"
                  value={form.mobileNumber}
                  onChange={(e) => set("mobileNumber", e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="font-mono"
                />
              </FormField>
            </div>
          </div>
        </div>

      </div>

      {/* ── Right: sticky upload + submit panel (1/3 width) ── */}
      <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">

        {/* Document upload card */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold">Document Photos</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              JPEG, PNG, WebP or PDF · max 5 MB each
            </p>
          </div>
          <div className="p-5 space-y-4">
            {!canUpload ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Select a document type on the left to enable uploads.
                </p>
              </div>
            ) : (
              <div className="flex gap-3">
                <UploadSlot
                  side="FRONT"
                  label="Front side"
                  doc={frontDoc}
                  canUpload={canUpload}
                  isUploading={isUploading === "FRONT"}
                  onUpload={handleFileUpload}
                  onDelete={handleDeleteDocument}
                />
                <UploadSlot
                  side="BACK"
                  label="Back side"
                  doc={backDoc}
                  canUpload={canUpload}
                  isUploading={isUploading === "BACK"}
                  onUpload={handleFileUpload}
                  onDelete={handleDeleteDocument}
                />
              </div>
            )}

            {canUpload && (
              <div className="flex items-center gap-1.5">
                <div className={cn("h-1.5 flex-1 rounded-full", frontDoc ? "bg-emerald-500" : "bg-muted")} />
                <div className={cn("h-1.5 flex-1 rounded-full", backDoc ? "bg-emerald-500" : "bg-muted")} />
                <span className="text-[10px] text-muted-foreground ml-1">{uploadedCount}/2</span>
              </div>
            )}
          </div>
        </div>

        {/* Submit card */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold">Submit Application</p>
          </div>
          <div className="p-5 space-y-3">
            <ul className="space-y-2">
              {[
                { label: "Personal info", done: !!(form.fullName && form.dateOfBirth) },
                { label: "Address", done: !!(form.addressLine && form.city && form.district && form.division) },
                { label: "Identity document", done: !!(form.documentType && form.documentNumber) },
                { label: "Front photo", done: !!frontDoc },
                { label: "Payment method", done: !!(form.bankAccountNumber || form.mobileNumber) },
              ].map(({ label, done }) => (
                <li key={label} className="flex items-center gap-2 text-xs">
                  <span className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
                    done ? "bg-emerald-500/15 text-emerald-600" : "bg-muted text-muted-foreground"
                  )}>
                    {done ? "✓" : "·"}
                  </span>
                  <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </li>
              ))}
            </ul>

            <div className="pt-1 space-y-2">
              <Button
                type="button"
                className="w-full"
                onClick={handleSubmit}
                disabled={!canSubmit}
              >
                {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4" />}
                Submit for review
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleSaveDraft}
                disabled={isPending}
              >
                {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Save draft
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Review typically takes 1–2 business days
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
