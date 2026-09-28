"use server";

import {
  createFarm, updateFarm, createField, updateField,
  createCropCycle, recordHarvest, recordExpense, deleteExpense,
  getFarmerProfile,
} from "@/server/data/farmer.data";
import { farmRepository } from "@/db/repositories/farm.repository";
import {
  farmSchema, farmUpdateSchema, fieldSchema, fieldUpdateSchema,
  cropCycleSchema, cropCycleUpdateSchema, harvestSchema, expenseSchema,
  saleSchema, farmerProfileUpdateSchema,
} from "@/validations/farmer";
import { AppError } from "@/lib/errors";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationError<T>(
  issues: { path: (string | number | symbol)[]; message: string }[],
): ActionResult<T> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path.join("."));
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return {
    success: false,
    error: issues[0]?.message ?? "Validation failed",
    code: "VALIDATION_ERROR",
    fieldErrors,
  };
}

function serviceError<T>(error: unknown): ActionResult<T> {
  if (error instanceof AppError) return { success: false, error: error.message, code: error.code };
  console.error("[farmer action]", error);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Farm actions ─────────────────────────────────────────────────────────────

export async function createFarmAction(formData: unknown): Promise<ActionResult<{ id: string }>> {
  const parsed = farmSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const farm = await createFarm(session, parsed.data);
    revalidatePath("/farmer/farms");
    revalidatePath("/farmer");
    return { success: true, data: { id: farm.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function updateFarmAction(
  farmId: string,
  formData: unknown,
): Promise<ActionResult<void>> {
  const parsed = farmUpdateSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await updateFarm(session, farmId, parsed.data);
    revalidatePath("/farmer/farms");
    revalidatePath(`/farmer/farms/${farmId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Field actions ────────────────────────────────────────────────────────────

export async function createFieldAction(
  farmId: string,
  formData: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = fieldSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const field = await createField(session, farmId, parsed.data);
    revalidatePath("/farmer/farms");
    revalidatePath(`/farmer/farms/${farmId}`);
    return { success: true, data: { id: field.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function updateFieldAction(
  fieldId: string,
  formData: unknown,
): Promise<ActionResult<void>> {
  const parsed = fieldUpdateSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    await updateField(session, fieldId, parsed.data);
    revalidatePath("/farmer/farms");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Crop cycle actions ───────────────────────────────────────────────────────

export async function createCropCycleAction(
  formData: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = cropCycleSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const cc = await createCropCycle(session, parsed.data);
    revalidatePath("/farmer/activities");
    revalidatePath("/farmer");
    return { success: true, data: { id: cc.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function updateCropCycleAction(
  cropCycleId: string,
  formData: unknown,
): Promise<ActionResult<void>> {
  const parsed = cropCycleUpdateSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    // Ownership check via data layer
    const cc = await farmRepository.findCropCycleById(cropCycleId);
    if (!cc) return { success: false, error: "Crop cycle not found" };

    // Verify ownership through field → farm → farmerProfile
    const profile = await db.farmerProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    const field = await db.field.findUnique({
      where: { id: cc.fieldId },
      select: { farm: { select: { farmerProfileId: true } } },
    });
    if (!profile || field?.farm.farmerProfileId !== profile.id) {
      return { success: false, error: "Forbidden", code: "FORBIDDEN" };
    }

    await farmRepository.updateCropCycle(cropCycleId, parsed.data);
    revalidatePath("/farmer/activities");
    revalidatePath("/farmer");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Harvest actions ──────────────────────────────────────────────────────────

export async function recordHarvestAction(
  formData: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = harvestSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const harvest = await recordHarvest(session, parsed.data);
    revalidatePath("/farmer/harvest");
    revalidatePath("/farmer");
    return { success: true, data: { id: harvest.id } };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Expense actions ──────────────────────────────────────────────────────────

export async function recordExpenseAction(
  formData: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = expenseSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const expense = await recordExpense(session, parsed.data);
    revalidatePath("/farmer/expenses");
    return { success: true, data: { id: expense.id } };
  } catch (error) {
    return serviceError(error);
  }
}

export async function deleteExpenseAction(expenseId: string): Promise<ActionResult<void>> {
  if (!expenseId) return { success: false, error: "Expense ID required" };

  try {
    const session = await requireSession();
    await deleteExpense(session, expenseId);
    revalidatePath("/farmer/expenses");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Sale actions ─────────────────────────────────────────────────────────────

export async function recordSaleAction(
  formData: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = saleSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();

    // Verify project belongs to farmer
    const profile = await db.farmerProfile.findUnique({
      where: { userId: session.id },
      select: { id: true },
    });
    const project = await db.project.findUnique({
      where: { id: parsed.data.projectId },
      select: { farm: { select: { farmerProfileId: true } } },
    });
    if (!profile || project?.farm.farmerProfileId !== profile.id) {
      return { success: false, error: "Forbidden", code: "FORBIDDEN" };
    }

    const totalAmountBdt = parsed.data.quantityKg * parsed.data.pricePerKgBdt;
    const sale = await farmRepository.createSale({
      project: { connect: { id: parsed.data.projectId } },
      harvest: { connect: { id: parsed.data.harvestId } },
      buyerName: parsed.data.buyerName,
      quantityKg: parsed.data.quantityKg,
      pricePerKgBdt: parsed.data.pricePerKgBdt,
      totalAmountBdt,
      soldAt: parsed.data.soldAt,
      notes: parsed.data.notes,
    });

    revalidatePath("/farmer/sales");
    return { success: true, data: { id: sale.id } };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Profile actions ──────────────────────────────────────────────────────────

export async function updateFarmerProfileAction(
  formData: unknown,
): Promise<ActionResult<void>> {
  const parsed = farmerProfileUpdateSchema.safeParse(formData);
  if (!parsed.success) return validationError(parsed.error.issues);

  try {
    const session = await requireSession();
    const { name, phone, ...profileData } = parsed.data;

    await Promise.all([
      name || phone
        ? db.user.update({
            where: { id: session.id },
            data: { ...(name && { name }), ...(phone && { phone }) },
          })
        : Promise.resolve(),
      Object.keys(profileData).length > 0
        ? db.farmerProfile.update({
            where: { userId: session.id },
            data: profileData,
          })
        : Promise.resolve(),
    ]);

    revalidatePath("/farmer/profile");
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}

// ─── Submit project for review ────────────────────────────────────────────────

export async function submitProjectForReviewAction(
  projectId: string,
): Promise<ActionResult<void>> {
  if (!projectId) return { success: false, error: "Project ID required" };

  try {
    const session = await requireSession();
    // Delegate to existing project service which handles ownership + transition
    const { projectService } = await import("@/server/services/project.service");
    await projectService.transition(session, projectId, "PENDING_APPROVAL");
    revalidatePath("/farmer/projects");
    revalidatePath(`/farmer/projects/${projectId}`);
    return { success: true, data: undefined };
  } catch (error) {
    return serviceError(error);
  }
}
