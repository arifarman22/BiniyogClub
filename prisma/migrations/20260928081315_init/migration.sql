-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INVESTOR', 'FARMER', 'FIELD_OFFICER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "VerificationTokenType" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'OTP');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('NOT_SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('NATIONAL_ID', 'PASSPORT', 'DRIVING_LICENSE', 'UTILITY_BILL', 'BANK_STATEMENT', 'TAX_CERTIFICATE', 'LAND_DEED');

-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "FieldStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'FALLOW', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "CropCategory" AS ENUM ('GRAIN', 'VEGETABLE', 'FRUIT', 'LEGUME', 'OILSEED', 'FIBER', 'SPICE', 'OTHER');

-- CreateEnum
CREATE TYPE "CropCycleStatus" AS ENUM ('PLANNED', 'PLANTED', 'GROWING', 'HARVESTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'FUNDING', 'ACTIVE', 'HARVESTING', 'COMPLETED', 'CANCELLED', 'FAILED');

-- CreateEnum
CREATE TYPE "ProjectCategory" AS ENUM ('CROP_FARMING', 'LIVESTOCK', 'AQUACULTURE', 'POULTRY', 'DAIRY', 'HORTICULTURE', 'AGRO_PROCESSING', 'OTHER');

-- CreateEnum
CREATE TYPE "ProjectUpdateType" AS ENUM ('GENERAL', 'MILESTONE', 'ISSUE', 'HARVEST_REPORT', 'FINANCIAL_REPORT', 'FIELD_VISIT_REPORT');

-- CreateEnum
CREATE TYPE "InvestmentStatus" AS ENUM ('PENDING', 'CONFIRMED', 'ACTIVE', 'MATURED', 'CANCELLED', 'DEFAULTED');

-- CreateEnum
CREATE TYPE "ReturnType" AS ENUM ('FIXED_RETURN', 'PROFIT_SHARE', 'HYBRID');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'SENT', 'SIGNED', 'EXPIRED', 'VOIDED');

-- CreateEnum
CREATE TYPE "WalletType" AS ENUM ('INVESTOR', 'FARMER', 'PLATFORM_REVENUE', 'PLATFORM_ESCROW');

-- CreateEnum
CREATE TYPE "LedgerEntryType" AS ENUM ('DEBIT', 'CREDIT');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('INVESTMENT_FUNDING', 'INVESTMENT_RETURN', 'PROFIT_DISTRIBUTION', 'PLATFORM_FEE', 'WITHDRAWAL', 'DEPOSIT', 'REFUND', 'PENALTY', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'MOBILE_BANKING', 'CARD', 'WALLET');

-- CreateEnum
CREATE TYPE "PaymentDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "WithdrawalStatus" AS ENUM ('PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('SEEDS', 'FERTILIZER', 'PESTICIDE', 'LABOR', 'EQUIPMENT', 'IRRIGATION', 'TRANSPORT', 'STORAGE', 'INSURANCE', 'LAND_LEASE', 'OTHER');

-- CreateEnum
CREATE TYPE "FieldVisitStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "DocumentEntityType" AS ENUM ('USER', 'KYC', 'PROJECT', 'FARM', 'INVESTMENT', 'CONTRACT', 'HARVEST', 'EXPENSE', 'FIELD_VISIT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INVESTMENT_CONFIRMED', 'INVESTMENT_MATURED', 'PAYMENT_RECEIVED', 'PAYMENT_FAILED', 'PROJECT_APPROVED', 'PROJECT_FUNDED', 'PROJECT_UPDATE', 'KYC_APPROVED', 'KYC_REJECTED', 'WITHDRAWAL_APPROVED', 'WITHDRAWAL_COMPLETED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUSPEND', 'ACTIVATE', 'LOGIN', 'LOGOUT', 'EXPORT');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'INVESTOR',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatarUrl" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" "VerificationTokenType" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "permissionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "KycStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kyc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kyc_documents" (
    "id" TEXT NOT NULL,
    "kycId" TEXT NOT NULL,
    "documentType" "KycDocumentType" NOT NULL,
    "documentUrl" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investor_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nationalId" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BD',
    "occupation" TEXT,
    "annualIncomeRange" TEXT,
    "investmentExperience" TEXT,
    "riskTolerance" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investor_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nationalId" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'BD',
    "yearsExperience" INTEGER,
    "specializations" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_officer_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "region" TEXT,
    "assignedArea" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_officer_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farms" (
    "id" TEXT NOT NULL,
    "farmerProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "FarmStatus" NOT NULL DEFAULT 'ACTIVE',
    "totalAreaAcres" DECIMAL(10,4) NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "division" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'BD',
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "areaAcres" DECIMAL(10,4) NOT NULL,
    "status" "FieldStatus" NOT NULL DEFAULT 'AVAILABLE',
    "soilType" TEXT,
    "irrigationType" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crops" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "localName" TEXT,
    "category" "CropCategory" NOT NULL,
    "growthDays" INTEGER,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crops_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "crop_cycles" (
    "id" TEXT NOT NULL,
    "fieldId" TEXT NOT NULL,
    "cropId" TEXT NOT NULL,
    "projectId" TEXT,
    "status" "CropCycleStatus" NOT NULL DEFAULT 'PLANNED',
    "plantedAt" TIMESTAMP(3),
    "expectedHarvestAt" TIMESTAMP(3),
    "actualHarvestAt" TIMESTAMP(3),
    "areaAcres" DECIMAL(10,4) NOT NULL,
    "expectedYieldKg" DECIMAL(12,4),
    "actualYieldKg" DECIMAL(12,4),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crop_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "farmId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProjectCategory" NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "fundingGoalBdt" DECIMAL(14,2) NOT NULL,
    "fundingMinBdt" DECIMAL(14,2) NOT NULL,
    "fundedAmountBdt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "minInvestmentBdt" DECIMAL(14,2) NOT NULL,
    "maxInvestmentBdt" DECIMAL(14,2),
    "returnType" "ReturnType" NOT NULL,
    "expectedReturnPct" DECIMAL(6,4) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "fundingDeadline" TIMESTAMP(3) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "coverImageUrl" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_updates" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "type" "ProjectUpdateType" NOT NULL DEFAULT 'GENERAL',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investments" (
    "id" TEXT NOT NULL,
    "investorProfileId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "status" "InvestmentStatus" NOT NULL DEFAULT 'PENDING',
    "amountBdt" DECIMAL(14,2) NOT NULL,
    "expectedReturnBdt" DECIMAL(14,2) NOT NULL,
    "actualReturnBdt" DECIMAL(14,2),
    "returnType" "ReturnType" NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "activatedAt" TIMESTAMP(3),
    "maturedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investment_contracts" (
    "id" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "contractUrl" TEXT,
    "templateVersion" TEXT NOT NULL,
    "terms" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedByIp" TEXT,
    "expiresAt" TIMESTAMP(3),
    "voidedAt" TIMESTAMP(3),
    "voidReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investment_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profit_distributions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "investmentId" TEXT NOT NULL,
    "amountBdt" DECIMAL(14,2) NOT NULL,
    "platformFeeBdt" DECIMAL(14,2) NOT NULL,
    "netAmountBdt" DECIMAL(14,2) NOT NULL,
    "distributedAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profit_distributions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletType" NOT NULL,
    "cachedBalance" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" TEXT NOT NULL,
    "type" "LedgerTransactionType" NOT NULL,
    "investmentId" TEXT,
    "referenceId" TEXT,
    "referenceType" TEXT,
    "description" TEXT NOT NULL,
    "amountBdt" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "ledgerTransactionId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "entryType" "LedgerEntryType" NOT NULL,
    "amountBdt" DECIMAL(14,2) NOT NULL,
    "balanceAfterBdt" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "direction" "PaymentDirection" NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amountBdt" DECIMAL(14,2) NOT NULL,
    "feeBdt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netAmountBdt" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "externalReference" TEXT,
    "gatewayResponse" JSONB,
    "description" TEXT,
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "withdrawals" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'PENDING',
    "amountBdt" DECIMAL(14,2) NOT NULL,
    "feeBdt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netAmountBdt" DECIMAL(14,2) NOT NULL,
    "bankName" TEXT,
    "accountNumber" TEXT,
    "accountName" TEXT,
    "mobileNumber" TEXT,
    "method" "PaymentMethod" NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harvests" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "cropCycleId" TEXT NOT NULL,
    "harvestedAt" TIMESTAMP(3) NOT NULL,
    "yieldKg" DECIMAL(12,4) NOT NULL,
    "qualityGrade" TEXT,
    "storageLocation" TEXT,
    "notes" TEXT,
    "recordedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "harvests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "harvestId" TEXT NOT NULL,
    "buyerName" TEXT,
    "quantityKg" DECIMAL(12,4) NOT NULL,
    "pricePerKgBdt" DECIMAL(10,4) NOT NULL,
    "totalAmountBdt" DECIMAL(14,2) NOT NULL,
    "soldAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "cropCycleId" TEXT,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amountBdt" DECIMAL(14,2) NOT NULL,
    "incurredAt" TIMESTAMP(3) NOT NULL,
    "receiptUrl" TEXT,
    "recordedBy" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "field_visits" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fieldOfficerProfileId" TEXT NOT NULL,
    "status" "FieldVisitStatus" NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "summary" TEXT,
    "findings" TEXT,
    "recommendations" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "entityType" "DocumentEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_deletedAt_idx" ON "users"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_expiresAt_idx" ON "sessions"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_userId_type_idx" ON "verification_tokens"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");

-- CreateIndex
CREATE INDEX "role_permissions_role_idx" ON "role_permissions"("role");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_permissionId_key" ON "role_permissions"("role", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "kyc_userId_key" ON "kyc"("userId");

-- CreateIndex
CREATE INDEX "kyc_status_idx" ON "kyc"("status");

-- CreateIndex
CREATE INDEX "kyc_documents_kycId_idx" ON "kyc_documents"("kycId");

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_userId_key" ON "investor_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "investor_profiles_nationalId_key" ON "investor_profiles"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_profiles_userId_key" ON "farmer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_profiles_nationalId_key" ON "farmer_profiles"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "field_officer_profiles_userId_key" ON "field_officer_profiles"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "field_officer_profiles_employeeId_key" ON "field_officer_profiles"("employeeId");

-- CreateIndex
CREATE INDEX "farms_farmerProfileId_idx" ON "farms"("farmerProfileId");

-- CreateIndex
CREATE INDEX "farms_status_idx" ON "farms"("status");

-- CreateIndex
CREATE INDEX "farms_district_idx" ON "farms"("district");

-- CreateIndex
CREATE INDEX "farms_deletedAt_idx" ON "farms"("deletedAt");

-- CreateIndex
CREATE INDEX "fields_farmId_idx" ON "fields"("farmId");

-- CreateIndex
CREATE INDEX "fields_status_idx" ON "fields"("status");

-- CreateIndex
CREATE UNIQUE INDEX "crops_name_key" ON "crops"("name");

-- CreateIndex
CREATE INDEX "crops_category_idx" ON "crops"("category");

-- CreateIndex
CREATE INDEX "crop_cycles_fieldId_idx" ON "crop_cycles"("fieldId");

-- CreateIndex
CREATE INDEX "crop_cycles_cropId_idx" ON "crop_cycles"("cropId");

-- CreateIndex
CREATE INDEX "crop_cycles_projectId_idx" ON "crop_cycles"("projectId");

-- CreateIndex
CREATE INDEX "crop_cycles_status_idx" ON "crop_cycles"("status");

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_farmId_idx" ON "projects"("farmId");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "projects_slug_idx" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_fundingDeadline_idx" ON "projects"("fundingDeadline");

-- CreateIndex
CREATE INDEX "projects_deletedAt_idx" ON "projects"("deletedAt");

-- CreateIndex
CREATE INDEX "project_updates_projectId_idx" ON "project_updates"("projectId");

-- CreateIndex
CREATE INDEX "project_updates_type_idx" ON "project_updates"("type");

-- CreateIndex
CREATE INDEX "investments_investorProfileId_idx" ON "investments"("investorProfileId");

-- CreateIndex
CREATE INDEX "investments_projectId_idx" ON "investments"("projectId");

-- CreateIndex
CREATE INDEX "investments_status_idx" ON "investments"("status");

-- CreateIndex
CREATE UNIQUE INDEX "investment_contracts_investmentId_key" ON "investment_contracts"("investmentId");

-- CreateIndex
CREATE INDEX "investment_contracts_status_idx" ON "investment_contracts"("status");

-- CreateIndex
CREATE INDEX "profit_distributions_projectId_idx" ON "profit_distributions"("projectId");

-- CreateIndex
CREATE INDEX "profit_distributions_investmentId_idx" ON "profit_distributions"("investmentId");

-- CreateIndex
CREATE INDEX "profit_distributions_distributedAt_idx" ON "profit_distributions"("distributedAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_userId_key" ON "wallets"("userId");

-- CreateIndex
CREATE INDEX "wallets_type_idx" ON "wallets"("type");

-- CreateIndex
CREATE INDEX "ledger_transactions_type_idx" ON "ledger_transactions"("type");

-- CreateIndex
CREATE INDEX "ledger_transactions_investmentId_idx" ON "ledger_transactions"("investmentId");

-- CreateIndex
CREATE INDEX "ledger_transactions_referenceId_referenceType_idx" ON "ledger_transactions"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "ledger_transactions_createdAt_idx" ON "ledger_transactions"("createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_ledgerTransactionId_idx" ON "ledger_entries"("ledgerTransactionId");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_idx" ON "ledger_entries"("walletId");

-- CreateIndex
CREATE INDEX "ledger_entries_entryType_idx" ON "ledger_entries"("entryType");

-- CreateIndex
CREATE INDEX "ledger_entries_createdAt_idx" ON "ledger_entries"("createdAt");

-- CreateIndex
CREATE INDEX "payments_walletId_idx" ON "payments"("walletId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_direction_idx" ON "payments"("direction");

-- CreateIndex
CREATE INDEX "payments_externalReference_idx" ON "payments"("externalReference");

-- CreateIndex
CREATE INDEX "payments_createdAt_idx" ON "payments"("createdAt");

-- CreateIndex
CREATE INDEX "withdrawals_walletId_idx" ON "withdrawals"("walletId");

-- CreateIndex
CREATE INDEX "withdrawals_status_idx" ON "withdrawals"("status");

-- CreateIndex
CREATE INDEX "withdrawals_createdAt_idx" ON "withdrawals"("createdAt");

-- CreateIndex
CREATE INDEX "harvests_projectId_idx" ON "harvests"("projectId");

-- CreateIndex
CREATE INDEX "harvests_cropCycleId_idx" ON "harvests"("cropCycleId");

-- CreateIndex
CREATE INDEX "harvests_harvestedAt_idx" ON "harvests"("harvestedAt");

-- CreateIndex
CREATE INDEX "sales_projectId_idx" ON "sales"("projectId");

-- CreateIndex
CREATE INDEX "sales_harvestId_idx" ON "sales"("harvestId");

-- CreateIndex
CREATE INDEX "sales_soldAt_idx" ON "sales"("soldAt");

-- CreateIndex
CREATE INDEX "expenses_projectId_idx" ON "expenses"("projectId");

-- CreateIndex
CREATE INDEX "expenses_cropCycleId_idx" ON "expenses"("cropCycleId");

-- CreateIndex
CREATE INDEX "expenses_category_idx" ON "expenses"("category");

-- CreateIndex
CREATE INDEX "expenses_incurredAt_idx" ON "expenses"("incurredAt");

-- CreateIndex
CREATE INDEX "field_visits_projectId_idx" ON "field_visits"("projectId");

-- CreateIndex
CREATE INDEX "field_visits_fieldOfficerProfileId_idx" ON "field_visits"("fieldOfficerProfileId");

-- CreateIndex
CREATE INDEX "field_visits_status_idx" ON "field_visits"("status");

-- CreateIndex
CREATE INDEX "field_visits_scheduledAt_idx" ON "field_visits"("scheduledAt");

-- CreateIndex
CREATE INDEX "documents_entityType_entityId_idx" ON "documents"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "documents_uploadedBy_idx" ON "documents"("uploadedBy");

-- CreateIndex
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications"("userId", "isRead");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc" ADD CONSTRAINT "kyc_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_kycId_fkey" FOREIGN KEY ("kycId") REFERENCES "kyc"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investor_profiles" ADD CONSTRAINT "investor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_profiles" ADD CONSTRAINT "farmer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_officer_profiles" ADD CONSTRAINT "field_officer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farms" ADD CONSTRAINT "farms_farmerProfileId_fkey" FOREIGN KEY ("farmerProfileId") REFERENCES "farmer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "fields"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_cropId_fkey" FOREIGN KEY ("cropId") REFERENCES "crops"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "crop_cycles" ADD CONSTRAINT "crop_cycles_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "farms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_updates" ADD CONSTRAINT "project_updates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_investorProfileId_fkey" FOREIGN KEY ("investorProfileId") REFERENCES "investor_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investments" ADD CONSTRAINT "investments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investment_contracts" ADD CONSTRAINT "investment_contracts_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_distributions" ADD CONSTRAINT "profit_distributions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profit_distributions" ADD CONSTRAINT "profit_distributions_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_investmentId_fkey" FOREIGN KEY ("investmentId") REFERENCES "investments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_ledgerTransactionId_fkey" FOREIGN KEY ("ledgerTransactionId") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "withdrawals" ADD CONSTRAINT "withdrawals_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harvests" ADD CONSTRAINT "harvests_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_harvestId_fkey" FOREIGN KEY ("harvestId") REFERENCES "harvests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_cropCycleId_fkey" FOREIGN KEY ("cropCycleId") REFERENCES "crop_cycles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "field_visits" ADD CONSTRAINT "field_visits_fieldOfficerProfileId_fkey" FOREIGN KEY ("fieldOfficerProfileId") REFERENCES "field_officer_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "document_project_fk" FOREIGN KEY ("entityId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "document_project_update_fk" FOREIGN KEY ("entityId") REFERENCES "project_updates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "document_field_visit_fk" FOREIGN KEY ("entityId") REFERENCES "field_visits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
