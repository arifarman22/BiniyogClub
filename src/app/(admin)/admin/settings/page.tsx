export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { requirePermission } from "@/lib/authz";
import { PERMISSIONS } from "@/lib/authz/permissions";
import { PageHeader } from "@/components/ui/page-header";
import { getRolePermissionsAction } from "@/server/actions/permission.actions";
import { PermissionMatrix } from "@/components/admin/permission-matrix";

export const metadata: Metadata = { title: "Settings — Admin" };

export default async function AdminSettingsPage() {
  const session = await requireSession();
  await requirePermission(session, PERMISSIONS.AUDIT_VIEW);

  const result = await getRolePermissionsAction();
  const dbPermissions = result.success ? result.data! : {};

  const canEdit = session.role === "SUPER_ADMIN" || session.role === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Platform configuration and role permissions"
      />

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Role Permission Matrix</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {canEdit
                ? "Toggle permissions per role and click Save to apply. Changes take effect on next login."
                : "Read-only view of current role permissions."}
            </p>
          </div>
        </div>

        <PermissionMatrix
          initialPermissions={dbPermissions}
          currentRole={session.role}
        />
      </div>
    </div>
  );
}
