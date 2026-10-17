-- Combined (multi-method) payments + richer signup profile.
--  * manual_payment_submissions.batchId        — parts submitted together share it and are reviewed as one
--  * manual_payment_submissions.cashReceivedBy — who received a cash payment (CEO / MD / CHAIRMAN / FINANCE_TEAM)
--  * investor_profiles.nomineeName             — optional nominee name collected at signup
-- Idempotent: safe to re-run. Apply with:
--   npx prisma db execute --file prisma/manual/20261017_payment_batches_and_signup_profile.sql --schema prisma/schema.prisma

ALTER TABLE "manual_payment_submissions" ADD COLUMN IF NOT EXISTS "batchId" TEXT;
ALTER TABLE "manual_payment_submissions" ADD COLUMN IF NOT EXISTS "cashReceivedBy" TEXT;
CREATE INDEX IF NOT EXISTS "manual_payment_submissions_batchId_idx" ON "manual_payment_submissions"("batchId");

ALTER TABLE "investor_profiles" ADD COLUMN IF NOT EXISTS "nomineeName" TEXT;
