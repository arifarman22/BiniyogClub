"use server";

import { db } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "./auth.actions";

const bankSchema = z.object({
  accountName:   z.string().min(2).max(100),
  accountNumber: z.string().min(4).max(50),
  bankName:      z.string().min(2).max(100),
  branchName:    z.string().max(100).optional().nullable(),
  routingNumber: z.string().max(30).optional().nullable(),
  swiftCode:     z.string().max(20).optional().nullable(),
  mobileNumber:  z.string().max(20).optional().nullable(),
  email:         z.string().email().optional().nullable().or(z.literal("")),
  branchAddress: z.string().max(200).optional().nullable(),
});

export type ProjectBankInput = z.infer<typeof bankSchema>;

export async function upsertProjectBankAccountAction(
  projectId: string,
  bankAccountId: string | null,
  data: unknown,
): Promise<ActionResult<{ id: string }>> {
  const parsed = bankSchema.safeParse(data);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path.join("."));
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { success: false, error: parsed.error.issues[0]?.message ?? "Validation failed", fieldErrors };
  }

  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PROJECT_UPDATE);

    const payload = {
      ...parsed.data,
      email: parsed.data.email || null,
    };

    let record;
    if (bankAccountId) {
      record = await db.projectBankAccount.update({
        where: { id: bankAccountId },
        data: payload,
        select: { id: true },
      });
    } else {
      record = await db.projectBankAccount.create({
        data: { ...payload, projectId },
        select: { id: true },
      });
    }

    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/admin/projects/${projectId}/edit`);
    return { success: true, data: { id: record.id } };
  } catch (e) {
    console.error("[project-bank action]", e);
    return { success: false, error: "Failed to save bank account" };
  }
}

export async function deleteProjectBankAccountAction(
  projectId: string,
  bankAccountId: string,
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.PROJECT_UPDATE);
    await db.projectBankAccount.delete({ where: { id: bankAccountId } });
    revalidatePath(`/admin/projects/${projectId}`);
    revalidatePath(`/admin/projects/${projectId}/edit`);
    return { success: true, data: undefined };
  } catch (e) {
    console.error("[project-bank action]", e);
    return { success: false, error: "Failed to delete bank account" };
  }
}
