import { z } from "zod";

const positiveDecimal = z.coerce.number({ error: "Must be a number" }).positive("Must be greater than 0");
const nonNegativeDecimal = z.coerce.number({ error: "Must be a number" }).min(0);

// ─── Farm ─────────────────────────────────────────────────────────────────────

export const farmSchema = z.object({
  name: z.string().min(2, "Farm name must be at least 2 characters").max(200),
  description: z.string().max(1000).optional(),
  totalAreaAcres: positiveDecimal,
  address: z.string().min(5, "Address is required").max(300),
  district: z.string().min(2).max(100),
  division: z.string().min(2).max(100),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const farmUpdateSchema = farmSchema.partial();

// ─── Field ────────────────────────────────────────────────────────────────────

export const fieldSchema = z.object({
  name: z.string().min(2, "Field name is required").max(200),
  areaAcres: positiveDecimal,
  soilType: z.string().max(100).optional(),
  irrigationType: z.string().max(100).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
});

export const fieldUpdateSchema = fieldSchema.partial();

// ─── Crop cycle ───────────────────────────────────────────────────────────────

export const cropCycleSchema = z.object({
  fieldId: z.string().uuid("Invalid field"),
  cropId: z.string().uuid("Invalid crop"),
  projectId: z.string().uuid().optional(),
  plantedAt: z.coerce.date().optional(),
  expectedHarvestAt: z.coerce.date().optional(),
  areaAcres: positiveDecimal,
  expectedYieldKg: positiveDecimal.optional(),
  notes: z.string().max(500).optional(),
});

export const cropCycleUpdateSchema = z.object({
  status: z.enum(["PLANNED", "PLANTED", "GROWING", "HARVESTING", "COMPLETED", "FAILED"]).optional(),
  plantedAt: z.coerce.date().optional().nullable(),
  expectedHarvestAt: z.coerce.date().optional().nullable(),
  actualHarvestAt: z.coerce.date().optional().nullable(),
  expectedYieldKg: positiveDecimal.optional().nullable(),
  actualYieldKg: positiveDecimal.optional().nullable(),
  notes: z.string().max(500).optional(),
});

// ─── Harvest ──────────────────────────────────────────────────────────────────

export const harvestSchema = z.object({
  cropCycleId: z.string().uuid("Invalid crop cycle"),
  projectId: z.string().uuid("Invalid project"),
  harvestedAt: z.coerce.date(),
  yieldKg: positiveDecimal,
  qualityGrade: z.string().max(50).optional(),
  storageLocation: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

// ─── Expense ──────────────────────────────────────────────────────────────────

export const expenseSchema = z.object({
  projectId: z.string().uuid("Invalid project"),
  cropCycleId: z.string().uuid().optional(),
  category: z.enum([
    "SEEDS", "FERTILIZER", "PESTICIDE", "LABOR", "EQUIPMENT",
    "IRRIGATION", "TRANSPORT", "STORAGE", "INSURANCE", "LAND_LEASE", "OTHER",
  ]),
  description: z.string().min(3, "Description is required").max(300),
  amountBdt: positiveDecimal,
  incurredAt: z.coerce.date(),
  receiptUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

// ─── Sale ─────────────────────────────────────────────────────────────────────

export const saleSchema = z.object({
  projectId: z.string().uuid("Invalid project"),
  harvestId: z.string().uuid("Invalid harvest"),
  buyerName: z.string().max(200).optional(),
  quantityKg: positiveDecimal,
  pricePerKgBdt: positiveDecimal,
  soldAt: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

// ─── Profile update ───────────────────────────────────────────────────────────

export const farmerProfileUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^(\+8801|01)[3-9]\d{8}$/, "Enter a valid Bangladeshi phone number").optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  yearsExperience: z.coerce.number().int().min(0).max(80).optional(),
  specializations: z.array(z.string().max(100)).max(10).optional(),
});

// ─── Types ────────────────────────────────────────────────────────────────────

export type FarmInput = z.infer<typeof farmSchema>;
export type FarmUpdateInput = z.infer<typeof farmUpdateSchema>;
export type FieldInput = z.infer<typeof fieldSchema>;
export type FieldUpdateInput = z.infer<typeof fieldUpdateSchema>;
export type CropCycleInput = z.infer<typeof cropCycleSchema>;
export type CropCycleUpdateInput = z.infer<typeof cropCycleUpdateSchema>;
export type HarvestInput = z.infer<typeof harvestSchema>;
export type ExpenseInput = z.infer<typeof expenseSchema>;
export type SaleInput = z.infer<typeof saleSchema>;
export type FarmerProfileUpdateInput = z.infer<typeof farmerProfileUpdateSchema>;
