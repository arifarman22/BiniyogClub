import { db } from "@/lib/db/prisma";
import { ForbiddenError } from "@/lib/errors";
import { ROLE_PERMISSIONS, type Permission } from "./permissions";
import type { SessionUser } from "@/lib/auth/session";
import type { UserRole } from "@/types/prisma";

// ─── Request-scoped permission cache ─────────────────────────────────────────
// Permissions are fetched once per request and cached in a WeakMap keyed by
// the session object. This means one DB query per request, not one per can().

const permissionCache = new WeakMap<SessionUser, Set<Permission>>();

async function getPermissionsForSession(session: SessionUser): Promise<Set<Permission>> {
  const cached = permissionCache.get(session);
  if (cached) return cached;

  // Fetch role's permissions from DB (allows runtime overrides via admin panel)
  const rows = await db.rolePermission.findMany({
    where: { role: session.role },
    select: { permission: { select: { key: true } } },
  });

  const perms = new Set(rows.map((r) => r.permission.key as Permission));
  permissionCache.set(session, perms);
  return perms;
}

// ─── Core authorization functions ────────────────────────────────────────────

/**
 * Returns true if the session user has the given permission.
 * Checks DB-stored role permissions (allows runtime overrides).
 * SUPER_ADMIN always returns true.
 */
export async function can(session: SessionUser, permission: Permission): Promise<boolean> {
  if (session.role === "SUPER_ADMIN") return true;
  const perms = await getPermissionsForSession(session);
  return perms.has(permission);
}

/**
 * Throws ForbiddenError if the session user lacks the permission.
 * Use in Server Actions and Route Handlers.
 */
export async function requirePermission(
  session: SessionUser,
  permission: Permission,
): Promise<void> {
  const allowed = await can(session, permission);
  if (!allowed) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }
}

/**
 * Throws ForbiddenError if the user lacks ANY of the given permissions.
 */
export async function requireAllPermissions(
  session: SessionUser,
  permissions: Permission[],
): Promise<void> {
  for (const perm of permissions) {
    await requirePermission(session, perm);
  }
}

/**
 * Throws ForbiddenError if the user lacks ALL of the given permissions.
 * (Passes if user has at least one.)
 */
export async function requireAnyPermission(
  session: SessionUser,
  permissions: Permission[],
): Promise<void> {
  for (const perm of permissions) {
    if (await can(session, perm)) return;
  }
  throw new ForbiddenError("Insufficient permissions");
}

// ─── Ownership checks (IDOR prevention) ──────────────────────────────────────

/**
 * Asserts the session user owns the resource OR has the override permission.
 * Prevents IDOR: a user cannot access another user's resource by guessing IDs.
 *
 * @param session      - Current session user
 * @param ownerId      - The userId that owns the resource
 * @param overridePerm - Permission that allows bypassing ownership (e.g. "investment.view" for admins)
 */
export async function requireOwnerOrPermission(
  session: SessionUser,
  ownerId: string,
  overridePerm: Permission,
): Promise<void> {
  if (session.id === ownerId) return;
  await requirePermission(session, overridePerm);
}

/**
 * Returns true if the user owns the resource OR has the override permission.
 * Use for conditional UI rendering (server-side only).
 */
export async function canAccessResource(
  session: SessionUser,
  ownerId: string,
  overridePerm: Permission,
): Promise<boolean> {
  if (session.id === ownerId) return true;
  return can(session, overridePerm);
}

// ─── Role hierarchy helpers ───────────────────────────────────────────────────

const STAFF_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "ADMIN",
  "FINANCE_OFFICER",
  "PROJECT_MANAGER",
  "KYC_OFFICER",
  "SUPPORT",
];

const PLATFORM_ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN"];

export function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function isPlatformAdmin(role: UserRole): boolean {
  return PLATFORM_ROLES.includes(role);
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}

/**
 * Throws UnauthorizedError if not authenticated.
 * Throws ForbiddenError if not a staff member.
 */
export function requireStaff(session: SessionUser): void {
  if (!isStaff(session.role)) {
    throw new ForbiddenError("Staff access required");
  }
}

// ─── Static permission check (no DB) ─────────────────────────────────────────
// Use for middleware and proxy where DB access is not available.
// Falls back to the compile-time role matrix.

export function canStatic(role: UserRole, permission: Permission): boolean {
  if (role === "SUPER_ADMIN") return true;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
