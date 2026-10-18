import type { PrismaClient, UserRole } from "@prisma/client";
import { PERMISSIONS, PERMISSION_DESCRIPTIONS, ROLE_PERMISSIONS } from "../../src/lib/authz/permissions";
import type { Permission } from "../../src/lib/authz/permissions";

export async function seedPermissions(db: PrismaClient) {
  console.log("  → Seeding permissions...");

  const permEntries = Object.values(PERMISSIONS) as Permission[];

  // Upsert all permission definitions
  await db.permission.createMany({
    data: permEntries.map((key) => ({ key, description: PERMISSION_DESCRIPTIONS[key] })),
    skipDuplicates: true,
  });

  // Fetch all permissions once for ID lookup
  const allPerms = await db.permission.findMany();
  const permMap = new Map(allPerms.map((p) => [p.key, p.id]));

  // Full sync: delete ALL existing role-permission rows then recreate from static map
  await db.rolePermission.deleteMany({});

  const rolePermRows: { role: UserRole; permissionId: string }[] = [];
  for (const [role, permissions] of Object.entries(ROLE_PERMISSIONS) as [UserRole, Permission[]][]) {
    for (const permKey of permissions) {
      const permId = permMap.get(permKey);
      if (permId) rolePermRows.push({ role, permissionId: permId });
    }
  }

  await db.rolePermission.createMany({ data: rolePermRows });

  console.log(`  ✓ ${permEntries.length} permissions seeded across ${Object.keys(ROLE_PERMISSIONS).length} roles`);
}
