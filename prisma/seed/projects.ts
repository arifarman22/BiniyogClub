import type { PrismaClient, User } from "@prisma/client";
import { slugify } from "./helpers";

export async function seedProjects(db: PrismaClient, farmer: User) {
  console.log("  → Seeding farm and projects...");

  const farmerProfile = await db.farmerProfile.findUniqueOrThrow({
    where: { userId: farmer.id },
  });

  // ── Farm ──────────────────────────────────────────────────────────────────
  const farm = await db.farm.upsert({
    where: { id: "seed-farm-001" },
    update: {},
    create: {
      id: "seed-farm-001",
      farmerProfileId: farmerProfile.id,
      name: "Char Fasson Agro Farm",
      description: "A productive riverine farm in Bhola district specialising in rice, vegetables, and aquaculture.",
      status: "ACTIVE",
      totalAreaAcres: 24.5,
      address: "Village: Char Fasson, Union: Char Fasson",
      district: "Bhola",
      division: "Barisal",
      country: "BD",
      latitude: 22.1953,
      longitude: 90.7453,
    },
  });

  // ── Fields ────────────────────────────────────────────────────────────────
  const field1 = await db.field.upsert({
    where: { id: "seed-field-001" },
    update: {},
    create: {
      id: "seed-field-001",
      farmId: farm.id,
      name: "North Paddy Block",
      areaAcres: 8.0,
      status: "AVAILABLE",
      soilType: "Alluvial",
      irrigationType: "Canal",
    },
  });

  const field2 = await db.field.upsert({
    where: { id: "seed-field-002" },
    update: {},
    create: {
      id: "seed-field-002",
      farmId: farm.id,
      name: "South Vegetable Plot",
      areaAcres: 4.5,
      status: "AVAILABLE",
      soilType: "Loamy",
      irrigationType: "Drip",
    },
  });

  const field3 = await db.field.upsert({
    where: { id: "seed-field-003" },
    update: {},
    create: {
      id: "seed-field-003",
      farmId: farm.id,
      name: "East Pond Block",
      areaAcres: 6.0,
      status: "AVAILABLE",
      soilType: "Clay",
      irrigationType: "Pond",
    },
  });

  // ── Crops ─────────────────────────────────────────────────────────────────
  const boroCrop  = await db.crop.findFirstOrThrow({ where: { name: "Boro Rice" } });
  const tomatoCrop = await db.crop.findFirstOrThrow({ where: { name: "Tomato" } });

  // ── Projects ──────────────────────────────────────────────────────────────
  const now = new Date();
  const fundingDeadline1 = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const fundingDeadline2 = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000); // 45 days
  const fundingDeadline3 = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days

  const project1Title = "Boro Rice Season 2025 — Char Fasson";
  const project1 = await db.project.upsert({
    where: { slug: slugify(project1Title) },
    update: {},
    create: {
      farmId: farm.id,
      title: project1Title,
      slug: slugify(project1Title),
      description: `A high-yield Boro rice cultivation project on 8 acres of alluvial land in Bhola district. The project uses certified BRRI dhan29 seeds with canal irrigation. Expected yield: 6.5 tonnes/acre. Returns distributed after harvest and sale.`,
      category: "CROP_FARMING",
      status: "FUNDRAISING",
      fundingGoalBdt: 800000,
      fundingMinBdt: 400000,
      fundedAmountBdt: 0,
      minInvestmentBdt: 10000,
      maxInvestmentBdt: 200000,
      returnType: "PROFIT_SHARE",
      expectedReturnPct: 0.18,
      durationDays: 140,
      fundingDeadline: fundingDeadline1,
      approvedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Crop cycle for project 1
  await db.cropCycle.upsert({
    where: { id: "seed-cycle-001" },
    update: {},
    create: {
      id: "seed-cycle-001",
      fieldId: field1.id,
      cropId: boroCrop.id,
      projectId: project1.id,
      status: "PLANNED",
      areaAcres: 8.0,
      expectedYieldKg: 52000,
    },
  });

  const project2Title = "Winter Tomato Cultivation — Bhola 2025";
  const project2 = await db.project.upsert({
    where: { slug: slugify(project2Title) },
    update: {},
    create: {
      farmId: farm.id,
      title: project2Title,
      slug: slugify(project2Title),
      description: `Premium hybrid tomato cultivation on 4.5 acres using drip irrigation and integrated pest management. Targeting Dhaka wholesale markets. Fixed return model with guaranteed minimum payout.`,
      category: "HORTICULTURE",
      status: "FUNDRAISING",
      fundingGoalBdt: 350000,
      fundingMinBdt: 175000,
      fundedAmountBdt: 0,
      minInvestmentBdt: 5000,
      maxInvestmentBdt: 100000,
      returnType: "FIXED_RETURN",
      expectedReturnPct: 0.15,
      durationDays: 70,
      fundingDeadline: fundingDeadline2,
      approvedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await db.cropCycle.upsert({
    where: { id: "seed-cycle-002" },
    update: {},
    create: {
      id: "seed-cycle-002",
      fieldId: field2.id,
      cropId: tomatoCrop.id,
      projectId: project2.id,
      status: "PLANNED",
      areaAcres: 4.5,
      expectedYieldKg: 27000,
    },
  });

  const project3Title = "Tilapia Aquaculture Project — Bhola Pond 2025";
  const project3 = await db.project.upsert({
    where: { slug: slugify(project3Title) },
    update: {},
    create: {
      farmId: farm.id,
      title: project3Title,
      slug: slugify(project3Title),
      description: `Intensive tilapia fish farming on a 6-acre pond using scientific feed management and water quality monitoring. Targeting 8,000 kg yield over 6 months. Hybrid return model.`,
      category: "AQUACULTURE",
      status: "FUNDRAISING",
      fundingGoalBdt: 600000,
      fundingMinBdt: 300000,
      fundedAmountBdt: 0,
      minInvestmentBdt: 10000,
      maxInvestmentBdt: 150000,
      returnType: "HYBRID",
      expectedReturnPct: 0.20,
      durationDays: 180,
      fundingDeadline: fundingDeadline3,
      approvedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // Project updates
  await db.projectUpdate.upsert({
    where: { id: "seed-update-001" },
    update: {},
    create: {
      id: "seed-update-001",
      projectId: project1.id,
      authorId: farmer.id,
      type: "GENERAL",
      title: "Project is now open for investment",
      content: "We are excited to announce that the Boro Rice Season 2025 project is now open for investment. Land preparation has been completed and seeds are ready for sowing once funding target is reached.",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await db.projectUpdate.upsert({
    where: { id: "seed-update-002" },
    update: {},
    create: {
      id: "seed-update-002",
      projectId: project2.id,
      authorId: farmer.id,
      type: "GENERAL",
      title: "Drip irrigation system installed",
      content: "The drip irrigation system has been fully installed across all 4.5 acres. Soil testing completed — pH levels are optimal for tomato cultivation. Awaiting funding to procure hybrid seedlings.",
      isPublished: true,
      publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  console.log("  ✓ Farm, fields, and projects seeded:", {
    farm: farm.name,
    fields: [field1.name, field2.name, field3.name],
    projects: [project1.title, project2.title, project3.title],
  });

  return { farm, projects: [project1, project2, project3] };
}
