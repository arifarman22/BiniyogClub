import { db } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

// ─── Select shapes ────────────────────────────────────────────────────────────

export const farmSelect = {
  id: true,
  name: true,
  description: true,
  status: true,
  totalAreaAcres: true,
  address: true,
  district: true,
  division: true,
  country: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  farmerProfileId: true,
  _count: { select: { fields: true, projects: true } },
} as const satisfies Prisma.FarmSelect;

export const fieldSelect = {
  id: true,
  farmId: true,
  name: true,
  areaAcres: true,
  status: true,
  soilType: true,
  irrigationType: true,
  latitude: true,
  longitude: true,
  createdAt: true,
  updatedAt: true,
  _count: { select: { cropCycles: true } },
} as const satisfies Prisma.FieldSelect;

export const cropCycleSelect = {
  id: true,
  fieldId: true,
  cropId: true,
  projectId: true,
  status: true,
  plantedAt: true,
  expectedHarvestAt: true,
  actualHarvestAt: true,
  areaAcres: true,
  expectedYieldKg: true,
  actualYieldKg: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  crop: { select: { id: true, name: true, localName: true, category: true } },
  field: { select: { id: true, name: true, farm: { select: { id: true, name: true } } } },
  project: { select: { id: true, title: true, status: true } },
} as const satisfies Prisma.CropCycleSelect;

export const harvestSelect = {
  id: true,
  projectId: true,
  cropCycleId: true,
  harvestedAt: true,
  yieldKg: true,
  qualityGrade: true,
  storageLocation: true,
  notes: true,
  recordedBy: true,
  createdAt: true,
  updatedAt: true,
  cropCycle: {
    select: {
      crop: { select: { name: true } },
      field: { select: { name: true, farm: { select: { name: true } } } },
    },
  },
  project: { select: { id: true, title: true } },
} as const satisfies Prisma.HarvestSelect;

export const expenseSelect = {
  id: true,
  projectId: true,
  cropCycleId: true,
  category: true,
  description: true,
  amountBdt: true,
  incurredAt: true,
  receiptUrl: true,
  recordedBy: true,
  approvedBy: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, title: true } },
  cropCycle: { select: { crop: { select: { name: true } } } },
} as const satisfies Prisma.ExpenseSelect;

export const saleSelect = {
  id: true,
  projectId: true,
  harvestId: true,
  buyerName: true,
  quantityKg: true,
  pricePerKgBdt: true,
  totalAmountBdt: true,
  soldAt: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  project: { select: { id: true, title: true } },
  harvest: {
    select: {
      cropCycle: { select: { crop: { select: { name: true } } } },
    },
  },
} as const satisfies Prisma.SaleSelect;

export type FarmRecord = Prisma.FarmGetPayload<{ select: typeof farmSelect }>;
export type FieldRecord = Prisma.FieldGetPayload<{ select: typeof fieldSelect }>;
export type CropCycleRecord = Prisma.CropCycleGetPayload<{ select: typeof cropCycleSelect }>;
export type HarvestRecord = Prisma.HarvestGetPayload<{ select: typeof harvestSelect }>;
export type ExpenseRecord = Prisma.ExpenseGetPayload<{ select: typeof expenseSelect }>;
export type SaleRecord = Prisma.SaleGetPayload<{ select: typeof saleSelect }>;

// ─── Repository ───────────────────────────────────────────────────────────────

export const farmRepository = {
  // ── Farms ──────────────────────────────────────────────────────────────────

  async findFarmsByProfileId(farmerProfileId: string): Promise<FarmRecord[]> {
    return db.farm.findMany({
      where: { farmerProfileId, deletedAt: null },
      select: farmSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  async findFarmById(id: string): Promise<(FarmRecord & { fields: FieldRecord[] }) | null> {
    return db.farm.findUnique({
      where: { id, deletedAt: null },
      select: { ...farmSelect, fields: { select: fieldSelect, orderBy: { createdAt: "asc" } } },
    });
  },

  async createFarm(data: {
    farmerProfileId: string;
    name: string;
    description?: string;
    totalAreaAcres: number;
    address: string;
    district: string;
    division: string;
    latitude?: number;
    longitude?: number;
  }): Promise<FarmRecord> {
    return db.farm.create({ data, select: farmSelect });
  },

  async updateFarm(id: string, data: Prisma.FarmUpdateInput): Promise<FarmRecord> {
    return db.farm.update({ where: { id }, data, select: farmSelect });
  },

  async softDeleteFarm(id: string): Promise<void> {
    await db.farm.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  },

  // ── Fields ─────────────────────────────────────────────────────────────────

  async findFieldsByFarmId(farmId: string): Promise<FieldRecord[]> {
    return db.field.findMany({
      where: { farmId },
      select: fieldSelect,
      orderBy: { createdAt: "asc" },
    });
  },

  async findFieldById(id: string): Promise<FieldRecord | null> {
    return db.field.findUnique({ where: { id }, select: fieldSelect });
  },

  async createField(data: {
    farmId: string;
    name: string;
    areaAcres: number;
    soilType?: string;
    irrigationType?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<FieldRecord> {
    return db.field.create({ data, select: fieldSelect });
  },

  async updateField(id: string, data: Prisma.FieldUpdateInput): Promise<FieldRecord> {
    return db.field.update({ where: { id }, data, select: fieldSelect });
  },

  async deleteField(id: string): Promise<void> {
    await db.field.delete({ where: { id } });
  },

  // ── Crop cycles ────────────────────────────────────────────────────────────

  async findCropCyclesByProfileId(farmerProfileId: string): Promise<CropCycleRecord[]> {
    return db.cropCycle.findMany({
      where: { field: { farm: { farmerProfileId, deletedAt: null } } },
      select: cropCycleSelect,
      orderBy: { createdAt: "desc" },
    });
  },

  async findActiveCropCycles(farmerProfileId: string): Promise<CropCycleRecord[]> {
    return db.cropCycle.findMany({
      where: {
        field: { farm: { farmerProfileId, deletedAt: null } },
        status: { in: ["PLANTED", "GROWING", "HARVESTING"] },
      },
      select: cropCycleSelect,
      orderBy: { plantedAt: "asc" },
    });
  },

  async findCropCycleById(id: string): Promise<CropCycleRecord | null> {
    return db.cropCycle.findUnique({ where: { id }, select: cropCycleSelect });
  },

  async createCropCycle(data: Prisma.CropCycleCreateInput): Promise<CropCycleRecord> {
    return db.cropCycle.create({ data, select: cropCycleSelect });
  },

  async updateCropCycle(id: string, data: Prisma.CropCycleUpdateInput): Promise<CropCycleRecord> {
    return db.cropCycle.update({ where: { id }, data, select: cropCycleSelect });
  },

  // ── Harvests ───────────────────────────────────────────────────────────────

  async findHarvestsByProfileId(farmerProfileId: string, limit = 50): Promise<HarvestRecord[]> {
    return db.harvest.findMany({
      where: { project: { farm: { farmerProfileId, deletedAt: null } } },
      select: harvestSelect,
      orderBy: { harvestedAt: "desc" },
      take: limit,
    });
  },

  async createHarvest(data: Prisma.HarvestCreateInput): Promise<HarvestRecord> {
    return db.harvest.create({ data, select: harvestSelect });
  },

  async updateHarvest(id: string, data: Prisma.HarvestUpdateInput): Promise<HarvestRecord> {
    return db.harvest.update({ where: { id }, data, select: harvestSelect });
  },

  // ── Expenses ───────────────────────────────────────────────────────────────

  async findExpensesByProfileId(farmerProfileId: string, limit = 50): Promise<ExpenseRecord[]> {
    return db.expense.findMany({
      where: { project: { farm: { farmerProfileId, deletedAt: null } } },
      select: expenseSelect,
      orderBy: { incurredAt: "desc" },
      take: limit,
    });
  },

  async createExpense(data: Prisma.ExpenseCreateInput): Promise<ExpenseRecord> {
    return db.expense.create({ data, select: expenseSelect });
  },

  async updateExpense(id: string, data: Prisma.ExpenseUpdateInput): Promise<ExpenseRecord> {
    return db.expense.update({ where: { id }, data, select: expenseSelect });
  },

  async deleteExpense(id: string): Promise<void> {
    await db.expense.delete({ where: { id } });
  },

  // ── Sales ──────────────────────────────────────────────────────────────────

  async findSalesByProfileId(farmerProfileId: string, limit = 50): Promise<SaleRecord[]> {
    return db.sale.findMany({
      where: { project: { farm: { farmerProfileId, deletedAt: null } } },
      select: saleSelect,
      orderBy: { soldAt: "desc" },
      take: limit,
    });
  },

  async createSale(data: Prisma.SaleCreateInput): Promise<SaleRecord> {
    return db.sale.create({ data, select: saleSelect });
  },

  // ── Crops (reference data) ─────────────────────────────────────────────────

  async findAllCrops() {
    return db.crop.findMany({
      select: { id: true, name: true, localName: true, category: true },
      orderBy: { name: "asc" },
    });
  },
};
