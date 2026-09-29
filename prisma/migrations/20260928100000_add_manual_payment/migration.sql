-- CreateEnum
CREATE TYPE "ManualPaymentStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable: BankAccount
CREATE TABLE "bank_accounts" (
    "id"            TEXT NOT NULL,
    "bankName"      TEXT NOT NULL,
    "accountName"   TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "routingNumber" TEXT,
    "branchName"    TEXT,
    "instructions"  TEXT,
    "isActive"      BOOLEAN NOT NULL DEFAULT true,
    "createdBy"     TEXT NOT NULL,
    "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"     TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "bank_accounts_isActive_idx" ON "bank_accounts"("isActive");

-- CreateTable: ManualPaymentSubmission
CREATE TABLE "manual_payment_submissions" (
    "id"              TEXT NOT NULL,
    "investmentId"    TEXT NOT NULL,
    "submittedBy"     TEXT NOT NULL,
    "status"          "ManualPaymentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "amountBdt"       DECIMAL(14,2) NOT NULL,
    "bankAccountId"   TEXT NOT NULL,
    "transactionRef"  TEXT NOT NULL,
    "proofFileUrl"    TEXT NOT NULL,
    "proofMimeType"   TEXT NOT NULL,
    "notes"           TEXT,
    "reviewedBy"      TEXT,
    "reviewedAt"      TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_payment_submissions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "manual_payment_submissions_investmentId_idx" ON "manual_payment_submissions"("investmentId");
CREATE INDEX "manual_payment_submissions_status_idx"       ON "manual_payment_submissions"("status");
CREATE INDEX "manual_payment_submissions_submittedBy_idx"  ON "manual_payment_submissions"("submittedBy");
CREATE INDEX "manual_payment_submissions_createdAt_idx"    ON "manual_payment_submissions"("createdAt");

-- AddForeignKey
ALTER TABLE "manual_payment_submissions"
    ADD CONSTRAINT "manual_payment_submissions_investmentId_fkey"
    FOREIGN KEY ("investmentId") REFERENCES "investments"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
