import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminUserById } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { suspendUserAction, activateUserAction, changeUserRoleAction, deleteUserAction } from "@/server/actions/admin.actions";
import { fmtDate, fmtDateTime } from "@/lib/admin/utils";
import { NotFoundError } from "@/lib/errors";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "User Detail — Admin" };

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 py-2 border-b border-border last:border-0">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function AdminUserDetailPage({ params }: AsyncComponentProps) {
  const session = await requireSession();
  const { id } = await params!;
  const user = await getAdminUserById(session, id as string);
  if (!user) throw new NotFoundError("User");

  const STATUS_VARIANT: Record<string, string> = {
    ACTIVE: "active", SUSPENDED: "rejected", DEACTIVATED: "default",
  };

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={user.name}
        breadcrumb={<Link href="/admin/users" className="text-xs text-muted-foreground hover:text-foreground">← Back to users</Link>}
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={STATUS_VARIANT[user.status] as never ?? "default"}>{user.status}</StatusBadge>
          </div>
        }
      />

      {/* Account info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Account</h2>
        <InfoRow label="Email" value={user.email} />
        <InfoRow label="Phone" value={user.phone} />
        <InfoRow label="Role" value={user.role.replace(/_/g, " ")} />
        <InfoRow label="Status" value={user.status} />
        <div className="flex gap-4 py-2 border-b border-border">
          <span className="w-36 shrink-0 text-sm text-muted-foreground">Email verified</span>
          <span className="flex items-center gap-1 text-sm">
            {user.emailVerified
              ? <><CheckCircle2 className="h-4 w-4 text-success" /> Verified</>
              : <><XCircle className="h-4 w-4 text-muted-foreground" /> Not verified</>
            }
          </span>
        </div>
        <InfoRow label="Joined" value={fmtDate(user.createdAt)} />
        <InfoRow label="Last updated" value={fmtDateTime(user.updatedAt)} />
        {user.deletedAt && <InfoRow label="Deleted" value={fmtDateTime(user.deletedAt)} />}
      </div>

      {/* KYC */}
      {user.kyc && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">KYC</h2>
          <InfoRow label="Status" value={user.kyc.status.replace(/_/g, " ")} />
          <InfoRow label="Submitted" value={fmtDate(user.kyc.submittedAt)} />
          <InfoRow label="Reviewed" value={fmtDate(user.kyc.reviewedAt)} />
          <div className="mt-3">
            <Link href={`/admin/kyc/${user.kyc.id}`} className="text-xs text-primary hover:underline">
              View KYC submission →
            </Link>
          </div>
        </div>
      )}

      {/* Actions */}
      {!user.deletedAt && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 font-semibold">Actions</h2>
          <div className="flex flex-wrap gap-2">
            {user.status === "ACTIVE" ? (
              <AdminActionButton
                label="Suspend User"
                confirmTitle="Suspend User"
                confirmDescription={`Suspend ${user.name}? They will not be able to log in.`}
                onConfirm={() => suspendUserAction(user.id)}
                variant="destructive"
                size="sm"
              />
            ) : user.status === "SUSPENDED" ? (
              <AdminActionButton
                label="Activate User"
                confirmTitle="Activate User"
                confirmDescription={`Reactivate ${user.name}'s account?`}
                onConfirm={() => activateUserAction(user.id)}
                size="sm"
              />
            ) : null}

            {session.role === "SUPER_ADMIN" && (
              <AdminActionButton
                label="Delete User"
                confirmTitle="Delete User"
                confirmDescription={`Permanently soft-delete ${user.name}? This cannot be undone.`}
                onConfirm={() => deleteUserAction(user.id)}
                variant="destructive"
                size="sm"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
