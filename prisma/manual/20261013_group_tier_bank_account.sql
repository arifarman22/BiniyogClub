-- Link each group tier to the bank account investors pay into, and add the
-- group.manage permission for Super Admin, Admin and Project Manager.
-- Idempotent: safe to re-run. Apply with:
--   npx prisma db execute --file prisma/manual/20261013_group_tier_bank_account.sql --schema prisma/schema.prisma

ALTER TABLE "group_tiers" ADD COLUMN IF NOT EXISTS "bankAccountId" TEXT;

CREATE INDEX IF NOT EXISTS "group_tiers_bankAccountId_idx" ON "group_tiers"("bankAccountId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'group_tiers_bankAccountId_fkey') THEN
    ALTER TABLE "group_tiers"
      ADD CONSTRAINT "group_tiers_bankAccountId_fkey" FOREIGN KEY ("bankAccountId")
      REFERENCES "bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

INSERT INTO "permissions" ("id", "key", "description", "createdAt")
VALUES (gen_random_uuid()::text, 'group.manage', 'Create and edit business groups, entities and tiers', NOW())
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role", "permissionId", "createdAt")
SELECT gen_random_uuid()::text, r.role::"UserRole", p.id, NOW()
FROM "permissions" p
CROSS JOIN (VALUES ('SUPER_ADMIN'), ('ADMIN'), ('PROJECT_MANAGER')) AS r(role)
WHERE p.key = 'group.manage'
ON CONFLICT ("role", "permissionId") DO NOTHING;
