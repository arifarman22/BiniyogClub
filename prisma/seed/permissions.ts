import type { PrismaClient, UserRole } from "@prisma/client";
import { PERMISSIONS, PERMISSION_DESCRIPTIONS, ROLE_PERMISSIONS } from "../../src/lib/authz/permissions";
import type { Permission } from "../../src/lib/authz/permissions";

export async function seedPermissions(db: PrismaClient) {
  console.log("  → Seeding permissions...");

  const permEntries = Object.values(PERMISSIONS) as Permission[];

  // Batch upsert all permissions in one query
  await db.permission.createMany({
    data: permEntries.map((key) => ({ key, description: PERMISSION_DESCRIPTIONS[key] })),
    skipDuplicates: true,
  });

  // Fetch all permissions once for ID lookup
  const allPerms = await db.permission.findMany();
  const permMap = new Map(allPerms.map((p) => [p.key, p.id]));

  // Build all role-permission rows
  const rolePermRows: { role: UserRole; permissionId: string }[] = [];
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS) as [UserRole, Permission[]][]) {
    for (const permKey of permissions) {
      const permId = permMap.get(permKey);
      if (permId) rolePermRows.push({ role, permissionId: permId });
    }
  }

  // Batch insert all role-permissions in one query
  await db.rolePermission.createMany({
    data: rolePermRows,
    skipDuplicates: true,
  });

  console.log(`  ✓ ${permEntries.length} permissions seeded across ${Object.keys(ROLE_PERMISSIONS).length} roles`);
}
