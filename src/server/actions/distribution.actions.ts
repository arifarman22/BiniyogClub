"use server";

import { distributionService } from "@/server/services/distribution.service";
import { requireSession } from "@/lib/auth/session";
import { AppError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "./auth.actions";

function svcErr<T>(e: unknown): ActionResult<T> {
  if (e instanceof AppError) return { success: false, error: e.message, code: e.code };
  console.error("[distribution action]", e);
  return { success: false, error: "An unexpected error occurred." };
}

// ─── Rule ─────────────────────────────────────────────────────────────────────

export async function upsertDistributionRuleAction(
  projectId: string,
  data: { investorSharePct: number; platformFeePct: number; notes?: string },
): Promise<ActionResult<{ ruleId: string }>> {
  try {
    const session = await requireSession();
    const rule = await distributionService.upsertRule(session, projectId, data);
    revalidatePath(`/admin/distributions`);
    revalidatePath(`/admin/projects/${projectId}`);
    return { success: true, data: { ruleId: rule.id } };
  } catch (e) { return svcErr(e); }
}

// ─── Batch lifecycle ──────────────────────────────────────────────────────────

export async function calculateDistributionAction(data: {
  projectId: string;
  totalRevenueBdt: number;
  totalExpensesBdt: number;
  notes?: string;
}): Promise<ActionResult<{ batchId: string }>> {
  try {
    const session = await requireSession();
    const batch = await distributionService.calculate(session, data);
    revalidatePath("/admin/distributions");
    return { success: true, data: { batchId: batch.id } };
  } catch (e) { return svcErr(e); }
}

export async function submitDistributionAction(
  batchId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await distributionService.submit(session, batchId);
    revalidatePath("/admin/distributions");
    revalidatePath(`/admin/distributions/${batchId}`);
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function approveDistributionAction(
  batchId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await distributionService.approve(session, batchId);
    revalidatePath("/admin/distributions");
    revalidatePath(`/admin/distributions/${batchId}`);
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function rejectDistributionAction(
  batchId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await distributionService.reject(session, batchId, reason);
    revalidatePath("/admin/distributions");
    revalidatePath(`/admin/distributions/${batchId}`);
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function postDistributionAction(
  batchId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await distributionService.post(session, batchId);
    revalidatePath("/admin/distributions");
    revalidatePath(`/admin/distributions/${batchId}`);
    revalidatePath("/admin/investments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}

export async function voidDistributionAction(
  batchId: string,
  reason: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await distributionService.void(session, batchId, reason);
    revalidatePath("/admin/distributions");
    revalidatePath(`/admin/distributions/${batchId}`);
    revalidatePath("/admin/investments");
    return { success: true, data: undefined };
  } catch (e) { return svcErr(e); }
}
