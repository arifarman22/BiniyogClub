export {
  can,
  requirePermission,
  requireAllPermissions,
  requireAnyPermission,
  requireOwnerOrPermission,
  canAccessResource,
  requireStaff,
  canStatic,
  isStaff,
  isPlatformAdmin,
  isSuperAdmin,
} from "./index";

export { PERMISSIONS, ROLE_PERMISSIONS, PERMISSION_DESCRIPTIONS } from "./permissions";
export type { Permission } from "./permissions";
