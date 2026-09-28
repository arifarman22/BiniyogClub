import { kycRepository } from "@/db/repositories/kyc.repository";
import { requirePermission } from "@/lib/authz";
import { NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";

export async function getAdminKycList(
  session: SessionUser,
  opts: { status?: string[]; page?: number; limit?: number } = {},
) {
  await requirePermission(session, "kyc.view");
  return kycRepository.findMany(opts);
}

export async function getAdminKycById(session: SessionUser, kycId: string) {
  await requirePermission(session, "kyc.view");
  const kyc = await kycRepository.findByIdWithDocuments(kycId);
  if (!kyc) throw new NotFoundError("KYC");
  return kyc;
}

export async function getKycStatusCounts(session: SessionUser) {
  await requirePermission(session, "kyc.view");
  return kycRepository.countByStatus();
}
