-- Remove farmer/agriculture module and simplify schema

-- 1. Drop dependent tables first (leaf → root order)
DROP TABLE IF EXISTS "sales" CASCADE;
DROP TABLE IF EXISTS "harvests" CASCADE;
DROP TABLE IF EXISTS "expenses" CASCADE;
DROP TABLE IF EXISTS "field_visits" CASCADE;
DROP TABLE IF EXISTS "crop_cycles" CASCADE;
DROP TABLE IF EXISTS "crops" CASCADE;
DROP TABLE IF EXISTS "fields" CASCADE;
DROP TABLE IF EXISTS "farms" CASCADE;
DROP TABLE IF EXISTS "farmer_profiles" CASCADE;
DROP TABLE IF EXISTS "field_officer_profiles" CASCADE;

-- 2. Remove farmId FK and column from projects
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_farmId_fkey";
ALTER TABLE "projects" DROP COLUMN IF EXISTS "farmId";

-- 3. Remove document FK constraints for removed entity types
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "document_field_visit_fk";
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "document_project_update_fk";

-- 4. Delete FARMER and FIELD_OFFICER role_permissions rows BEFORE enum change
DELETE FROM "role_permissions" WHERE "role"::text IN ('FARMER', 'FIELD_OFFICER');

-- 5. Delete FARMER and FIELD_OFFICER users' sessions to avoid FK issues
-- (users themselves stay, just get migrated to INVESTOR/SUPPORT)

-- 6. Remove FARMER and FIELD_OFFICER from UserRole enum
ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TYPE "UserRole" RENAME TO "UserRole_old";
CREATE TYPE "UserRole" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'FINANCE_OFFICER',
  'PROJECT_MANAGER',
  'KYC_OFFICER',
  'SUPPORT',
  'INVESTOR'
);
ALTER TABLE "users" ALTER COLUMN "role" TYPE "UserRole" USING (
  CASE "role"::text
    WHEN 'FARMER' THEN 'INVESTOR'
    WHEN 'FIELD_OFFICER' THEN 'SUPPORT'
    ELSE "role"::text
  END::"UserRole"
);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'INVESTOR';
ALTER TABLE "role_permissions" ALTER COLUMN "role" TYPE "UserRole" USING ("role"::text::"UserRole");
DROP TYPE "UserRole_old";

-- 7. Remove farm-related enums
DROP TYPE IF EXISTS "FarmStatus";
DROP TYPE IF EXISTS "FieldStatus";
DROP TYPE IF EXISTS "CropCategory";
DROP TYPE IF EXISTS "CropCycleStatus";
DROP TYPE IF EXISTS "ExpenseCategory";
DROP TYPE IF EXISTS "FieldVisitStatus";

-- 8. Update ProjectCategory enum
ALTER TYPE "ProjectCategory" RENAME TO "ProjectCategory_old";
CREATE TYPE "ProjectCategory" AS ENUM (
  'REAL_ESTATE',
  'TRADE_FINANCE',
  'SME',
  'TECHNOLOGY',
  'INFRASTRUCTURE',
  'OTHER'
);
ALTER TABLE "projects" ALTER COLUMN "category" TYPE "ProjectCategory" USING 'OTHER'::"ProjectCategory";
DROP TYPE "ProjectCategory_old";

-- 9. Update ProjectStatus enum (remove HARVESTING, SOLD, PROFIT_CALCULATION, DISTRIBUTION)
ALTER TABLE "projects" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "ProjectStatus" RENAME TO "ProjectStatus_old";
CREATE TYPE "ProjectStatus" AS ENUM (
  'DRAFT',
  'PENDING_APPROVAL',
  'APPROVED',
  'FUNDRAISING',
  'FUNDED',
  'ACTIVE',
  'COMPLETED',
  'CANCELLED'
);
ALTER TABLE "projects" ALTER COLUMN "status" TYPE "ProjectStatus" USING (
  CASE "status"::text
    WHEN 'HARVESTING' THEN 'ACTIVE'
    WHEN 'SOLD' THEN 'ACTIVE'
    WHEN 'PROFIT_CALCULATION' THEN 'COMPLETED'
    WHEN 'DISTRIBUTION' THEN 'COMPLETED'
    ELSE "status"::text
  END::"ProjectStatus"
);
ALTER TABLE "projects" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
DROP TYPE "ProjectStatus_old";

-- 10. Update ProjectUpdateType enum
ALTER TABLE "project_updates" ALTER COLUMN "type" DROP DEFAULT;
ALTER TYPE "ProjectUpdateType" RENAME TO "ProjectUpdateType_old";
CREATE TYPE "ProjectUpdateType" AS ENUM (
  'GENERAL',
  'MILESTONE',
  'ISSUE',
  'FINANCIAL_REPORT'
);
ALTER TABLE "project_updates" ALTER COLUMN "type" TYPE "ProjectUpdateType" USING (
  CASE "type"::text
    WHEN 'HARVEST_REPORT' THEN 'FINANCIAL_REPORT'
    WHEN 'FIELD_VISIT_REPORT' THEN 'GENERAL'
    ELSE "type"::text
  END::"ProjectUpdateType"
);
DROP TYPE "ProjectUpdateType_old";

-- 11. Update DocumentEntityType enum
ALTER TYPE "DocumentEntityType" RENAME TO "DocumentEntityType_old";
CREATE TYPE "DocumentEntityType" AS ENUM (
  'USER',
  'KYC',
  'PROJECT',
  'INVESTMENT',
  'CONTRACT'
);
ALTER TABLE "documents" ALTER COLUMN "entityType" TYPE "DocumentEntityType" USING (
  CASE "entityType"::text
    WHEN 'FARM' THEN 'PROJECT'
    WHEN 'HARVEST' THEN 'PROJECT'
    WHEN 'EXPENSE' THEN 'PROJECT'
    WHEN 'FIELD_VISIT' THEN 'PROJECT'
    ELSE "entityType"::text
  END::"DocumentEntityType"
);
DROP TYPE "DocumentEntityType_old";

-- 12. Update WalletType enum (remove FARMER)
ALTER TABLE "wallets" ALTER COLUMN "type" DROP DEFAULT;
ALTER TYPE "WalletType" RENAME TO "WalletType_old";
CREATE TYPE "WalletType" AS ENUM (
  'INVESTOR',
  'PLATFORM_REVENUE',
  'PLATFORM_ESCROW'
);
ALTER TABLE "wallets" ALTER COLUMN "type" TYPE "WalletType" USING (
  CASE "type"::text
    WHEN 'FARMER' THEN 'INVESTOR'
    ELSE "type"::text
  END::"WalletType"
);
DROP TYPE "WalletType_old";
