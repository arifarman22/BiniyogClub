import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { kycRepository } from "@/db/repositories/kyc.repository";
import { PageHeader } from "@/components/ui/page-header";
import { KycSubmitForm } from "@/components/kyc/kyc-submit-form";

export const metadata: Metadata = { title: "Submit KYC — Dashboard" };

export default async function KycSubmitPage() {
  const session = await requireSession();

  const kyc = await kycRepository.findByUserIdWithDocuments(session.id);

  // Block access if already submitted / under review / verified
  const blockStatuses = ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"];
  if (kyc && blockStatuses.includes(kyc.status)) {
    redirect("/dashboard/kyc");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Identity Verification"
        description="Complete all sections and upload your identity document"
      />
      <KycSubmitForm existing={kyc} />
    </div>
  );
}
