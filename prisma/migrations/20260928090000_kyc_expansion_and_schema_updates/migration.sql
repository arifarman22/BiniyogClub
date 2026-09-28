-- ─── Enum: KycStatus — replace old values ────────────────────────────────────
ALTER TYPE "KycStatus" RENAME TO "KycStatus_old";
CREATE TYPE "KycStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'RESUBMISSION_REQUIRED');
ALTER TABLE "kyc" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "kyc" ALTER COLUMN "status" TYPE "KycStatus" USING (
  CASE "status"::text
    WHEN 'NOT_SUBMITTED' THEN 'NOT_STARTED'
    WHEN 'PENDING'       THEN 'SUBMITTED'
    WHEN 'APPROVED'      THEN 'VERIFIED'
    WHEN 'EXPIRED'       THEN 'REJECTED'
    ELSE 'NOT_STARTED'
  END
)::"KycStatus";
ALTER TABLE "kyc" ALTER COLUMN "status" SET DEFAULT 'NOT_STARTED';
DROP TYPE "KycStatus_old";

-- ─── Enum: ProjectStatus — add new values ────────────────────────────────────
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'FUNDRAISING';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'FUNDED';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'SOLD';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'PROFIT_CALCULATION';
ALTER TYPE "ProjectStatus" ADD VALUE IF NOT EXISTS 'DISTRIBUTION';

-- ─── Enum: InvestmentStatus — add new values ─────────────────────────────────
ALTER TYPE "InvestmentStatus" ADD VALUE IF NOT EXISTS 'PAYMENT_PENDING';
ALTER TYPE "InvestmentStatus" ADD VALUE IF NOT EXISTS 'MATURED';
ALTER TYPE "InvestmentStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "InvestmentStatus" ADD VALUE IF NOT EXISTS 'REFUNDED';

-- ─── Enum: GatewayPaymentStatus (new) ────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "GatewayPaymentStatus" AS ENUM ('INITIATED', 'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Enum: LedgerTxStatus (new) ──────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE "LedgerTxStatus" AS ENUM ('POSTED', 'VOIDED');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ─── Table: kyc — rename rejectionReason → reviewNote, add new columns ───────
ALTER TABLE "kyc" RENAME COLUMN "rejectionReason" TO "reviewNote";
ALTER TABLE "kyc"
  ADD COLUMN IF NOT EXISTS "fullName"          TEXT,
  ADD COLUMN IF NOT EXISTS "dateOfBirth"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "nationality"       TEXT DEFAULT 'BD',
  ADD COLUMN IF NOT EXISTS "addressLine"       TEXT,
  ADD COLUMN IF NOT EXISTS "city"              TEXT,
  ADD COLUMN IF NOT EXISTS "district"          TEXT,
  ADD COLUMN IF NOT EXISTS "division"          TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode"        TEXT,
  ADD COLUMN IF NOT EXISTS "documentType"      "KycDocumentType",
  ADD COLUMN IF NOT EXISTS "documentNumber"    TEXT,
  ADD COLUMN IF NOT EXISTS "bankName"          TEXT,
  ADD COLUMN IF NOT EXISTS "bankAccountNumber" TEXT,
  ADD COLUMN IF NOT EXISTS "mobileProvider"    TEXT,
  ADD COLUMN IF NOT EXISTS "mobileNumber"      TEXT;
CREATE INDEX IF NOT EXISTS "kyc_reviewedBy_idx" ON "kyc"("reviewedBy");

-- ─── Table: kyc_documents — replace documentUrl with storageKey/mimeType/size ─
ALTER TABLE "kyc_documents"
  ADD COLUMN IF NOT EXISTS "storageKey" TEXT,
  ADD COLUMN IF NOT EXISTS "mimeType"   TEXT,
  ADD COLUMN IF NOT EXISTS "sizeBytes"  INTEGER;
-- Backfill: copy documentUrl → storageKey for any existing rows
UPDATE "kyc_documents" SET "storageKey" = "documentUrl", "mimeType" = 'application/octet-stream', "sizeBytes" = 0 WHERE "storageKey" IS NULL;
ALTER TABLE "kyc_documents" ALTER COLUMN "storageKey" SET NOT NULL;
ALTER TABLE "kyc_documents" ALTER COLUMN "mimeType" SET NOT NULL;
ALTER TABLE "kyc_documents" ALTER COLUMN "sizeBytes" SET NOT NULL;
ALTER TABLE "kyc_documents" DROP COLUMN IF EXISTS "documentUrl";

-- ─── Table: ledger_transactions — add new columns ────────────────────────────
ALTER TABLE "ledger_transactions"
  ADD COLUMN IF NOT EXISTS "status"         "LedgerTxStatus" NOT NULL DEFAULT 'POSTED',
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT,
  ADD COLUMN IF NOT EXISTS "currency"       TEXT NOT NULL DEFAULT 'BDT',
  ADD COLUMN IF NOT EXISTS "metadata"       JSONB,
  ADD COLUMN IF NOT EXISTS "postedAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "voidedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "voidReason"     TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "ledger_transactions_idempotencyKey_key" ON "ledger_transactions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "ledger_transactions_status_idx" ON "ledger_transactions"("status");
CREATE INDEX IF NOT EXISTS "ledger_transactions_idempotencyKey_idx" ON "ledger_transactions"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "ledger_transactions_postedAt_idx" ON "ledger_transactions"("postedAt");

-- ─── Table: investments — add new columns + unique constraints ────────────────
ALTER TABLE "investments"
  ADD COLUMN IF NOT EXISTS "idempotencyKey"   TEXT,
  ADD COLUMN IF NOT EXISTS "paymentPendingAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refundedAt"       TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "completedAt"      TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "receiptNumber"    TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "investments_idempotencyKey_key" ON "investments"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "investments_receiptNumber_key" ON "investments"("receiptNumber");
CREATE INDEX IF NOT EXISTS "investments_idempotencyKey_idx" ON "investments"("idempotencyKey");

-- ─── Table: payments — add idempotencyKey ────────────────────────────────────
ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "payments_idempotencyKey_idx" ON "payments"("idempotencyKey");

-- ─── Table: withdrawals — add idempotencyKey + ledgerTransactionId ───────────
ALTER TABLE "withdrawals"
  ADD COLUMN IF NOT EXISTS "idempotencyKey"      TEXT,
  ADD COLUMN IF NOT EXISTS "ledgerTransactionId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "withdrawals_idempotencyKey_key" ON "withdrawals"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "withdrawals_idempotencyKey_idx" ON "withdrawals"("idempotencyKey");

-- ─── Table: projects — add new columns ───────────────────────────────────────
ALTER TABLE "projects"
  ADD COLUMN IF NOT EXISTS "managerId"          TEXT,
  ADD COLUMN IF NOT EXISTS "riskInfo"           TEXT,
  ADD COLUMN IF NOT EXISTS "location"           TEXT,
  ADD COLUMN IF NOT EXISTS "imageUrls"          TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "rejectionReason"    TEXT;
-- fundingMinBdt, maxInvestmentBdt, reviewedBy, reviewedAt, approvedAt, completedAt, cancelledAt, cancellationReason already exist in init
CREATE INDEX IF NOT EXISTS "projects_managerId_idx" ON "projects"("managerId");
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_managerId_fkey";
ALTER TABLE "projects" ADD CONSTRAINT "projects_managerId_fkey"
  FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ─── Table: wallet_snapshots — create ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "wallet_snapshots" (
  "id"            TEXT NOT NULL,
  "walletId"      TEXT NOT NULL,
  "balanceBdt"    DECIMAL(14,2) NOT NULL,
  "ledgerEntryId" TEXT NOT NULL,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_snapshots_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "wallet_snapshots_walletId_idx" ON "wallet_snapshots"("walletId");
CREATE INDEX IF NOT EXISTS "wallet_snapshots_createdAt_idx" ON "wallet_snapshots"("createdAt");
ALTER TABLE "wallet_snapshots" DROP CONSTRAINT IF EXISTS "wallet_snapshots_walletId_fkey";
ALTER TABLE "wallet_snapshots" ADD CONSTRAINT "wallet_snapshots_walletId_fkey"
  FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Table: gateway_payments — create ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "gateway_payments" (
  "id"                TEXT NOT NULL,
  "investmentId"      TEXT NOT NULL,
  "walletId"          TEXT,
  "provider"          TEXT NOT NULL,
  "status"            "GatewayPaymentStatus" NOT NULL DEFAULT 'INITIATED',
  "amountBdt"         DECIMAL(14,2) NOT NULL,
  "currency"          TEXT NOT NULL DEFAULT 'BDT',
  "idempotencyKey"    TEXT NOT NULL,
  "providerPaymentId" TEXT,
  "providerOrderId"   TEXT,
  "checkoutUrl"       TEXT,
  "verifiedAt"        TIMESTAMP(3),
  "verifiedBy"        TEXT,
  "expiresAt"         TIMESTAMP(3),
  "failureReason"     TEXT,
  "providerMetadata"  JSONB,
  "callbackPayload"   JSONB,
  "refundedAt"        TIMESTAMP(3),
  "refundReference"   TEXT,
  "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "gateway_payments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "gateway_payments_idempotencyKey_key" ON "gateway_payments"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "gateway_payments_investmentId_idx" ON "gateway_payments"("investmentId");
CREATE INDEX IF NOT EXISTS "gateway_payments_provider_idx" ON "gateway_payments"("provider");
CREATE INDEX IF NOT EXISTS "gateway_payments_status_idx" ON "gateway_payments"("status");
CREATE INDEX IF NOT EXISTS "gateway_payments_idempotencyKey_idx" ON "gateway_payments"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "gateway_payments_providerPaymentId_idx" ON "gateway_payments"("providerPaymentId");
CREATE INDEX IF NOT EXISTS "gateway_payments_createdAt_idx" ON "gateway_payments"("createdAt");
ALTER TABLE "gateway_payments" DROP CONSTRAINT IF EXISTS "gateway_payments_investmentId_fkey";
ALTER TABLE "gateway_payments" ADD CONSTRAINT "gateway_payments_investmentId_fkey"
  FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Table: webhook_events — create ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS "webhook_events" (
  "id"          TEXT NOT NULL,
  "provider"    TEXT NOT NULL,
  "eventId"     TEXT NOT NULL,
  "eventType"   TEXT NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "payload"     JSONB NOT NULL,
  CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "webhook_events_provider_eventId_key" ON "webhook_events"("provider", "eventId");
CREATE INDEX IF NOT EXISTS "webhook_events_provider_eventId_idx" ON "webhook_events"("provider", "eventId");
CREATE INDEX IF NOT EXISTS "webhook_events_processedAt_idx" ON "webhook_events"("processedAt");
