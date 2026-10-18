-- Email becomes optional at signup (investors can log in with phone or email).
-- Postgres UNIQUE allows multiple NULLs, so the unique index stays as is.
-- Idempotent: safe to re-run. Apply with:
--   npx prisma db execute --file prisma/manual/20261018_optional_user_email.sql --schema prisma/schema.prisma
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
