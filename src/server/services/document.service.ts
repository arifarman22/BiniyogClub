/**
 * Document Service
 * Handles upload, metadata, access control, file validation,
 * download authorization, audit logging, and agreement generation.
 */

import { db } from "@/lib/db/prisma";
import { storage, buildStorageKey, validateDocumentFile } from "@/lib/storage";
import { requirePermission, requireOwnerOrPermission, isStaff } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { DocumentCategory, DocumentEntityType } from "@/types/prisma";
import { headers } from "next/headers";

// ─── Access control matrix ────────────────────────────────────────────────────
// Defines which roles can access each document category.
// Empty array = staff-only.

const CATEGORY_ACCESS: Record<DocumentCategory, string[]> = {
  KYC:                    ["KYC_OFFICER", "ADMIN", "SUPER_ADMIN"],
  PROJECT_DOCUMENT:       ["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER", "FINANCE_OFFICER", "INVESTOR"],
  INVESTMENT_AGREEMENT:   ["INVESTOR", "ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER"],
  PAYMENT_RECEIPT:        ["INVESTOR", "ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER"],
  INVESTMENT_RECEIPT:     ["INVESTOR", "ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER"],
  DISTRIBUTION_STATEMENT: ["INVESTOR", "ADMIN", "SUPER_ADMIN", "FINANCE_OFFICER"],
  HARVEST_REPORT:         ["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER", "INVESTOR"],
  FARM_DOCUMENT:          ["ADMIN", "SUPER_ADMIN", "PROJECT_MANAGER"],
};

// ─── Audit helper ─────────────────────────────────────────────────────────────

async function auditDocument(
  documentId: string,
  actorId: string | null,
  action: string,
  metadata?: Record<string, unknown>,
) {
  const hdrs = await headers().catch(() => null);
  const ip = hdrs?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs?.get("x-real-ip") ?? null;
  const ua = hdrs?.get("user-agent") ?? null;

  await db.documentAuditLog.create({
    data: {
      documentId,
      actorId,
      action,
      ipAddress: ip,
      userAgent: ua,
      metadata: metadata ?? undefined,
    },
  });
}

// ─── Upload ───────────────────────────────────────────────────────────────────

export interface UploadDocumentInput {
  file: Buffer;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  category: DocumentCategory;
  entityType: DocumentEntityType;
  entityId: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  ownerUserId?: string;
}

async function upload(session: SessionUser, input: UploadDocumentInput) {
  await requirePermission(session, PERMISSIONS.DOCUMENT_UPLOAD);

  // File validation
  const validationError = validateDocumentFile(input.mimeType, input.sizeBytes, input.category);
  if (validationError) throw new ValidationError(validationError);

  // Finalized document categories cannot be uploaded by investors
  const finalizedCategories: DocumentCategory[] = ["INVESTMENT_AGREEMENT", "DISTRIBUTION_STATEMENT"];
  if (finalizedCategories.includes(input.category) && session.role === "INVESTOR") {
    throw new ForbiddenError("Investors cannot upload finalized financial documents");
  }

  const storageKey = buildStorageKey(input.category, input.entityId, input.filename);
  const { key } = await storage.upload(input.file, storageKey, input.mimeType);

  const doc = await db.document.create({
    data: {
      uploadedBy:   session.id,
      entityType:   input.entityType,
      entityId:     input.entityId,
      category:     input.category,
      name:         input.name,
      description:  input.description,
      fileUrl:      key, // storageKey used as fileUrl for legacy compat
      storageKey:   key,
      mimeType:     input.mimeType,
      sizeBytes:    input.sizeBytes,
      isPublic:     input.isPublic ?? false,
      isFinalized:  false,
      ownerUserId:  input.ownerUserId ?? session.id,
      allowedRoles: CATEGORY_ACCESS[input.category],
    },
  });

  await auditDocument(doc.id, session.id, "UPLOAD", { category: input.category, sizeBytes: input.sizeBytes });
  return doc;
}

// ─── Download authorization ───────────────────────────────────────────────────

async function getSignedDownloadUrl(session: SessionUser, documentId: string): Promise<string> {
  await requirePermission(session, PERMISSIONS.DOCUMENT_DOWNLOAD);

  const doc = await db.document.findFirst({
    where: { id: documentId, deletedAt: null },
  });
  if (!doc) throw new NotFoundError("Document");

  // Public documents — no ownership check needed
  if (!doc.isPublic) {
    const allowedRoles = doc.allowedRoles as string[];
    const isOwner = doc.ownerUserId === session.id;
    const hasRoleAccess = allowedRoles.length === 0 || allowedRoles.includes(session.role);

    if (!isOwner && !hasRoleAccess) {
      // Staff with DOCUMENT_MANAGE can always access
      if (!isStaff(session.role)) {
        throw new ForbiddenError("You do not have access to this document");
      }
      await requirePermission(session, PERMISSIONS.DOCUMENT_MANAGE);
    }
  }

  if (!doc.storageKey) throw new ValidationError("Document has no storage key");

  const url = await storage.getSignedUrl(doc.storageKey, doc.mimeType, 300);
  await auditDocument(doc.id, session.id, "DOWNLOAD");
  return url;
}

// ─── Delete ───────────────────────────────────────────────────────────────────

async function deleteDocument(session: SessionUser, documentId: string): Promise<void> {
  const doc = await db.document.findFirst({
    where: { id: documentId, deletedAt: null },
  });
  if (!doc) throw new NotFoundError("Document");

  // Finalized documents cannot be deleted by anyone except SUPER_ADMIN
  if (doc.isFinalized && session.role !== "SUPER_ADMIN") {
    throw new ForbiddenError("Finalized documents cannot be deleted");
  }

  // Owner can delete their own non-finalized docs; staff need DOCUMENT_DELETE
  await requireOwnerOrPermission(session, doc.ownerUserId ?? doc.uploadedBy, PERMISSIONS.DOCUMENT_DELETE);

  // Soft delete
  await db.document.update({
    where: { id: documentId },
    data: { deletedAt: new Date() },
  });

  await auditDocument(doc.id, session.id, "DELETE");
}

// ─── Investment Agreement Generation ─────────────────────────────────────────

const AGREEMENT_TEMPLATE_VERSION = "v1.0.0";

async function generateInvestmentAgreement(
  session: SessionUser,
  investmentId: string,
): Promise<{ documentId: string; storageKey: string }> {
  await requirePermission(session, PERMISSIONS.DOCUMENT_MANAGE);

  const investment = await db.investment.findUnique({
    where: { id: investmentId },
    select: {
      id: true,
      amountBdt: true,
      expectedReturnBdt: true,
      returnType: true,
      createdAt: true,
      receiptNumber: true,
      project: {
        select: { id: true, title: true, slug: true, expectedReturnPct: true, durationDays: true },
      },
      investorProfile: {
        select: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      contract: { select: { id: true, status: true } },
    },
  });

  if (!investment) throw new NotFoundError("Investment");

  // Build structured agreement data (no user editing allowed after finalization)
  const agreementData = {
    templateVersion:  AGREEMENT_TEMPLATE_VERSION,
    generatedAt:      new Date().toISOString(),
    investmentId:     investment.id,
    receiptNumber:    investment.receiptNumber,
    investor: {
      name:  investment.investorProfile.user.name,
      email: investment.investorProfile.user.email,
      phone: investment.investorProfile.user.phone,
    },
    project: {
      title:             investment.project.title,
      expectedReturnPct: Number(investment.project.expectedReturnPct),
      durationDays:      investment.project.durationDays,
    },
    investment: {
      amountBdt:         Number(investment.amountBdt),
      expectedReturnBdt: Number(investment.expectedReturnBdt),
      returnType:        investment.returnType,
      createdAt:         investment.createdAt.toISOString(),
    },
  };

  // Generate PDF content (structured JSON stored as PDF placeholder)
  // In production, replace with a PDF library like @react-pdf/renderer or puppeteer
  const pdfContent = Buffer.from(JSON.stringify(agreementData, null, 2));
  const filename = `agreement_${investment.receiptNumber ?? investment.id}`;
  const storageKey = buildStorageKey("INVESTMENT_AGREEMENT", investmentId, filename);

  const { key } = await storage.upload(pdfContent, storageKey, "application/pdf");

  const doc = await db.document.create({
    data: {
      uploadedBy:      session.id,
      entityType:      "INVESTMENT",
      entityId:        investmentId,
      category:        "INVESTMENT_AGREEMENT",
      name:            `Investment Agreement — ${investment.project.title}`,
      description:     `Generated agreement for investment ${investment.receiptNumber ?? investment.id}`,
      fileUrl:         key,
      storageKey:      key,
      mimeType:        "application/pdf",
      sizeBytes:       pdfContent.length,
      isPublic:        false,
      isFinalized:     true,
      templateVersion: AGREEMENT_TEMPLATE_VERSION,
      generatedAt:     new Date(),
      ownerUserId:     investment.investorProfile.user.id,
      allowedRoles:    CATEGORY_ACCESS.INVESTMENT_AGREEMENT,
    },
  });

  await auditDocument(doc.id, session.id, "GENERATE", {
    templateVersion: AGREEMENT_TEMPLATE_VERSION,
    investmentId,
  });

  return { documentId: doc.id, storageKey: key };
}

// ─── Queries ──────────────────────────────────────────────────────────────────

async function getDocumentsByEntity(
  session: SessionUser,
  entityType: DocumentEntityType,
  entityId: string,
) {
  await requirePermission(session, PERMISSIONS.DOCUMENT_VIEW);

  return db.document.findMany({
    where: {
      entityType,
      entityId,
      deletedAt: null,
      ...(session.role === "INVESTOR" && {
        OR: [
          { ownerUserId: session.id },
          { isPublic: true },
          { allowedRoles: { has: "INVESTOR" } },
        ],
      }),
    },
    select: {
      id: true, name: true, description: true, category: true,
      mimeType: true, sizeBytes: true, isPublic: true, isFinalized: true,
      templateVersion: true, generatedAt: true, createdAt: true,
      uploader: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getDocumentsByOwner(session: SessionUser, ownerUserId: string) {
  // Investors can only see their own; staff can see anyone's
  if (session.role === "INVESTOR" && session.id !== ownerUserId) {
    throw new ForbiddenError("Access denied");
  }
  await requirePermission(session, PERMISSIONS.DOCUMENT_VIEW);

  return db.document.findMany({
    where: { ownerUserId, deletedAt: null },
    select: {
      id: true, name: true, description: true, category: true, entityType: true, entityId: true,
      mimeType: true, sizeBytes: true, isPublic: true, isFinalized: true,
      templateVersion: true, generatedAt: true, createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getDocumentAuditLogs(session: SessionUser, documentId: string) {
  await requirePermission(session, PERMISSIONS.DOCUMENT_MANAGE);

  return db.documentAuditLog.findMany({
    where: { documentId },
    select: {
      id: true, action: true, ipAddress: true, createdAt: true,
      actorId: true, metadata: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const documentService = {
  upload,
  getSignedDownloadUrl,
  deleteDocument,
  generateInvestmentAgreement,
  getDocumentsByEntity,
  getDocumentsByOwner,
  getDocumentAuditLogs,
};
