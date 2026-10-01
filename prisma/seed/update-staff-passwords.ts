/**
 * One-off script: update staff passwords only.
 * Run: npx tsx --tsconfig tsconfig.seed.json prisma/seed/update-staff-passwords.ts
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  const updates = [
    { email: "superadmin@biniyog.dev", password: process.env.SEED_SUPER_ADMIN_PASSWORD! },
    { email: "admin@biniyog.dev",      password: process.env.SEED_ADMIN_PASSWORD! },
    { email: "finance@biniyog.dev",    password: process.env.SEED_FINANCE_OFFICER_PASSWORD! },
    { email: "pm@biniyog.dev",         password: process.env.SEED_PROJECT_MANAGER_PASSWORD! },
    { email: "kyc@biniyog.dev",        password: process.env.SEED_KYC_OFFICER_PASSWORD! },
    { email: "officer@biniyog.dev",    password: process.env.SEED_FIELD_OFFICER_PASSWORD! },
  ];

  for (const u of updates) {
    if (!u.password) { console.warn(`⚠ No password env for ${u.email}, skipping`); continue; }
    const passwordHash = await hash(u.password);
    const result = await db.user.updateMany({ where: { email: u.email }, data: { passwordHash } });
    console.log(`✓ ${u.email} — ${result.count ? "updated" : "not found"}`);
  }
}

main()
  .catch((e) => { console.error("❌", e); process.exit(1); })
  .finally(() => db.$disconnect());
