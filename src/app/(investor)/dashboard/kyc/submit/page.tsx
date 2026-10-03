export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { kycRepository } from "@/db/repositories/kyc.repository";
import { db } from "@/lib/db/prisma";
import { KycSubmitForm } from "@/components/kyc/kyc-submit-form";

export const metadata: Metadata = { title: "Submit KYC — Dashboard" };

export default async function KycSubmitPage() {
  const session = await requireSession();

  const [kyc, investorProfile] = await Promise.all([
    kycRepository.findByUserIdWithDocuments(session.id),
    db.investorProfile.findUnique({
      where: { userId: session.id },
      select: { nationalId: true, nomineeNationalId: true, nomineeRelation: true },
    }).catch(() => null),
  ]);

  const blockStatuses = ["SUBMITTED", "UNDER_REVIEW", "VERIFIED"];
  if (kyc && blockStatuses.includes(kyc.status)) {
    redirect("/dashboard/kyc");
  }

  const prefill = {
    name: session.name,
    phone: session.phone ?? "",
    nationalId: investorProfile?.nationalId ?? "",
    nomineeNationalId: investorProfile?.nomineeNationalId ?? "",
    nomineeRelation: investorProfile?.nomineeRelation ?? "",
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold">Identity Verification</h1>
        <p className="text-sm text-muted-foreground mt-1">Complete all sections and upload your identity document to get verified</p>
      </div>
      <KycSubmitForm existing={kyc} prefill={prefill} />
    </div>
  );
}
