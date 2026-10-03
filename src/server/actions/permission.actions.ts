"use server";

import { db } from "@/lib/db/prisma";
import { requireSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { AppError } from "@/lib/errors";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types/prisma";
import type { ActionResult } from "./auth.actions";

export async function getRolePermissionsAction(): Promise<
  ActionResult<Record<string, string[]>>
> {
  try {
    const session = await requireSession();
    await requirePermission(session, PERMISSIONS.AUDIT_VIEW);

    const rows = await db.rolePermission.findMany({
      include: { permission: { select: { key: true } } },
    });

    const map: Record<string, string[]> = {};
    for (const row of rows) {
      if (!map[row.role]) map[row.role] = [];
      map[row.role].push(row.permission.key);
    }

    return { success: true, data: map };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: error.message };
    return { success: false, error: "Failed to load permissions." };
  }
}

export async function updateRolePermissionsAction(
  role: UserRole,
  permissionKeys: string[],
): Promise<ActionResult<void>> {
  try {
    const session = await requireSession();
    // Only SUPER_ADMIN and ADMIN can modify permissions
    await requirePermission(session, PERMISSIONS.USER_CHANGE_ROLE);

    // Prevent non-SUPER_ADMIN from editing SUPER_ADMIN permissions
    if (role === "SUPER_ADMIN" && session.role !== "SUPER_ADMIN") {
      return { success: false, error: "Only Super Admin can modify Super Admin permissions." };
    }

    const allPerms = await db.permission.findMany({
      where: { key: { in: permissionKeys } },
      select: { id: true, key: true },
    });

    const permIds = allPerms.map((p) => p.id);

    await db.$transaction([
      db.rolePermission.deleteMany({ where: { role } }),
      db.rolePermission.createMany({
        data: permIds.map((permissionId) => ({ role, permissionId })),
        skipDuplicates: true,
      }),
    ]);

    revalidatePath("/admin/settings");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AppError) return { success: false, error: error.message };
    console.error("[updateRolePermissions]", error);
    return { success: false, error: "Failed to save permissions." };
  }
}
