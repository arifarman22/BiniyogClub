/**
 * farmer.data.ts
 *
 * All queries are scoped to the authenticated farmer's own profile.
 * farmerProfileId is always resolved from session.id — never from URL params.
 * Investor financial data (investment amounts, returns, wallet) is never exposed.
 */

import { db } from "@/lib/db/prisma";
import { farmRepository } from "@/db/repositories/farm.repository";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/auth/session";

// ─── Internal: resolve farmerProfileId from session ──────────────────────────

async function resolveProfile(session: SessionUser) {
  if (session.role !== "FARMER") throw new ForbiddenError("Farmer access required");
  const profile = await db.farmerProfile.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });
  if (!profile) throw new ForbiddenError("Farmer profile not found");
  return profile.id;
}

// ─── Ownership guards ─────────────────────────────────────────────────────────

async function assertFarmOwner(session: SessionUser, farmId: string) {
  const profileId = await resolveProfile(session);
  const farm = await db.farm.findUnique({
    where: { id: farmId, deletedAt: null },
    select: { farmerProfileId: true },
  });
  if (!farm) throw new NotFoundError("Farm");
  if (farm.farmerProfileId !== profileId) throw new ForbiddenError();
  return profileId;
}

async function assertFieldOwner(session: SessionUser, fieldId: string) {
  const profileId = await resolveProfile(session);
  const field = await db.field.findUnique({
    where: { id: fieldId },
    select: { farm: { select: { farmerProfileId: true } } },
  });
  if (!field) throw new NotFoundError("Field");
  if (field.farm.farmerProfileId !== profileId) throw new ForbiddenError();
  return profileId;
}

async function assertCropCycleOwner(session: SessionUser, cropCycleId: string) {
  const profileId = await resolveProfile(session);
  const cc = await db.cropCycle.findUnique({
    where: { id: cropCycleId },
    select: { field: { select: { farm: { select: { farmerProfileId: true } } } } },
  });
  if (!cc) throw new NotFoundError("Crop cycle");
  if (cc.field.farm.farmerProfileId !== profileId) throw new ForbiddenError();
  return profileId;
}

async function assertExpenseOwner(session: SessionUser, expenseId: string) {
  const profileId = await resolveProfile(session);
  const expense = await db.expense.findUnique({
    where: { id: expenseId },
    select: { project: { select: { farm: { select: { farmerProfileId: true } } } } },
  });
  if (!expense) throw new NotFoundError("Expense");
  if (expense.project.farm.farmerProfileId !== profileId) throw new ForbiddenError();
  return profileId;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getFarmerDashboard(session: SessionUser) {
  const profileId = await resolveProfile(session);

  const [farms, projects, activeCropCycles, recentHarvests, upcomingVisits, recentUpdates] =
    await Promise.all([
      db.farm.findMany({
        where: { farmerProfileId: profileId, deletedAt: null },
        select: {
          id: true,
          name: true,
          status: true,
          totalAreaAcres: true,
          district: true,
          _count: { select: { fields: true } },
        },
      }),
      db.project.findMany({
        where: { farm: { farmerProfileId: profileId, deletedAt: null }, deletedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          category: true,
          fundingGoalBdt: true,
          fundedAmountBdt: true,
          fundingDeadline: true,
          startDate: true,
          endDate: true,
          coverImageUrl: true,
          farm: { select: { name: true, district: true } },
          // Deliberately exclude: investment amounts, investor count, returns
          _count: { select: { cropCycles: true, harvests: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      db.cropCycle.findMany({
        where: {
          field: { farm: { farmerProfileId: profileId, deletedAt: null } },
          status: { in: ["PLANTED", "GROWING", "HARVESTING"] },
        },
        select: {
          id: true,
          status: true,
          plantedAt: true,
          expectedHarvestAt: true,
          areaAcres: true,
          expectedYieldKg: true,
          crop: { select: { name: true, localName: true, category: true } },
          field: { select: { name: true, farm: { select: { name: true } } } },
          project: { select: { id: true, title: true } },
        },
        orderBy: { expectedHarvestAt: "asc" },
        take: 8,
      }),
      db.harvest.findMany({
        where: { project: { farm: { farmerProfileId: profileId, deletedAt: null } } },
        select: {
          id: true,
          harvestedAt: true,
          yieldKg: true,
          qualityGrade: true,
          cropCycle: { select: { crop: { select: { name: true } } } },
          project: { select: { title: true } },
        },
        orderBy: { harvestedAt: "desc" },
        take: 5,
      }),
      db.fieldVisit.findMany({
        where: {
          project: { farm: { farmerProfileId: profileId, deletedAt: null } },
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          project: { select: { id: true, title: true } },
          fieldOfficerProfile: { select: { user: { select: { name: true } } } },
        },
        orderBy: { scheduledAt: "asc" },
        take: 5,
      }),
      db.projectUpdate.findMany({
        where: {
          project: { farm: { farmerProfileId: profileId, deletedAt: null } },
          isPublished: true,
        },
        select: {
          id: true,
          title: true,
          type: true,
          publishedAt: true,
          project: { select: { id: true, title: true } },
        },
        orderBy: { publishedAt: "desc" },
        take: 5,
      }),
    ]);

  const activeProjects = projects.filter((p) =>
    ["FUNDRAISING", "FUNDED", "ACTIVE", "HARVESTING"].includes(p.status),
  );

  return {
    farms,
    projects,
    activeProjects,
    activeCropCycles,
    recentHarvests,
    upcomingVisits,
    recentUpdates,
    stats: {
      totalFarms: farms.length,
      activeFarms: farms.filter((f) => f.status === "ACTIVE").length,
      activeProjects: activeProjects.length,
      totalProjects: projects.length,
      activeCrops: activeCropCycles.length,
    },
  };
}

// ─── Projects (farmer-scoped, no investor data) ───────────────────────────────

export async function getFarmerProjects(session: SessionUser) {
  const profileId = await resolveProfile(session);

  return db.project.findMany({
    where: { farm: { farmerProfileId: profileId, deletedAt: null }, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      location: true,
      fundingGoalBdt: true,
      fundedAmountBdt: true,
      fundingDeadline: true,
      startDate: true,
      endDate: true,
      coverImageUrl: true,
      createdAt: true,
      updatedAt: true,
      farm: { select: { id: true, name: true, district: true, division: true } },
      _count: { select: { cropCycles: true, harvests: true, expenses: true } },
      // No: investments, distributions, investor counts
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getFarmerProjectById(session: SessionUser, projectId: string) {
  const profileId = await resolveProfile(session);

  const project = await db.project.findUnique({
    where: { id: projectId, deletedAt: null },
    select: {
      id: true,
      title: true,
      slug: true,
      status: true,
      category: true,
      description: true,
      location: true,
      riskInfo: true,
      fundingGoalBdt: true,
      fundedAmountBdt: true,
      fundingDeadline: true,
      startDate: true,
      endDate: true,
      coverImageUrl: true,
      imageUrls: true,
      createdAt: true,
      updatedAt: true,
      cancellationReason: true,
      rejectionReason: true,
      farm: { select: { id: true, name: true, farmerProfileId: true } },
      cropCycles: {
        select: {
          id: true,
          status: true,
          plantedAt: true,
          expectedHarvestAt: true,
          areaAcres: true,
          crop: { select: { name: true, category: true } },
          field: { select: { name: true } },
        },
      },
      updates: {
        where: { isPublished: true },
        select: { id: true, title: true, type: true, publishedAt: true, content: true },
        orderBy: { publishedAt: "desc" as const },
        take: 10,
      },
      _count: { select: { harvests: true, expenses: true } },
    },
  });

  if (!project) throw new NotFoundError("Project");
  if (project.farm.farmerProfileId !== profileId) throw new ForbiddenError();

  return project;
}

// ─── Farms ────────────────────────────────────────────────────────────────────

export async function getFarmerFarms(session: SessionUser) {
  const profileId = await resolveProfile(session);
  return farmRepository.findFarmsByProfileId(profileId);
}

export async function getFarmerFarmById(session: SessionUser, farmId: string) {
  await assertFarmOwner(session, farmId);
  return farmRepository.findFarmById(farmId);
}

// ─── Crop cycles ──────────────────────────────────────────────────────────────

export async function getFarmerCropCycles(session: SessionUser) {
  const profileId = await resolveProfile(session);
  return farmRepository.findCropCyclesByProfileId(profileId);
}

export async function getFarmerActiveCropCycles(session: SessionUser) {
  const profileId = await resolveProfile(session);
  return farmRepository.findActiveCropCycles(profileId);
}

// ─── Harvests ─────────────────────────────────────────────────────────────────

export async function getFarmerHarvests(session: SessionUser) {
  const profileId = await resolveProfile(session);
  return farmRepository.findHarvestsByProfileId(profileId);
}

// ─── Expenses ─────────────────────────────────────────────────────────────────

export async function getFarmerExpenses(session: SessionUser) {
  const profileId = await resolveProfile(session);
  return farmRepository.findExpensesByProfileId(profileId);
}

// ─── Sales ────────────────────────────────────────────────────────────────────

export async function getFarmerSales(session: SessionUser) {
  const profileId = await resolveProfile(session);
  return farmRepository.findSalesByProfileId(profileId);
}

// ─── Field visits ─────────────────────────────────────────────────────────────

export async function getFarmerFieldVisits(session: SessionUser) {
  const profileId = await resolveProfile(session);

  return db.fieldVisit.findMany({
    where: { project: { farm: { farmerProfileId: profileId, deletedAt: null } } },
    select: {
      id: true,
      scheduledAt: true,
      startedAt: true,
      completedAt: true,
      cancelledAt: true,
      status: true,
      summary: true,
      findings: true,
      recommendations: true,
      project: { select: { id: true, title: true } },
      fieldOfficerProfile: {
        select: { user: { select: { name: true } } },
      },
    },
    orderBy: { scheduledAt: "desc" },
  });
}

// ─── Documents ────────────────────────────────────────────────────────────────

export async function getFarmerDocuments(session: SessionUser) {
  const profileId = await resolveProfile(session);

  // Only documents for this farmer's own projects and farms
  const projectIds = await db.project
    .findMany({
      where: { farm: { farmerProfileId: profileId, deletedAt: null }, deletedAt: null },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  const farmIds = await db.farm
    .findMany({
      where: { farmerProfileId: profileId, deletedAt: null },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));

  return db.document.findMany({
    where: {
      OR: [
        { entityType: "PROJECT", entityId: { in: projectIds } },
        { entityType: "FARM", entityId: { in: farmIds } },
      ],
    },
    select: {
      id: true,
      name: true,
      entityType: true,
      entityId: true,
      fileUrl: true,
      mimeType: true,
      sizeBytes: true,
      isPublic: true,
      createdAt: true,
      uploader: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function getFarmerProfile(session: SessionUser) {
  const user = await db.user.findUnique({
    where: { id: session.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      emailVerified: true,
      createdAt: true,
      farmerProfile: {
        select: {
          id: true,
          nationalId: true,
          dateOfBirth: true,
          address: true,
          city: true,
          country: true,
          yearsExperience: true,
          specializations: true,
          updatedAt: true,
        },
      },
      kyc: { select: { status: true, submittedAt: true } },
    },
  });
  if (!user) throw new NotFoundError("User");
  return user;
}

// ─── Mutation helpers (ownership-checked) ────────────────────────────────────

export async function createFarm(
  session: SessionUser,
  data: {
    name: string;
    description?: string;
    totalAreaAcres: number;
    address: string;
    district: string;
    division: string;
    latitude?: number;
    longitude?: number;
  },
) {
  const profileId = await resolveProfile(session);
  return farmRepository.createFarm({ farmerProfileId: profileId, ...data });
}

export async function updateFarm(
  session: SessionUser,
  farmId: string,
  data: Parameters<typeof farmRepository.updateFarm>[1],
) {
  await assertFarmOwner(session, farmId);
  return farmRepository.updateFarm(farmId, data);
}

export async function createField(
  session: SessionUser,
  farmId: string,
  data: {
    name: string;
    areaAcres: number;
    soilType?: string;
    irrigationType?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  await assertFarmOwner(session, farmId);
  return farmRepository.createField({ farmId, ...data });
}

export async function updateField(
  session: SessionUser,
  fieldId: string,
  data: Parameters<typeof farmRepository.updateField>[1],
) {
  await assertFieldOwner(session, fieldId);
  return farmRepository.updateField(fieldId, data);
}

export async function createCropCycle(
  session: SessionUser,
  data: {
    fieldId: string;
    cropId: string;
    projectId?: string;
    plantedAt?: Date;
    expectedHarvestAt?: Date;
    areaAcres: number;
    expectedYieldKg?: number;
    notes?: string;
  },
) {
  await assertFieldOwner(session, data.fieldId);
  return farmRepository.createCropCycle({
    field: { connect: { id: data.fieldId } },
    crop: { connect: { id: data.cropId } },
    ...(data.projectId && { project: { connect: { id: data.projectId } } }),
    plantedAt: data.plantedAt,
    expectedHarvestAt: data.expectedHarvestAt,
    areaAcres: data.areaAcres,
    expectedYieldKg: data.expectedYieldKg,
    notes: data.notes,
    status: "PLANTED",
  });
}

export async function recordHarvest(
  session: SessionUser,
  data: {
    cropCycleId: string;
    projectId: string;
    harvestedAt: Date;
    yieldKg: number;
    qualityGrade?: string;
    storageLocation?: string;
    notes?: string;
  },
) {
  await assertCropCycleOwner(session, data.cropCycleId);
  return farmRepository.createHarvest({
    cropCycle: { connect: { id: data.cropCycleId } },
    project: { connect: { id: data.projectId } },
    harvestedAt: data.harvestedAt,
    yieldKg: data.yieldKg,
    qualityGrade: data.qualityGrade,
    storageLocation: data.storageLocation,
    notes: data.notes,
    recordedBy: session.id,
  });
}

export async function recordExpense(
  session: SessionUser,
  data: {
    projectId: string;
    cropCycleId?: string;
    category: string;
    description: string;
    amountBdt: number;
    incurredAt: Date;
    receiptUrl?: string;
  },
) {
  // Verify project belongs to farmer
  const profileId = await resolveProfile(session);
  const project = await db.project.findUnique({
    where: { id: data.projectId },
    select: { farm: { select: { farmerProfileId: true } } },
  });
  if (!project || project.farm.farmerProfileId !== profileId) throw new ForbiddenError();

  return farmRepository.createExpense({
    project: { connect: { id: data.projectId } },
    ...(data.cropCycleId && { cropCycle: { connect: { id: data.cropCycleId } } }),
    category: data.category as Parameters<typeof farmRepository.createExpense>[0]["category"],
    description: data.description,
    amountBdt: data.amountBdt,
    incurredAt: data.incurredAt,
    receiptUrl: data.receiptUrl,
    recordedBy: session.id,
  });
}

export async function deleteExpense(session: SessionUser, expenseId: string) {
  await assertExpenseOwner(session, expenseId);
  return farmRepository.deleteExpense(expenseId);
}
