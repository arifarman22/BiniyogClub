-- CreateEnum
CREATE TYPE "GroupSlug" AS ENUM ('MARINERS', 'MOHS', 'MARINOZZ');
CREATE TYPE "TierType" AS ENUM ('INVESTOR', 'SHAREHOLDER', 'DIRECTORSHIP', 'PLOT_BOOKING', 'LAND_SHARE');
CREATE TYPE "GroupInvestmentStatus" AS ENUM ('PENDING', 'PAYMENT_PENDING', 'ACTIVE', 'CANCELLED', 'COMPLETED');

-- BusinessGroup
CREATE TABLE "business_groups" (
    "id"          TEXT NOT NULL,
    "slug"        "GroupSlug" NOT NULL,
    "name"        TEXT NOT NULL,
    "tagline"     TEXT,
    "description" TEXT NOT NULL,
    "logoUrl"     TEXT,
    "coverUrl"    TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "business_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "business_groups_slug_key" ON "business_groups"("slug");

-- GroupEntity
CREATE TABLE "group_entities" (
    "id"          TEXT NOT NULL,
    "groupId"     TEXT NOT NULL,
    "name"        TEXT NOT NULL,
    "slug"        TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "logoUrl"     TEXT,
    "isActive"    BOOLEAN NOT NULL DEFAULT true,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"   TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_entities_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "group_entities_slug_key" ON "group_entities"("slug");
CREATE INDEX "group_entities_groupId_idx" ON "group_entities"("groupId");

-- GroupTier
CREATE TABLE "group_tiers" (
    "id"                TEXT NOT NULL,
    "entityId"          TEXT NOT NULL,
    "type"              "TierType" NOT NULL,
    "name"              TEXT NOT NULL,
    "description"       TEXT NOT NULL,
    "benefits"          TEXT[] NOT NULL DEFAULT '{}',
    "minAmountBdt"      DECIMAL(14,2) NOT NULL,
    "maxAmountBdt"      DECIMAL(14,2),
    "plotSizeSqft"      DECIMAL(10,2),
    "pricePerSqftBdt"   DECIMAL(10,2),
    "totalUnits"        INTEGER,
    "availableUnits"    INTEGER,
    "expectedReturnPct" DECIMAL(6,4),
    "durationMonths"    INTEGER,
    "isActive"          BOOLEAN NOT NULL DEFAULT true,
    "sortOrder"         INTEGER NOT NULL DEFAULT 0,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_tiers_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "group_tiers_entityId_idx" ON "group_tiers"("entityId");

-- GroupInvestment
CREATE TABLE "group_investments" (
    "id"              TEXT NOT NULL,
    "tierId"          TEXT NOT NULL,
    "investorUserId"  TEXT NOT NULL,
    "status"          "GroupInvestmentStatus" NOT NULL DEFAULT 'PENDING',
    "amountBdt"       DECIMAL(14,2) NOT NULL,
    "plotNumber"      TEXT,
    "plotSizeSqft"    DECIMAL(10,2),
    "sharePercentage" DECIMAL(6,4),
    "notes"           TEXT,
    "receiptNumber"   TEXT,
    "confirmedAt"     TIMESTAMP(3),
    "cancelledAt"     TIMESTAMP(3),
    "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"       TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_investments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "group_investments_receiptNumber_key" ON "group_investments"("receiptNumber");
CREATE INDEX "group_investments_tierId_idx"         ON "group_investments"("tierId");
CREATE INDEX "group_investments_investorUserId_idx" ON "group_investments"("investorUserId");
CREATE INDEX "group_investments_status_idx"         ON "group_investments"("status");

-- GroupInvestmentPayment
CREATE TABLE "group_investment_payments" (
    "id"                TEXT NOT NULL,
    "groupInvestmentId" TEXT NOT NULL,
    "submittedBy"       TEXT NOT NULL,
    "status"            "ManualPaymentStatus" NOT NULL DEFAULT 'SUBMITTED',
    "amountBdt"         DECIMAL(14,2) NOT NULL,
    "bankAccountId"     TEXT NOT NULL,
    "transactionRef"    TEXT NOT NULL,
    "proofFileUrl"      TEXT NOT NULL,
    "proofMimeType"     TEXT NOT NULL,
    "notes"             TEXT,
    "reviewedBy"        TEXT,
    "reviewedAt"        TIMESTAMP(3),
    "rejectionReason"   TEXT,
    "createdAt"         TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3) NOT NULL,
    CONSTRAINT "group_investment_payments_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "group_investment_payments_groupInvestmentId_idx" ON "group_investment_payments"("groupInvestmentId");
CREATE INDEX "group_investment_payments_status_idx"            ON "group_investment_payments"("status");

-- FKs
ALTER TABLE "group_entities" ADD CONSTRAINT "group_entities_groupId_fkey"
    FOREIGN KEY ("groupId") REFERENCES "business_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_tiers" ADD CONSTRAINT "group_tiers_entityId_fkey"
    FOREIGN KEY ("entityId") REFERENCES "group_entities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_investments" ADD CONSTRAINT "group_investments_tierId_fkey"
    FOREIGN KEY ("tierId") REFERENCES "group_tiers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_investments" ADD CONSTRAINT "group_investments_investorUserId_fkey"
    FOREIGN KEY ("investorUserId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "group_investment_payments" ADD CONSTRAINT "group_investment_payments_groupInvestmentId_fkey"
    FOREIGN KEY ("groupInvestmentId") REFERENCES "group_investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
