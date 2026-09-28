import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminKycById } from "@/server/data/kyc.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { KycReviewActions } from "@/components/kyc/kyc-review-actions";
import { FileText, User, MapPin, CreditCard, Landmark } from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "KYC Review — Admin" };

const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving License",
};

const STATUS_VARIANT: Record<string, "pending" | "review" | "approved" | "rejected" | "default"> = {
  NOT_STARTED: "default",
  SUBMITTED: "pending",
  UNDER_REVIEW: "review",
  VERIFIED: "approved",
  REJECTED: "rejected",
  RESUBMISSION_REQUIRED: "pending",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  RESUBMISSION_REQUIRED: "Resubmission Required",
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2 border-b border-border last:border-0">
      <span className="w-40 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function AdminKycDetailPage({ params }: AsyncComponentProps) {
  const session = await requireSession();
  const { id } = await params!;

  const kyc = await getAdminKycById(session, id as string);
  const user = (kyc as typeof kyc & { user: { id: string; name: string; email: string; phone: string | null; role: string } }).user;

  const canReview = ["SUBMITTED", "UNDER_REVIEW"].includes(kyc.status);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title="KYC Review"
        breadcrumb={
          <Link href="/admin/kyc" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to KYC list
          </Link>
        }
        action={
          <StatusBadge status={STATUS_VARIANT[kyc.status] ?? "default"}>
            {STATUS_LABEL[kyc.status] ?? kyc.status}
          </StatusBadge>
        }
      />

      {/* Review note */}
      {kyc.reviewNote && (
        <div className="rounded-xl border border-warning/30 bg-warning-muted/30 p-4">
          <p className="text-xs font-medium text-warning-foreground">Review note</p>
          <p className="mt-1 text-sm">{kyc.reviewNote}</p>
        </div>
      )}

      {/* User info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">User</h2>
        </div>
        <InfoRow label="Name" value={user?.name} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Phone" value={user?.phone ?? undefined} />
        <InfoRow label="Role" value={user?.role} />
        <InfoRow
          label="Submitted"
          value={
            kyc.submittedAt
              ? new Date(kyc.submittedAt).toLocaleString("en-BD")
              : undefined
          }
        />
      </div>

      {/* Personal info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Personal Information</h2>
        </div>
        <InfoRow label="Full name" value={kyc.fullName} />
        <InfoRow
          label="Date of birth"
          value={
            kyc.dateOfBirth
              ? new Date(kyc.dateOfBirth).toLocaleDateString("en-BD", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : undefined
          }
        />
        <InfoRow label="Nationality" value={kyc.nationality ?? undefined} />
      </div>

      {/* Address */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Address</h2>
        </div>
        <InfoRow label="Address" value={kyc.addressLine} />
        <InfoRow label="City" value={kyc.city} />
        <InfoRow label="District" value={kyc.district} />
        <InfoRow label="Division" value={kyc.division} />
        <InfoRow label="Postal code" value={kyc.postalCode} />
      </div>

      {/* Identity document */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Identity Document</h2>
        </div>
        <InfoRow
          label="Document type"
          value={kyc.documentType ? (DOC_LABELS[kyc.documentType] ?? kyc.documentType) : undefined}
        />
        <InfoRow label="Document number" value={kyc.documentNumber} />

        {/* Document files */}
        {(kyc as typeof kyc & { documents: { id: string; documentType: string; mimeType: string; sizeBytes: number; verifiedAt: Date | null; createdAt: Date }[] }).documents.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">Uploaded files</p>
            {(kyc as typeof kyc & { documents: { id: string; documentType: string; mimeType: string; sizeBytes: number; verifiedAt: Date | null; createdAt: Date }[] }).documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {DOC_LABELS[doc.documentType] ?? doc.documentType}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {doc.mimeType} · {(doc.sizeBytes / 1024).toFixed(0)} KB
                      {doc.verifiedAt && <span className="ml-2 text-success">· Verified</span>}
                    </p>
                  </div>
                </div>
                {/* Route through private API — never expose storageKey */}
                <a
                  href={`/api/kyc/documents/${doc.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  View ↗
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bank / MFS */}
      {(kyc.bankName || kyc.bankAccountNumber || kyc.mobileProvider || kyc.mobileNumber) && (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Payment Information</h2>
          </div>
          <InfoRow label="Bank name" value={kyc.bankName} />
          <InfoRow label="Account number" value={kyc.bankAccountNumber} />
          <InfoRow label="Mobile provider" value={kyc.mobileProvider} />
          <InfoRow label="Mobile number" value={kyc.mobileNumber} />
        </div>
      )}

      {/* Review actions */}
      {canReview && <KycReviewActions kycId={kyc.id} currentStatus={kyc.status} />}
    </div>
  );
}
