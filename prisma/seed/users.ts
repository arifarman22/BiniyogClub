import type { PrismaClient } from "@prisma/client";
import { upsertUser, requireSeedEnv } from "./helpers";

export async function seedUsers(db: PrismaClient) {
  console.log("  → Seeding users...");

  // ── Super Admin ────────────────────────────────────────────────────────────
  const superAdmin = await upsertUser(db, {
    email: requireSeedEnv("SEED_SUPER_ADMIN_EMAIL"),
    password: requireSeedEnv("SEED_SUPER_ADMIN_PASSWORD"),
    name: "Super Admin",
    role: "SUPER_ADMIN",
  });
  await db.wallet.upsert({
    where: { userId: superAdmin.id },
    update: {},
    create: { userId: superAdmin.id, type: "PLATFORM_REVENUE" },
  });

  // ── Admin ──────────────────────────────────────────────────────────────────
  const admin = await upsertUser(db, {
    email: requireSeedEnv("SEED_ADMIN_EMAIL"),
    password: requireSeedEnv("SEED_ADMIN_PASSWORD"),
    name: "Platform Admin",
    role: "ADMIN",
  });
  await db.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id, type: "PLATFORM_REVENUE" },
  });

  // ── Finance Officer ────────────────────────────────────────────────────────
  const financeOfficer = await upsertUser(db, {
    email: "finance@biniyog.dev",
    password: requireSeedEnv("SEED_ADMIN_PASSWORD"),
    name: "Finance Officer",
    role: "FINANCE_OFFICER",
  });
  await db.wallet.upsert({
    where: { userId: financeOfficer.id },
    update: {},
    create: { userId: financeOfficer.id, type: "PLATFORM_REVENUE" },
  });

  // ── Project Manager ────────────────────────────────────────────────────────
  const projectManager = await upsertUser(db, {
    email: "pm@biniyog.dev",
    password: requireSeedEnv("SEED_ADMIN_PASSWORD"),
    name: "Project Manager",
    role: "PROJECT_MANAGER",
  });
  await db.wallet.upsert({
    where: { userId: projectManager.id },
    update: {},
    create: { userId: projectManager.id, type: "PLATFORM_REVENUE" },
  });

  // ── KYC Officer ───────────────────────────────────────────────────────────
  const kycOfficer = await upsertUser(db, {
    email: "kyc@biniyog.dev",
    password: requireSeedEnv("SEED_ADMIN_PASSWORD"),
    name: "KYC Officer",
    role: "KYC_OFFICER",
  });
  await db.wallet.upsert({
    where: { userId: kycOfficer.id },
    update: {},
    create: { userId: kycOfficer.id, type: "PLATFORM_REVENUE" },
  });

  // ── Investor ───────────────────────────────────────────────────────────────
  const investor = await upsertUser(db, {
    email: requireSeedEnv("SEED_INVESTOR_EMAIL"),
    password: requireSeedEnv("SEED_INVESTOR_PASSWORD"),
    name: "Rahim Uddin",
    role: "INVESTOR",
  });
  await db.wallet.upsert({
    where: { userId: investor.id },
    update: {},
    create: { userId: investor.id, type: "INVESTOR" },
  });
  await db.investorProfile.upsert({
    where: { userId: investor.id },
    update: {},
    create: {
      userId: investor.id,
      address: "12 Gulshan Avenue",
      city: "Dhaka",
      country: "BD",
      occupation: "Business Owner",
      annualIncomeRange: "1000000-5000000",
      riskTolerance: "MODERATE",
    },
  });
  await db.kyc.upsert({
    where: { userId: investor.id },
    update: {},
    create: { userId: investor.id, status: "NOT_STARTED" },
  });

  // ── Farmer ─────────────────────────────────────────────────────────────────
  const farmer = await upsertUser(db, {
    email: requireSeedEnv("SEED_FARMER_EMAIL"),
    password: requireSeedEnv("SEED_FARMER_PASSWORD"),
    name: "Karim Hossain",
    role: "FARMER",
  });
  await db.wallet.upsert({
    where: { userId: farmer.id },
    update: {},
    create: { userId: farmer.id, type: "FARMER" },
  });
  await db.farmerProfile.upsert({
    where: { userId: farmer.id },
    update: {},
    create: {
      userId: farmer.id,
      address: "Village: Char Fasson",
      city: "Bhola",
      country: "BD",
      yearsExperience: 12,
      specializations: ["RICE", "VEGETABLES", "FISH"],
    },
  });
  await db.kyc.upsert({
    where: { userId: farmer.id },
    update: {},
    create: { userId: farmer.id, status: "NOT_STARTED" },
  });

  // ── Field Officer ──────────────────────────────────────────────────────────
  const officer = await upsertUser(db, {
    email: requireSeedEnv("SEED_FIELD_OFFICER_EMAIL"),
    password: requireSeedEnv("SEED_FIELD_OFFICER_PASSWORD"),
    name: "Nasrin Akter",
    role: "FIELD_OFFICER",
  });
  await db.wallet.upsert({
    where: { userId: officer.id },
    update: {},
    create: { userId: officer.id, type: "PLATFORM_REVENUE" },
  });
  await db.fieldOfficerProfile.upsert({
    where: { userId: officer.id },
    update: {},
    create: {
      userId: officer.id,
      employeeId: "FO-2024-001",
      region: "Barisal Division",
      assignedArea: "Bhola, Patuakhali",
    },
  });

  console.log("  ✓ Users seeded:", {
    superAdmin: superAdmin.email,
    admin: admin.email,
    financeOfficer: financeOfficer.email,
    projectManager: projectManager.email,
    kycOfficer: kycOfficer.email,
    investor: investor.email,
    farmer: farmer.email,
    officer: officer.email,
  });

  return { superAdmin, admin, investor, farmer, officer };
}
