import * as dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing env var: ${key}`);
  return val;
}

async function upsertUser(email: string, password: string, name: string, role: string) {
  const passwordHash = await bcrypt.hash(password, 12);
  return db.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash, name, role: role as never, emailVerified: true },
  });
}

async function main() {
  console.log("🌱 Seeding production users...\n");

  const superAdmin = await upsertUser(
    requireEnv("SEED_SUPER_ADMIN_EMAIL"),
    requireEnv("SEED_SUPER_ADMIN_PASSWORD"),
    "Super Admin",
    "SUPER_ADMIN",
  );
  await db.wallet.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: { userId: superAdmin.id, type: "PLATFORM_REVENUE" },
  });
  console.log("  ✓ Super Admin:", superAdmin.email);

  const admin = await upsertUser(
    requireEnv("SEED_ADMIN_EMAIL"),
    requireEnv("SEED_ADMIN_PASSWORD"),
    "Platform Admin",
    "ADMIN",
  );
  await db.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, type: "PLATFORM_REVENUE" },
  });
  console.log("  ✓ Admin:", admin.email);

  const investor = await upsertUser(
    requireEnv("SEED_INVESTOR_EMAIL"),
    requireEnv("SEED_INVESTOR_PASSWORD"),
    "Test Investor",
    "INVESTOR",
  );
  await db.wallet.upsert({
    where: { userId: investor.id },
    update: {},
    create: { userId: investor.id, type: "INVESTOR" },
  });
  await db.investorProfile.upsert({
    where: { userId: investor.id },
    update: {},
    create: { userId: investor.id, city: "Dhaka", country: "BD" },
  });
  await db.kyc.upsert({
    where: { userId: investor.id },
    update: {},
    create: { userId: investor.id, status: "NOT_STARTED" },
  });
  console.log("  ✓ Investor:", investor.email);

  console.log("\n✅ Production seed completed.");
}

main()
  .catch((e) => { console.error("❌ Seed failed:", e); process.exit(1); })
  .finally(() => db.$disconnect());
