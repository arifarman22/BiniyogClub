"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { saveDraftAction, uploadDocumentAction, deleteDocumentAction, submitKycAction } from "@/server/actions/kyc.actions";
import { Loader2, Trash2, CheckCircle2, ImageIcon, ShieldCheck, AlertCircle, Lock } from "lucide-react";
import { cn } from "cn";
import type { KycRecord, KycDocumentRecord } from "@/db/repositories/kyc.repository";
import { BdAddressSelector } from "@/components/kyc/bd-address-selector";

interface Prefill {
  name: string;
  phone: string;
  nationalId: string;
  nomineeNationalId: string;
  nomineeRelation: string;
}

interface Props {
  existing: (KycRecord & { documents: KycDocumentRecord[] }) | null;
  prefill: Prefill;
}

const MOBILE_PROVIDERS = ["bKash", "Nagad", "Rocket", "Upay", "SureCash"];
const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID (NID)",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving License",
};

type Side = "FRONT" | "BACK";
type DocGroup = "INVESTOR" | "NOMINEE";

function getSideDoc(documents: KycDocumentRecord[], docType: string, side: Side) {
  return documents.find((d) => d.documentType === `${docType}_${side}`) ?? null;
}

function UploadSlot({
  inputId, side, label, doc, canUpload, isUploading, onUpload, onDelete,
}: {
  inputId: string;
  side: Side;
  label: string;
  doc: KycDocumentRecord | null;
  canUpload: boolean;
  isUploading: boolean;
  onUpload: (side: Side, file: File) => void;
  onDelete: (id: string) => void;
}) {
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

export function KycSubmitForm({ existing, prefill }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState<`${DocGroup}_${Side}` | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [kycId, setKycId] = useState<string | null>(existing?.id ?? null);
  const [documents, setDocuments] = useState<KycDocumentRecord[]>(existing?.documents ?? []);
  const [saved, setSaved] = useState(false);

  type AddrBlock = { address: string; division: string; district: string; upazila: string; postOffice: string; postalCode: string; };
  const emptyAddr: AddrBlock = { address: "", division: "", district: "", upazila: "", postOffice: "", postalCode: "" };

  const [presentAddr, setPresentAddr] = useState<AddrBlock>({
    address:    existing?.presentAddress    ?? existing?.addressLine ?? "",
    division:   existing?.presentDivision   ?? "",
    district:   existing?.presentDistrict   ?? "",
    upazila:    existing?.presentUpazila    ?? "",
    postOffice: existing?.presentPostOffice ?? "",
    postalCode: existing?.presentPostalCode ?? existing?.postalCode ?? "",
  });
  const [permanentAddr, setPermanentAddr] = useState<AddrBlock>({
    address:    existing?.permanentAddress    ?? "",
    division:   existing?.permanentDivision   ?? "",
    district:   existing?.permanentDistrict   ?? "",
    upazila:    existing?.permanentUpazila    ?? "",
    postOffice: existing?.permanentPostOffice ?? "",
    postalCode: existing?.permanentPostalCode ?? "",
  });
  const [sameAsPresent, setSameAsPresent] = useState(
    !!(existing?.permanentAddress && existing.permanentAddress === existing.presentAddress)
  );

  const [form, setForm] = useState({
    fullName: existing?.fullName ?? prefill.name,
    dateOfBirth: existing?.dateOfBirth
      ? new Date(existing.dateOfBirth).toISOString().split("T")[0]
      : "",
    nationality: existing?.nationality ?? "BD",
    addressLine: existing?.addressLine ?? "",
    city: existing?.city ?? "",
    district: existing?.district ?? "",
    division: existing?.division ?? "",
    postalCode: existing?.postalCode ?? "",
    documentType: (existing?.documentType ?? "") as string,
    documentNumber: existing?.documentNumber ?? prefill.nationalId,
    bankName: existing?.bankName ?? "",
    bankAccountNumber: existing?.bankAccountNumber ?? "",
    mobileProvider: existing?.mobileProvider ?? "",
    mobileNumber: existing?.mobileNumber ?? prefill.phone,
  });

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setFieldErrors((e) => { const n = { ...e }; delete n[field]; return n; });
    setSaved(false);
  }

  // Strip empty strings so partial draft schema doesn't fail enum/min checks
  function draftPayload(extra: Record<string, unknown> = {}) {
    const base = { ...form, ...extra };
    return Object.fromEntries(
      Object.entries(base).filter(([, v]) => v !== "" && v !== null && v !== undefined)
    );
  }

  async function handleSaveDraft() {
    setError(null);
    const effPermanent = sameAsPresent ? presentAddr : permanentAddr;
    startTransition(async () => {
      const result = await saveDraftAction(draftPayload({
        addressLine:        presentAddr.address,
        division:           presentAddr.division,
        district:           presentAddr.district,
        postalCode:         presentAddr.postalCode,
        presentAddress:     presentAddr.address,
        presentDivision:    presentAddr.division,
        presentDistrict:    presentAddr.district,
        presentUpazila:     presentAddr.upazila,
        presentPostOffice:  presentAddr.postOffice,
        presentPostalCode:  presentAddr.postalCode,
        permanentAddress:   effPermanent.address,
        permanentDivision:  effPermanent.division,
        permanentDistrict:  effPermanent.district,
        permanentUpazila:   effPermanent.upazila,
        permanentPostOffice: effPermanent.postOffice,
        permanentPostalCode: effPermanent.postalCode,
      }));
      if (!result.success) {
        setError(result.error);
        setFieldErrors(result.fieldErrors ?? {});
      } else {
        setKycId(result.data.kycId);
        setSaved(true);
      }
    });
  }

  async function handleFileUpload(group: DocGroup, side: Side, file: File) {
    const docType = group === "NOMINEE" ? "NOMINEE_NID" : form.documentType;
    if (group === "INVESTOR" && !form.documentType) return;

    setIsUploading(`${group}_${side}`);
    setError(null);

    let resolvedKycId = kycId;
    if (!resolvedKycId) {
      const effPermanent = sameAsPresent ? presentAddr : permanentAddr;
      const draft = await saveDraftAction(draftPayload({
        addressLine: presentAddr.address,
        division: presentAddr.division,
        district: presentAddr.district,
        postalCode: presentAddr.postalCode,
        presentAddress: presentAddr.address,
        presentDivision: presentAddr.division,
        presentDistrict: presentAddr.district,
        presentUpazila: presentAddr.upazila,
        presentPostOffice: presentAddr.postOffice,
        presentPostalCode: presentAddr.postalCode,
        permanentAddress: effPermanent.address,
        permanentDivision: effPermanent.division,
        permanentDistrict: effPermanent.district,
        permanentUpazila: effPermanent.upazila,
        permanentPostOffice: effPermanent.postOffice,
        permanentPostalCode: effPermanent.postalCode,
      }));
      if (!draft.success) {
        setError(draft.error);
        setFieldErrors(draft.fieldErrors ?? {});
        setIsUploading(null);
        return;
      }
      resolvedKycId = draft.data.kycId;
      setKycId(resolvedKycId ?? null);
    }

    const fd = new FormData();
    fd.append("kycId", resolvedKycId ?? "");
    fd.append("documentType", docType);
    fd.append("side", side);
    fd.append("file", file);

    const result = await uploadDocumentAction(fd);
    setIsUploading(null);

    if (!result.success) {
      setError(result.error);
    } else {
      setDocuments((d) => [
        ...d.filter((doc) => doc.documentType !== `${docType}_${side}`),
        {
          id: result.data.documentId,
          kycId: resolvedKycId!,
          documentType: `${docType}_${side}` as KycDocumentRecord["documentType"],
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
    const effPermanent = sameAsPresent ? presentAddr : permanentAddr;
    const draftResult = await saveDraftAction(draftPayload({
      addressLine: presentAddr.address,
      division: presentAddr.division,
      district: presentAddr.district,
      postalCode: presentAddr.postalCode,
      presentAddress: presentAddr.address,
      presentDivision: presentAddr.division,
      presentDistrict: presentAddr.district,
      presentUpazila: presentAddr.upazila,
      presentPostOffice: presentAddr.postOffice,
      presentPostalCode: presentAddr.postalCode,
      permanentAddress: effPermanent.address,
      permanentDivision: effPermanent.division,
      permanentDistrict: effPermanent.district,
      permanentUpazila: effPermanent.upazila,
      permanentPostOffice: effPermanent.postOffice,
      permanentPostalCode: effPermanent.postalCode,
    }));
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

  const canUploadInvestor = !!form.documentType;
  const frontDoc     = getSideDoc(documents, form.documentType, "FRONT");
  const backDoc      = getSideDoc(documents, form.documentType, "BACK");
  const nomFrontDoc  = getSideDoc(documents, "NOMINEE_NID", "FRONT");
  const nomBackDoc   = getSideDoc(documents, "NOMINEE_NID", "BACK");
  const canSubmit    = !!kycId && !!frontDoc && !!nomFrontDoc && !isPending;
  const uploadedCount = [frontDoc, backDoc, nomFrontDoc, nomBackDoc].filter(Boolean).length;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

      {/* ── Left: form sections ── */}
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

        {/* Personal — pre-filled, read-only */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Personal Information</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-filled from your registration — edit if needed</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Full legal name" htmlFor="fullName" required error={fieldErrors.fullName}>
                <div className="relative">
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="As on your ID document"
                  />
                  {prefill.name && form.fullName === prefill.name && (
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
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
            <p className="text-sm font-semibold">Address</p>
            <p className="text-xs text-muted-foreground mt-0.5">Your present and permanent address in Bangladesh</p>
          </div>
          <div className="p-6 space-y-8">
            <BdAddressSelector
              prefix="present"
              label="Present Address"
              value={presentAddr}
              onChange={setPresentAddr}
              fieldErrors={fieldErrors}
            />

            <div className="border-t border-border pt-6 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsPresent}
                  onChange={(e) => {
                    setSameAsPresent(e.target.checked);
                    if (e.target.checked) setPermanentAddr(presentAddr);
                  }}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="text-sm font-medium">Permanent address is same as present address</span>
              </label>

              <BdAddressSelector
                prefix="permanent"
                label="Permanent Address"
                value={sameAsPresent ? presentAddr : permanentAddr}
                onChange={setPermanentAddr}
                fieldErrors={fieldErrors}
                disabled={sameAsPresent}
              />
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
                <Select value={form.documentType || ""} onValueChange={(v) => set("documentType", v ?? "")}>
                  <SelectTrigger id="documentType"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(DOC_LABELS).map(([v, l]) => (
                      <SelectItem key={v} value={v}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Document number" htmlFor="documentNumber" required error={fieldErrors.documentNumber}>
                <div className="relative">
                  <Input
                    id="documentNumber"
                    value={form.documentNumber}
                    onChange={(e) => set("documentNumber", e.target.value.toUpperCase())}
                    placeholder="e.g. 1234567890"
                    className="font-mono"
                  />
                  {prefill.nationalId && form.documentNumber === prefill.nationalId && (
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
              </FormField>
            </div>
          </div>
        </div>

        {/* Nominee info — read-only from registration */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-6 py-4">
            <p className="text-sm font-semibold">Nominee Information</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pre-filled from your registration</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label="Nominee NID Number" htmlFor="nomineeNid">
                <div className="relative">
                  <Input
                    id="nomineeNid"
                    value={prefill.nomineeNationalId}
                    readOnly
                    className="font-mono bg-muted/40 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
              </FormField>
              <FormField label="Relation with Nominee" htmlFor="nomineeRelation">
                <div className="relative">
                  <Input
                    id="nomineeRelation"
                    value={prefill.nomineeRelation}
                    readOnly
                    className="bg-muted/40 cursor-not-allowed"
                  />
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
              </FormField>
            </div>
            {(!prefill.nomineeNationalId || !prefill.nomineeRelation) && (
              <p className="mt-3 text-xs text-warning flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                Some nominee details are missing. Please update your profile first.
              </p>
            )}
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
                <Select value={form.mobileProvider || ""} onValueChange={(v) => set("mobileProvider", v ?? "")}>
                  <SelectTrigger id="mobileProvider"><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    {MOBILE_PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField label="Mobile number" htmlFor="mobileNumber" error={fieldErrors.mobileNumber}>
                <div className="relative">
                  <Input
                    id="mobileNumber"
                    value={form.mobileNumber}
                    onChange={(e) => set("mobileNumber", e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="font-mono"
                  />
                  {prefill.phone && form.mobileNumber === prefill.phone && (
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
                  )}
                </div>
              </FormField>
            </div>
          </div>
        </div>

      </div>

      {/* ── Right: sticky upload + submit panel ── */}
      <div className="space-y-5 lg:sticky lg:top-6 lg:self-start">

        {/* Investor document upload */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold">Your ID Photos</p>
            <p className="text-xs text-muted-foreground mt-0.5">JPEG, PNG, WebP or PDF · max 5 MB each</p>
          </div>
          <div className="p-5 space-y-4">
            {!canUploadInvestor ? (
              <div className="flex items-start gap-2.5 rounded-lg bg-muted/50 p-3">
                <AlertCircle className="h-4 w-4 shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">Select a document type on the left to enable uploads.</p>
              </div>
            ) : (
              <div className="flex gap-3">
                <UploadSlot
                  inputId="investor-front"
                  side="FRONT"
                  label="Front side"
                  doc={frontDoc}
                  canUpload={canUploadInvestor}
                  isUploading={isUploading === "INVESTOR_FRONT"}
                  onUpload={(side, file) => handleFileUpload("INVESTOR", side, file)}
                  onDelete={handleDeleteDocument}
                />
                <UploadSlot
                  inputId="investor-back"
                  side="BACK"
                  label="Back side"
                  doc={backDoc}
                  canUpload={canUploadInvestor}
                  isUploading={isUploading === "INVESTOR_BACK"}
                  onUpload={(side, file) => handleFileUpload("INVESTOR", side, file)}
                  onDelete={handleDeleteDocument}
                />
              </div>
            )}
            {canUploadInvestor && (
              <div className="flex items-center gap-1.5">
                <div className={cn("h-1.5 flex-1 rounded-full", frontDoc ? "bg-emerald-500" : "bg-muted")} />
                <div className={cn("h-1.5 flex-1 rounded-full", backDoc ? "bg-emerald-500" : "bg-muted")} />
                <span className="text-[10px] text-muted-foreground ml-1">{[frontDoc, backDoc].filter(Boolean).length}/2</span>
              </div>
            )}
          </div>
        </div>

        {/* Nominee NID upload */}
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <p className="text-sm font-semibold">Nominee&apos;s NID Photos</p>
            <p className="text-xs text-muted-foreground mt-0.5">Upload front &amp; back of nominee&apos;s National ID</p>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex gap-3">
              <UploadSlot
                inputId="nominee-front"
                side="FRONT"
                label="Front side"
                doc={nomFrontDoc}
                canUpload={true}
                isUploading={isUploading === "NOMINEE_FRONT"}
                onUpload={(side, file) => handleFileUpload("NOMINEE", side, file)}
                onDelete={handleDeleteDocument}
              />
              <UploadSlot
                inputId="nominee-back"
                side="BACK"
                label="Back side"
                doc={nomBackDoc}
                canUpload={true}
                isUploading={isUploading === "NOMINEE_BACK"}
                onUpload={(side, file) => handleFileUpload("NOMINEE", side, file)}
                onDelete={handleDeleteDocument}
              />
            </div>
            <div className="flex items-center gap-1.5">
              <div className={cn("h-1.5 flex-1 rounded-full", nomFrontDoc ? "bg-emerald-500" : "bg-muted")} />
              <div className={cn("h-1.5 flex-1 rounded-full", nomBackDoc ? "bg-emerald-500" : "bg-muted")} />
              <span className="text-[10px] text-muted-foreground ml-1">{[nomFrontDoc, nomBackDoc].filter(Boolean).length}/2</span>
            </div>
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
                { label: "Your ID front photo", done: !!frontDoc },
                { label: "Nominee NID front photo", done: !!nomFrontDoc },
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
              <Button type="button" className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
                {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-1.5 h-4 w-4" />}
                Submit for review
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={handleSaveDraft} disabled={isPending}>
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
