import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerProfile } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { FarmerProfileForm } from "@/components/farmer/farmer-profile-form";
import { ShieldCheck, ShieldX } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = { title: "Profile — Farmer Portal" };

const KYC_STATUS_VARIANT: Record<string, string> = {
  NOT_STARTED: "default", SUBMITTED: "pending", UNDER_REVIEW: "review",
  VERIFIED: "approved", REJECTED: "rejected", RESUBMISSION_REQUIRED: "pending",
};

const KYC_STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started", SUBMITTED: "Submitted", UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified", REJECTED: "Rejected", RESUBMISSION_REQUIRED: "Resubmission Required",
};

export default async function FarmerProfilePage() {
  const session = await requireSession();
  const profile = await getFarmerProfile(session);

  const kycStatus = profile.kyc?.status ?? "NOT_STARTED";

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="My Profile" />

      {/* KYC status banner */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
        <div className="flex items-center gap-3">
          {kycStatus === "VERIFIED" ? (
            <ShieldCheck className="h-5 w-5 text-success" />
          ) : (
            <ShieldX className="h-5 w-5 text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium">KYC Verification</p>
            <p className="text-xs text-muted-foreground">
              {kycStatus === "VERIFIED"
                ? "Your identity is verified"
                : "Complete KYC to unlock all features"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={KYC_STATUS_VARIANT[kycStatus] as never ?? "default"}>
            {KYC_STATUS_LABEL[kycStatus] ?? kycStatus}
          </StatusBadge>
          {kycStatus !== "VERIFIED" && (
            <Link href="/farmer/kyc" className="text-xs text-primary hover:underline">
              Complete →
            </Link>
          )}
        </div>
      </div>

      {/* Profile form */}
      <FarmerProfileForm profile={profile} />
    </div>
  );
}
