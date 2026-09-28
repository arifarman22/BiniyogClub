import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { kycRepository } from "@/db/repositories/kyc.repository";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck, ShieldX, Clock, CheckCircle2, AlertCircle,
  FileText, ArrowRight, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "KYC Verification — Dashboard" };

const STATUS_CONFIG = {
  NOT_STARTED: {
    icon: ShieldX,
    variant: "default" as const,
    label: "Not Started",
    desc: "Complete identity verification to unlock investing.",
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  SUBMITTED: {
    icon: Clock,
    variant: "pending" as const,
    label: "Submitted",
    desc: "Your documents have been submitted and are awaiting review.",
    color: "text-warning-foreground",
    bg: "bg-warning-muted",
  },
  UNDER_REVIEW: {
    icon: Clock,
    variant: "review" as const,
    label: "Under Review",
    desc: "Our team is currently reviewing your documents.",
    color: "text-info-foreground",
    bg: "bg-info-muted",
  },
  VERIFIED: {
    icon: ShieldCheck,
    variant: "approved" as const,
    label: "Verified",
    desc: "Your identity has been verified. You can now invest.",
    color: "text-success",
    bg: "bg-success-muted",
  },
  REJECTED: {
    icon: ShieldX,
    variant: "rejected" as const,
    label: "Rejected",
    desc: "Your KYC was rejected. Please resubmit with correct documents.",
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  RESUBMISSION_REQUIRED: {
    icon: RefreshCw,
    variant: "pending" as const,
    label: "Resubmission Required",
    desc: "Additional information or corrected documents are needed.",
    color: "text-warning-foreground",
    bg: "bg-warning-muted",
  },
} as const;

const DOC_LABELS: Record<string, string> = {
  NATIONAL_ID: "National ID",
  PASSPORT: "Passport",
  DRIVING_LICENSE: "Driving License",
};

export default async function KycPage() {
  const session = await requireSession();
  const kyc = await kycRepository.findByUserIdWithDocuments(session.id);

  const status = kyc?.status ?? "NOT_STARTED";
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_STARTED;
  const Icon = config.icon;

  const canSubmit = status === "NOT_STARTED" || status === "RESUBMISSION_REQUIRED";

  const steps = [
    {
      label: "Fill in your details",
      done: !!kyc && status !== "NOT_STARTED",
      date: kyc?.createdAt,
    },
    {
      label: "Submit for review",
      done: !!kyc?.submittedAt,
      date: kyc?.submittedAt,
    },
    {
      label: "Under review",
      done: ["UNDER_REVIEW", "VERIFIED", "REJECTED"].includes(status),
      date: null,
    },
    {
      label: "Verification complete",
      done: status === "VERIFIED",
      date: kyc?.reviewedAt,
    },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="KYC Verification"
        description="Identity verification is required to invest on Biniyog Club"
        action={
          canSubmit ? (
            <Button asChild size="sm">
              <Link href="/dashboard/kyc/submit">
                {status === "RESUBMISSION_REQUIRED" ? "Resubmit" : "Start Verification"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          ) : null
        }
      />

      {/* Status card */}
      <div
        className={cn(
          "rounded-xl border p-6",
          status === "VERIFIED" ? "border-success/30 bg-success-muted/20" : "border-border bg-card",
        )}
      >
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-14 w-14 shrink-0 items-center justify-center rounded-xl",
              config.bg,
              config.color,
            )}
          >
            <Icon className="h-7 w-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-lg">{config.label}</p>
              <StatusBadge status={config.variant}>{config.label}</StatusBadge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{config.desc}</p>

            {kyc?.reviewNote && (status === "REJECTED" || status === "RESUBMISSION_REQUIRED") && (
              <div className="mt-3 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-xs font-medium text-destructive">
                  {status === "REJECTED" ? "Rejection reason:" : "Instructions:"}
                </p>
                <p className="mt-0.5 text-sm text-foreground">{kyc.reviewNote}</p>
              </div>
            )}

            {kyc?.expiresAt && status === "VERIFIED" && (
              <p className="mt-2 text-xs text-muted-foreground">
                Valid until{" "}
                {new Date(kyc.expiresAt).toLocaleDateString("en-BD", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress steps */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-5 font-semibold">Verification Progress</h2>
        <ol className="space-y-4">
          {steps.map(({ label, done, date }, i) => (
            <li key={label} className="flex items-start gap-3">
              <div
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                  done ? "bg-success text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <div className="flex-1 pt-0.5">
                <p className={cn("text-sm font-medium", done ? "text-foreground" : "text-muted-foreground")}>
                  {label}
                </p>
                {date && (
                  <p className="text-xs text-muted-foreground">
                    {new Date(date).toLocaleDateString("en-BD", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Submitted info summary */}
      {kyc && status !== "NOT_STARTED" && (
        <div className="rounded-xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold">Submitted Information</h2>

          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {kyc.fullName && (
              <>
                <span className="text-muted-foreground">Full name</span>
                <span>{kyc.fullName}</span>
              </>
            )}
            {kyc.documentType && (
              <>
                <span className="text-muted-foreground">Document type</span>
                <span>{DOC_LABELS[kyc.documentType] ?? kyc.documentType}</span>
              </>
            )}
            {kyc.documentNumber && (
              <>
                <span className="text-muted-foreground">Document number</span>
                <span className="font-mono">{kyc.documentNumber}</span>
              </>
            )}
            {kyc.city && (
              <>
                <span className="text-muted-foreground">City</span>
                <span>{kyc.city}, {kyc.district}</span>
              </>
            )}
          </div>

          {/* Documents */}
          {kyc.documents.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border">
              <p className="text-sm font-medium">Uploaded documents</p>
              {kyc.documents.map((doc) => (
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
                        {new Date(doc.createdAt).toLocaleDateString("en-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                        {doc.verifiedAt && (
                          <span className="ml-2 text-success">· Verified</span>
                        )}
                      </p>
                    </div>
                  </div>
                  {/* Route through private API — never expose storageKey */}
                  <a
                    href={`/api/kyc/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    View ↗
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* What's needed (first time) */}
      {status === "NOT_STARTED" && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">What you&apos;ll need</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Valid National ID (NID), Passport, or Driving License",
              "Your full legal name and date of birth",
              "Current residential address",
              "Bank account or mobile banking number (bKash, Nagad, etc.)",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <Button asChild>
              <Link href="/dashboard/kyc/submit">
                Start Verification <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
