import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { kycRepository } from "@/db/repositories/kyc.repository";
import { KycSubmitForm } from "@/components/kyc/kyc-submit-form";

export const metadata: Metadata = { title: "Submit KYC — Dashboard" };

export default async function KycSubmitPage() {
  const session = await requireSession();

  const kyc = await kycRepository.findByUserIdWithDocuments(session.id);

  const blockStatuses = ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"];
  if (kyc && blockStatuses.includes(kyc.status)) {
    redirect("/dashboard/kyc");
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Identity Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete all sections and upload your identity document to get verified</p>
      </div>
      <KycSubmitForm existing={kyc} />
    </div>
  );
}
