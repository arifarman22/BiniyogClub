/**
 * Document Service
 * Handles upload, metadata, access control, file validation,
 * download authorization, audit logging, and agreement generation.
 */

import { db } from "@/lib/db/prisma";
import { Prisma } from "@prisma/client";
import { storage, buildStorageKey, validateDocumentFile } from "@/lib/storage";
import { requirePermission, requireOwnerOrPermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";
import type { DocumentCategory, DocumentEntityType } from "@/types/prisma";
import { renderInvestmentCertificate } from "@/lib/pdf/investment-certificate";
import { signReceipt } from "@/lib/pdf/verify";
import { headers } from "next/headers";

async function getRequestContext() {
  const hdrs = await headers().catch(() => null);
  return {
    ip: hdrs?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? hdrs?.get("x-real-ip") ?? null,
    ua: hdrs?.get("user-agent") ?? null,
  };
}

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
  requestContext?: { ip?: string | null; ua?: string | null },
) {
  await db.documentAuditLog.create({
    data: {
      documentId,
      actorId,
      action,
      ipAddress: requestContext?.ip ?? null,
      userAgent: requestContext?.ua ?? null,
      metadata: metadata ? (metadata as Prisma.InputJsonValue) : undefined,
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

  await auditDocument(doc.id, session.id, "UPLOAD", { category: input.category, sizeBytes: input.sizeBytes }, await getRequestContext());
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
      // Staff with DOCUMENT_MANAGE can always access, but must have the permission
      await requirePermission(session, PERMISSIONS.DOCUMENT_MANAGE);
    }
  }

  if (!doc.storageKey) throw new ValidationError("Document has no storage key");

  const url = await storage.getSignedUrl(doc.storageKey, doc.mimeType, 300);
  await auditDocument(doc.id, session.id, "DOWNLOAD", undefined, await getRequestContext());
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

  await auditDocument(doc.id, session.id, "DELETE", undefined, await getRequestContext());
}

// ─── Investment Receipt Generation ───────────────────────────────────────────
// Generates an INVESTMENT_RECEIPT PDF for the investor after a confirmed
// investment. Runs as a system operation — no session permission check needed
// since it is always triggered server-side after payment confirmation.

const RECEIPT_TEMPLATE_VERSION = "v2.0.0";

async function generateInvestmentReceipt(
  investmentId: string,
): Promise<{ documentId: string; storageKey: string }> {
  const investment = await db.investment.findUnique({
    where: { id: investmentId },
    select: {
      id: true,
      status: true,
      amountBdt: true,
      expectedReturnBdt: true,
      returnType: true,
      createdAt: true,
      activatedAt: true,
      receiptNumber: true,
      project: {
        select: {
          id: true, title: true, slug: true,
          expectedReturnPct: true, returnPctMin: true, returnPctMax: true, durationDays: true,
          category: true, location: true,
        },
      },
      investorProfile: {
        select: {
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
    },
  });

  if (!investment) throw new NotFoundError("Investment");

  // Only generate receipts for ACTIVE/MATURED/COMPLETED investments that have a receipt number
  if (!investment.receiptNumber) {
    console.error(`[generateInvestmentReceipt] Investment ${investmentId} has no receiptNumber — skipping`);
    throw new Error(`Investment ${investmentId} has no receiptNumber yet — cannot generate receipt`);
  }
  if (!["ACTIVE", "MATURED", "COMPLETED"].includes(investment.status)) {
    console.error(`[generateInvestmentReceipt] Investment ${investmentId} status is ${investment.status} — skipping`);
    throw new Error(`Investment ${investmentId} is not ACTIVE (status: ${investment.status})`);
  }

  // Skip if receipt already exists for THIS specific investment (matched by receipt number)
  const existing = await db.document.findFirst({
    where: {
      entityType: "PROJECT",
      entityId: investment.project.id,
      category: "INVESTMENT_RECEIPT",
      ownerUserId: investment.investorProfile.user.id,
      description: `Receipt #${investment.receiptNumber}`,
      deletedAt: null,
    },
    select: { id: true, storageKey: true },
  });
  if (existing) return { documentId: existing.id, storageKey: existing.storageKey ?? "" };

  const now = new Date();
  const receiptNumber = investment.receiptNumber ?? investment.id;
  const amountBdt = Number(investment.amountBdt);
  const activatedAt = (investment.activatedAt ?? investment.createdAt).toISOString();
  const investorEmail = investment.investorProfile.user.email;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyogclub.com").replace("http://localhost:3000", "https://biniyogclub.com");

  const verificationHash = signReceipt({
    receiptNumber,
    investmentId: investment.id,
    amountBdt,
    activatedAt,
    investorEmail,
  });

  const pdfContent = await renderInvestmentCertificate({
    receiptNumber,
    investmentId:    investment.id,
    generatedAt:     now.toISOString(),
    verificationUrl: `${appUrl}/verify/${receiptNumber}`,
    investor: {
      name:  investment.investorProfile.user.name ?? "Investor",
      email: investorEmail,
      phone: investment.investorProfile.user.phone,
    },
    project: {
      title:             investment.project.title,
      expectedReturnPct: Number(investment.project.expectedReturnPct),
      returnPctMin:      investment.project.returnPctMin != null ? Number(investment.project.returnPctMin) : null,
      returnPctMax:      investment.project.returnPctMax != null ? Number(investment.project.returnPctMax) : null,
      durationDays:      investment.project.durationDays,
      category:          investment.project.category ?? undefined,
      location:          investment.project.location,
    },
    investment: {
      amountBdt,
      expectedReturnBdt: Number(investment.expectedReturnBdt),
      returnType:        investment.returnType,
      activatedAt,
    },
  });

  const filename = `receipt_${investment.receiptNumber ?? investment.id}`;
  // entityId must be a valid Project.id due to the Document→Project FK constraint
  const storageKey = buildStorageKey("INVESTMENT_RECEIPT", investment.project.id, filename);
  const { key } = await storage.upload(pdfContent, storageKey, "application/pdf");

  const investorUserId = investment.investorProfile.user.id;

  const doc = await db.document.create({
    data: {
      uploadedBy:      investorUserId,
      entityType:      "PROJECT",
      entityId:        investment.project.id,   // valid Project FK
      category:        "INVESTMENT_RECEIPT",
      name:            `Investment Receipt — ${investment.project.title}`,
      description:     `Receipt #${investment.receiptNumber ?? investment.id}`,
      fileUrl:         key,
      storageKey:      key,
      mimeType:        "application/pdf",
      sizeBytes:       pdfContent.length,
      isPublic:        false,
      isFinalized:     true,
      templateVersion: RECEIPT_TEMPLATE_VERSION,
      generatedAt:     now,
      verificationHash,
      ownerUserId:     investorUserId,
      allowedRoles:    CATEGORY_ACCESS.INVESTMENT_RECEIPT,
    },
  });

  await db.documentAuditLog.create({
    data: {
      documentId: doc.id,
      actorId:    null,
      action:     "GENERATE",
      metadata:   { templateVersion: RECEIPT_TEMPLATE_VERSION, investmentId } as Prisma.InputJsonValue,
    },
  });

  return { documentId: doc.id, storageKey: key };
}

// ─── Investment Agreement Generation ─────────────────────────────────────────
// Generates the INVESTMENT_AGREEMENT PDF once an investment is active, stores it
// as a document and marks the InvestmentContract as issued (SENT) with the
// document id in contractUrl. System operation — runs after payment approval.

const AGREEMENT_TEMPLATE_VERSION = "v1.0.0";

const METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Bank transfer", CHECK: "Cheque", CASH: "Cash", MOBILE_BANKING: "Mobile banking", OTHER: "Other",
};
const CASH_RECEIVER_LABELS: Record<string, string> = {
  CEO: "CEO", MD: "Managing Director", CHAIRMAN: "Chairman", FINANCE_TEAM: "Finance Team",
};

async function issueInvestmentAgreement(
  investmentId: string,
): Promise<{ documentId: string; storageKey: string }> {
  const investment = await db.investment.findUnique({
    where: { id: investmentId },
    select: {
      id: true, status: true, amountBdt: true, returnType: true, createdAt: true, activatedAt: true, receiptNumber: true,
      project: {
        select: {
          id: true, title: true, category: true, location: true, durationDays: true,
          expectedReturnPct: true, returnPctMin: true, returnPctMax: true,
        },
      },
      investorProfile: {
        select: {
          nationalId: true, address: true, nomineeName: true, nomineeNationalId: true,
          user: { select: { id: true, name: true, email: true, phone: true } },
        },
      },
      manualPayments: {
        where: { status: "APPROVED" },
        select: { paymentMethod: true, amountBdt: true, transactionRef: true, bankAccountId: true, cashReceivedBy: true },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!investment) throw new NotFoundError("Investment");
  if (!investment.receiptNumber || !["ACTIVE", "MATURED", "COMPLETED"].includes(investment.status)) {
    throw new Error(`Investment ${investmentId} is not active — cannot issue an agreement`);
  }

  const investorUserId = investment.investorProfile.user.id;
  const description = `Agreement #${investment.receiptNumber}`;

  // Already issued for this investment? Make sure the contract points at it.
  const existing = await db.document.findFirst({
    where: { category: "INVESTMENT_AGREEMENT", ownerUserId: investorUserId, description, deletedAt: null },
    select: { id: true, storageKey: true },
  });
  if (existing) {
    await db.investmentContract.updateMany({
      where: { investmentId, contractUrl: null },
      data: { status: "SENT", contractUrl: existing.id, sentAt: new Date() },
    });
    return { documentId: existing.id, storageKey: existing.storageKey ?? "" };
  }

  // Bank names for bank-transfer parts
  const bankIds = investment.manualPayments.map((p) => p.bankAccountId).filter((id): id is string => !!id);
  const banks = bankIds.length
    ? await db.projectBankAccount.findMany({ where: { id: { in: bankIds } }, select: { id: true, bankName: true, accountNumber: true } })
    : [];
  const bankById = new Map(banks.map((b) => [b.id, b]));

  const amountBdt = Number(investment.amountBdt);
  const { getReturnRange, formatReturnPct, getExpectedReturnBdt } = await import("@/lib/financial/return-range");
  const range = getReturnRange(investment.project);
  const expected = getExpectedReturnBdt(amountBdt, investment.project);
  const bdt = (n: number) => `BDT ${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyogclub.com").replace("http://localhost:3000", "https://biniyogclub.com");
  const now = new Date();

  const { renderInvestmentAgreement } = await import("@/lib/pdf/investment-agreement");
  const pdf = await renderInvestmentAgreement({
    agreementNumber: investment.receiptNumber,
    investmentId: investment.id,
    issuedAt: now.toISOString(),
    verificationUrl: `${appUrl}/verify/${investment.receiptNumber}`,
    investor: {
      name: investment.investorProfile.user.name ?? "Investor",
      email: investment.investorProfile.user.email,
      phone: investment.investorProfile.user.phone,
      nationalId: investment.investorProfile.nationalId,
      address: investment.investorProfile.address,
      nomineeName: investment.investorProfile.nomineeName,
      nomineeNationalId: investment.investorProfile.nomineeNationalId,
    },
    project: {
      title: investment.project.title,
      category: investment.project.category ? investment.project.category.charAt(0) + investment.project.category.slice(1).toLowerCase().replace(/_/g, " ") : null,
      location: investment.project.location,
      durationDays: investment.project.durationDays,
    },
    investment: {
      amountBdt,
      returnLabel: range ? formatReturnPct(investment.project) : `${Number(investment.project.expectedReturnPct)}%`,
      expectedReturnLabel: expected.max != null ? `${bdt(expected.min)} – ${bdt(expected.max)}` : bdt(expected.min),
      returnType: investment.returnType,
      activatedAt: (investment.activatedAt ?? investment.createdAt).toISOString(),
    },
    payments: investment.manualPayments.map((p) => {
      const bank = p.bankAccountId ? bankById.get(p.bankAccountId) : null;
      return {
        method: METHOD_LABELS[p.paymentMethod] ?? p.paymentMethod,
        amountBdt: Number(p.amountBdt),
        reference: p.transactionRef && p.transactionRef !== "CASH" ? `Ref ${p.transactionRef}` : null,
        detail: bank
          ? `${bank.bankName} ${bank.accountNumber}`
          : p.cashReceivedBy ? `Received by ${CASH_RECEIVER_LABELS[p.cashReceivedBy] ?? p.cashReceivedBy}` : null,
      };
    }),
  });

  // entityId must be a valid Project.id due to the Document→Project FK constraint
  const storageKey = buildStorageKey("INVESTMENT_AGREEMENT", investment.project.id, `agreement_${investment.receiptNumber}`);
  const { key } = await storage.upload(pdf, storageKey, "application/pdf");

  const doc = await db.document.create({
    data: {
      uploadedBy: investorUserId,
      entityType: "PROJECT",
      entityId: investment.project.id,
      category: "INVESTMENT_AGREEMENT",
      name: `Investment Agreement — ${investment.project.title}`,
      description,
      fileUrl: key,
      storageKey: key,
      mimeType: "application/pdf",
      sizeBytes: pdf.length,
      isPublic: false,
      isFinalized: true,
      templateVersion: AGREEMENT_TEMPLATE_VERSION,
      generatedAt: now,
      ownerUserId: investorUserId,
      allowedRoles: CATEGORY_ACCESS.INVESTMENT_AGREEMENT,
    },
  });

  await db.investmentContract.upsert({
    where: { investmentId },
    create: {
      investmentId,
      status: "SENT",
      templateVersion: AGREEMENT_TEMPLATE_VERSION,
      contractUrl: doc.id,
      sentAt: now,
      terms: { amountBdt, projectTitle: investment.project.title, investorId: investorUserId },
    },
    update: { status: "SENT", contractUrl: doc.id, sentAt: now, templateVersion: AGREEMENT_TEMPLATE_VERSION },
  });

  await db.documentAuditLog.create({
    data: {
      documentId: doc.id,
      actorId: null,
      action: "GENERATE",
      metadata: { templateVersion: AGREEMENT_TEMPLATE_VERSION, investmentId } as Prisma.InputJsonValue,
    },
  });

  return { documentId: doc.id, storageKey: key };
}

/** Staff-triggered (re)issue of an agreement. */
async function generateInvestmentAgreement(
  session: SessionUser,
  investmentId: string,
): Promise<{ documentId: string; storageKey: string }> {
  await requirePermission(session, PERMISSIONS.DOCUMENT_MANAGE);
  return issueInvestmentAgreement(investmentId);
}

/**
 * Everything an investor receives when an investment becomes active: the
 * receipt/certificate and the investment agreement. Each is attempted even if
 * the other fails.
 */
async function generateInvestmentDocuments(investmentId: string) {
  const [receipt, agreement] = await Promise.allSettled([
    generateInvestmentReceipt(investmentId),
    issueInvestmentAgreement(investmentId),
  ]);
  if (receipt.status === "rejected") console.error("[documents] receipt generation failed:", receipt.reason);
  if (agreement.status === "rejected") console.error("[documents] agreement generation failed:", agreement.reason);
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
  generateInvestmentReceipt,
  generateInvestmentAgreement,
  issueInvestmentAgreement,
  generateInvestmentDocuments,
  getDocumentsByEntity,
  getDocumentsByOwner,
  getDocumentAuditLogs,
};
