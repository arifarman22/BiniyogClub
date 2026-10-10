
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();
const nodeProcess = (globalThis as typeof globalThis & {
  process?: {
    env: Record<string, string | undefined>;
    exit(code: number): never;
  };
}).process;

async function hash(pw: string) {
  return bcrypt.hash(pw, 12);
}

async function main() {
  const updates = [
    { email: "superadmin@biniyog.dev", password: nodeProcess?.env.SEED_SUPER_ADMIN_PASSWORD! },
    { email: "admin@biniyog.dev",      password: nodeProcess?.env.SEED_ADMIN_PASSWORD! },
    { email: "finance@biniyog.dev",    password: nodeProcess?.env.SEED_FINANCE_OFFICER_PASSWORD! },
    { email: "pm@biniyog.dev",         password: nodeProcess?.env.SEED_PROJECT_MANAGER_PASSWORD! },
    { email: "kyc@biniyog.dev",        password: nodeProcess?.env.SEED_KYC_OFFICER_PASSWORD! },
    { email: "officer@biniyog.dev",    password: nodeProcess?.env.SEED_FIELD_OFFICER_PASSWORD! },
  ];

  for (const u of updates) {
    if (!u.password) { console.warn(`⚠ No password env for ${u.email}, skipping`); continue; }
    const passwordHash = await hash(u.password);
    const result = await db.user.updateMany({ where: { email: u.email }, data: { passwordHash } });
    console.log(`✓ ${u.email} — ${result.count ? "updated" : "not found"}`);
  }
}

main()
  .catch((e) => { console.error("❌", e); nodeProcess?.exit(1); })
  .finally(() => db.$disconnect());
