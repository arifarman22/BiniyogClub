import { kycRepository } from "@/db/repositories/kyc.repository";
import { storage, validateKycFile } from "@/lib/storage";
import { requirePermission } from "@/lib/authz";
import { ForbiddenError, NotFoundError, ConflictError, ValidationError } from "@/lib/errors";
import { db } from "@/lib/db/prisma";
import type { SessionUser } from "@/lib/auth/session";
import type { KycSubmitInput } from "@/validations/kyc";

// ─── Allowed statuses for (re)submission ─────────────────────────────────────

const SUBMITTABLE_STATUSES = ["NOT_STARTED", "RESUBMISSION_REQUIRED"] as const;

export const kycService = {
  // ─── Investor: save draft ──────────────────────────────────────────────────

  async saveDraft(session: SessionUser, input: Partial<KycSubmitInput>) {
    await requirePermission(session, "kyc.submit");

    const kyc = await kycRepository.findByUserId(session.id);
    if (kyc && !SUBMITTABLE_STATUSES.includes(kyc.status as typeof SUBMITTABLE_STATUSES[number])) {
      throw new ConflictError("KYC cannot be edited in its current status");
    }

    return kycRepository.upsertDraft(session.id, {
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      nationality: input.nationality,
      addressLine: input.addressLine,
      city: input.city,
      district: input.district,
      division: input.division,
      postalCode: input.postalCode ?? null,
      documentType: input.documentType as Parameters<typeof kycRepository.upsertDraft>[1]["documentType"],
      documentNumber: input.documentNumber,
      bankName: input.bankName ?? null,
      bankAccountNumber: input.bankAccountNumber ?? null,
      mobileProvider: input.mobileProvider ?? null,
      mobileNumber: input.mobileNumber ?? null,
    });
  },

  // ─── Investor: upload document ─────────────────────────────────────────────

  async uploadDocument(
    session: SessionUser,
    kycId: string,
    documentType: string,
    file: Buffer,
    mimeType: string,
    sizeBytes: number,
  ) {
    await requirePermission(session, "kyc.submit");

    const kyc = await kycRepository.findById(kycId);
    if (!kyc) throw new NotFoundError("KYC");
    if (kyc.userId !== session.id) throw new ForbiddenError();
    if (!SUBMITTABLE_STATUSES.includes(kyc.status as typeof SUBMITTABLE_STATUSES[number])) {
      throw new ConflictError("Documents cannot be changed in the current KYC status");
    }

    const fileError = validateKycFile(mimeType, sizeBytes);
    if (fileError) throw new ValidationError(fileError);

    const ext = mimeType === "application/pdf" ? "pdf" : mimeType.split("/")[1];
    const key = `kyc/${session.id}/${kycId}/${documentType}_${Date.now()}.${ext}`;

    await storage.upload(file, key, mimeType);

    const doc = await kycRepository.addDocument({ kycId, documentType, storageKey: key, mimeType, sizeBytes });

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "CREATE",
        entityType: "KycDocument",
        entityId: doc.id,
        after: { documentType, kycId },
      },
    });

    return doc;
  },

  // ─── Investor: delete document (draft only) ────────────────────────────────

  async deleteDocument(session: SessionUser, documentId: string) {
    await requirePermission(session, "kyc.submit");

    const doc = await kycRepository.findDocumentById(documentId);
    if (!doc) throw new NotFoundError("Document");

    const kyc = await kycRepository.findById(doc.kycId);
    if (!kyc || kyc.userId !== session.id) throw new ForbiddenError();
    if (!SUBMITTABLE_STATUSES.includes(kyc.status as typeof SUBMITTABLE_STATUSES[number])) {
      throw new ConflictError("Documents cannot be removed in the current KYC status");
    }

    await storage.delete(doc.storageKey);
    await kycRepository.deleteDocument(documentId);

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "DELETE",
        entityType: "KycDocument",
        entityId: documentId,
        before: { documentType: doc.documentType, kycId: doc.kycId },
      },
    });
  },

  // ─── Investor: submit for review ──────────────────────────────────────────

  async submit(session: SessionUser) {
    await requirePermission(session, "kyc.submit");

    const kyc = await kycRepository.findByUserIdWithDocuments(session.id);
    if (!kyc) throw new NotFoundError("KYC");
    if (!SUBMITTABLE_STATUSES.includes(kyc.status as typeof SUBMITTABLE_STATUSES[number])) {
      throw new ConflictError("KYC is already submitted or under review");
    }

    // Require at least one document
    if (kyc.documents.length === 0) {
      throw new ValidationError("Upload at least one identity document before submitting");
    }

    // Require all personal + address + identity fields
    const required: (keyof typeof kyc)[] = [
      "fullName", "dateOfBirth", "addressLine", "city", "district", "division",
      "documentType", "documentNumber",
    ];
    const missing = required.filter((f) => !kyc[f]);
    if (missing.length > 0) {
      throw new ValidationError(`Complete all required fields before submitting: ${missing.join(", ")}`);
    }

    const submitted = await kycRepository.submit(session.id);

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "UPDATE",
        entityType: "Kyc",
        entityId: kyc.id,
        before: { status: kyc.status },
        after: { status: "SUBMITTED" },
      },
    });

    return submitted;
  },

  // ─── Admin: start review ──────────────────────────────────────────────────

  async startReview(session: SessionUser, kycId: string) {
    await requirePermission(session, "kyc.review");

    const kyc = await kycRepository.findById(kycId);
    if (!kyc) throw new NotFoundError("KYC");
    if (kyc.status !== "SUBMITTED") {
      throw new ConflictError("Only SUBMITTED KYC records can be moved to UNDER_REVIEW");
    }

    const updated = await kycRepository.setUnderReview(kycId);

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "UPDATE",
        entityType: "Kyc",
        entityId: kycId,
        before: { status: "SUBMITTED" },
        after: { status: "UNDER_REVIEW" },
      },
    });

    return updated;
  },

  // ─── Admin: verify (approve) ──────────────────────────────────────────────

  async verify(session: SessionUser, kycId: string) {
    await requirePermission(session, "kyc.approve");

    const kyc = await kycRepository.findById(kycId);
    if (!kyc) throw new NotFoundError("KYC");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(kyc.status)) {
      throw new ConflictError("KYC must be SUBMITTED or UNDER_REVIEW to verify");
    }

    const updated = await kycRepository.verify(kycId, session.id);

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "APPROVE",
        entityType: "Kyc",
        entityId: kycId,
        before: { status: kyc.status },
        after: { status: "VERIFIED" },
      },
    });

    return updated;
  },

  // ─── Admin: reject ────────────────────────────────────────────────────────

  async reject(session: SessionUser, kycId: string, reviewNote: string) {
    await requirePermission(session, "kyc.approve");

    const kyc = await kycRepository.findById(kycId);
    if (!kyc) throw new NotFoundError("KYC");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(kyc.status)) {
      throw new ConflictError("KYC must be SUBMITTED or UNDER_REVIEW to reject");
    }

    const updated = await kycRepository.reject(kycId, session.id, reviewNote);

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "REJECT",
        entityType: "Kyc",
        entityId: kycId,
        before: { status: kyc.status },
        after: { status: "REJECTED", reviewNote },
      },
    });

    return updated;
  },

  // ─── Admin: request resubmission ─────────────────────────────────────────

  async requestResubmission(session: SessionUser, kycId: string, reviewNote: string) {
    await requirePermission(session, "kyc.approve");

    const kyc = await kycRepository.findById(kycId);
    if (!kyc) throw new NotFoundError("KYC");
    if (!["SUBMITTED", "UNDER_REVIEW"].includes(kyc.status)) {
      throw new ConflictError("KYC must be SUBMITTED or UNDER_REVIEW to request resubmission");
    }

    const updated = await kycRepository.requestResubmission(kycId, session.id, reviewNote);

    await db.auditLog.create({
      data: {
        actorId: session.id,
        action: "UPDATE",
        entityType: "Kyc",
        entityId: kycId,
        before: { status: kyc.status },
        after: { status: "RESUBMISSION_REQUIRED", reviewNote },
      },
    });

    return updated;
  },

  // ─── Shared: get signed document URL (server-side only) ───────────────────

  async getDocumentSignedUrl(
    session: SessionUser,
    documentId: string,
  ): Promise<string> {
    const doc = await kycRepository.findDocumentById(documentId);
    if (!doc) throw new NotFoundError("Document");

    const kyc = await kycRepository.findById(doc.kycId);
    if (!kyc) throw new NotFoundError("KYC");

    // Investor can only access their own documents; staff need kyc.view
    const isOwner = kyc.userId === session.id;
    if (!isOwner) {
      await requirePermission(session, "kyc.view");
    }

    return storage.getSignedUrl(doc.storageKey, 300);
  },
};
