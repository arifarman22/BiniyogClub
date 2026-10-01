-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM (
  'KYC',
  'PROJECT_DOCUMENT',
  'INVESTMENT_AGREEMENT',
  'PAYMENT_RECEIPT',
  'INVESTMENT_RECEIPT',
  'DISTRIBUTION_STATEMENT',
  'HARVEST_REPORT',
  'FARM_DOCUMENT'
);

-- AlterTable: add new columns to documents
ALTER TABLE "documents"
  ADD COLUMN "category"          "DocumentCategory" NOT NULL DEFAULT 'PROJECT_DOCUMENT',
  ADD COLUMN "storageKey"        TEXT,
  ADD COLUMN "description"       TEXT,
  ADD COLUMN "isFinalized"       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "templateVersion"   TEXT,
  ADD COLUMN "generatedAt"       TIMESTAMP(3),
  ADD COLUMN "expiresAt"         TIMESTAMP(3),
  ADD COLUMN "allowedRoles"      TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "ownerUserId"       TEXT,
  ADD COLUMN "deletedAt"         TIMESTAMP(3);

-- CreateTable: document_audit_logs
CREATE TABLE "document_audit_logs" (
  "id"          TEXT NOT NULL,
  "documentId"  TEXT NOT NULL,
  "actorId"     TEXT,
  "action"      TEXT NOT NULL,
  "ipAddress"   TEXT,
  "userAgent"   TEXT,
  "metadata"    JSONB,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "document_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "document_audit_logs_documentId_idx" ON "document_audit_logs"("documentId");
CREATE INDEX "document_audit_logs_actorId_idx"    ON "document_audit_logs"("actorId");
CREATE INDEX "document_audit_logs_createdAt_idx"  ON "document_audit_logs"("createdAt");
CREATE INDEX "documents_category_idx"             ON "documents"("category");
CREATE INDEX "documents_ownerUserId_idx"          ON "documents"("ownerUserId");
CREATE INDEX "documents_deletedAt_idx"            ON "documents"("deletedAt");

-- AddForeignKey
ALTER TABLE "document_audit_logs"
  ADD CONSTRAINT "document_audit_logs_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
