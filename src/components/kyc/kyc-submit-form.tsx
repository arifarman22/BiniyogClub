"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField, FormSection } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { saveDraftAction, uploadDocumentAction, deleteDocumentAction, submitKycAction } from "@/server/actions/kyc.actions";
import { Loader2, Trash2, Upload, CheckCircle2, FileText } from "lucide-react";
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

export function KycSubmitForm({ existing }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
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

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !kycId || !form.documentType) return;

    setIsUploading(true);
    setError(null);

    const fd = new FormData();
    fd.append("kycId", kycId);
    fd.append("documentType", form.documentType);
    fd.append("file", file);

    const result = await uploadDocumentAction(fd);
    setIsUploading(false);

    if (!result.success) {
      setError(result.error);
    } else {
      // Refresh documents list by re-fetching via router refresh
      router.refresh();
      // Optimistically add placeholder
      setDocuments((d) => [
        ...d,
        {
          id: result.data.documentId,
          kycId: kycId,
          documentType: form.documentType as KycDocumentRecord["documentType"],
          storageKey: "",
          mimeType: file.type,
          sizeBytes: file.size,
          verifiedAt: null,
          createdAt: new Date(),
        },
      ]);
    }

    // Reset file input
    e.target.value = "";
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

    // Save draft first to persist latest form state
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

  const canUpload = !!kycId && !!form.documentType;
  const canSubmit = !!kycId && documents.length > 0 && !isPending;

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <p className="text-sm">{error}</p>
        </Alert>
      )}

      {saved && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <p className="text-sm">Draft saved.</p>
        </Alert>
      )}

      {/* ── Personal Information ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <FormSection title="Personal Information">
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
        </FormSection>
      </div>

      {/* ── Address ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <FormSection title="Residential Address">
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
              <Input
                id="city"
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
              />
            </FormField>

            <FormField label="District" htmlFor="district" required error={fieldErrors.district}>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => set("district", e.target.value)}
              />
            </FormField>

            <FormField label="Division" htmlFor="division" required error={fieldErrors.division}>
              <Select value={form.division} onValueChange={(v) => set("division", v)}>
                <SelectTrigger id="division">
                  <SelectValue placeholder="Select division" />
                </SelectTrigger>
                <SelectContent>
                  {BD_DIVISIONS.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
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
        </FormSection>
      </div>

      {/* ── Identity Document ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <FormSection title="Identity Document">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Document type" htmlFor="documentType" required error={fieldErrors.documentType}>
              <Select value={form.documentType} onValueChange={(v) => set("documentType", v)}>
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
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

          {/* File upload */}
          <div className="mt-2 space-y-3">
            <p className="text-sm font-medium">
              Document files
              <span className="ml-0.5 text-destructive" aria-hidden>*</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Upload front and back of your document. JPEG, PNG, WebP, or PDF · max 5 MB each.
            </p>

            {documents.length > 0 && (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-sm">
                        {DOC_LABELS[doc.documentType] ?? doc.documentType}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(doc.sizeBytes / 1024).toFixed(0)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove document"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!canUpload || isUploading}
                onClick={() => document.getElementById("doc-upload")?.click()}
              >
                {isUploading ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1.5 h-4 w-4" />
                )}
                Upload file
              </Button>
              {!canUpload && (
                <p className="text-xs text-muted-foreground">
                  {!kycId ? "Save draft first" : "Select a document type first"}
                </p>
              )}
            </div>

            <input
              id="doc-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </FormSection>
      </div>

      {/* ── Bank / MFS ── */}
      <div className="rounded-xl border border-border bg-card p-6">
        <FormSection
          title="Payment Information"
          description="Provide at least one method for receiving returns and withdrawals"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Bank name" htmlFor="bankName" error={fieldErrors.bankName}>
              <Input
                id="bankName"
                value={form.bankName}
                onChange={(e) => set("bankName", e.target.value)}
                placeholder="e.g. Dutch-Bangla Bank"
              />
            </FormField>

            <FormField
              label="Bank account number"
              htmlFor="bankAccountNumber"
              error={fieldErrors.bankAccountNumber}
            >
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
                <SelectTrigger id="mobileProvider">
                  <SelectValue placeholder="Select provider" />
                </SelectTrigger>
                <SelectContent>
                  {MOBILE_PROVIDERS.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
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
        </FormSection>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Save draft
        </Button>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
          Submit for review
        </Button>
      </div>
    </div>
  );
}
