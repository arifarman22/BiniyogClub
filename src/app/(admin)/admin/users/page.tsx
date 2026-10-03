export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminUsers } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { SuspendUserButton, ActivateUserButton, DeleteUserButton } from "@/components/admin/user-action-buttons";
import { fmtDate } from "@/lib/admin/utils";
import { CheckCircle2, XCircle } from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Users — Admin" };

const ROLE_OPTIONS = [
  { value: "SUPER_ADMIN", label: "Super Admin" },
  { value: "ADMIN", label: "Admin" },
  { value: "KYC_OFFICER", label: "KYC Officer" },
  { value: "FINANCE_OFFICER", label: "Finance Officer" },
  { value: "PROJECT_MANAGER", label: "Project Manager" },
  { value: "SUPPORT", label: "Support" },
  { value: "INVESTOR", label: "Investor" },
];

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "DEACTIVATED", label: "Deactivated" },
];

const STATUS_VARIANT: Record<string, string> = {
  ACTIVE: "active", SUSPENDED: "rejected", DEACTIVATED: "default",
};

export default async function AdminUsersPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const role = typeof sp.role === "string" ? sp.role : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminUsers(session, { search, role, status, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Users" description={`${total} total users`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search name, email, phone..." className="w-64" />
        <AdminFilterBar paramName="role" options={ROLE_OPTIONS} allLabel="All Roles" />
        <AdminFilterBar paramName="status" options={STATUS_OPTIONS} allLabel="All Statuses" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No users found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">KYC</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Joined</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        {u.emailVerified ? (
                          <CheckCircle2 className="h-3 w-3 text-success" />
                        ) : (
                          <XCircle className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="text-[10px] text-muted-foreground">
                          {u.emailVerified ? "Verified" : "Unverified"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{u.role.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={STATUS_VARIANT[u.status] as never ?? "default"}>
                        {u.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {u.kyc ? (
                        <span className="text-xs text-muted-foreground">{u.kyc.status.replace(/_/g, " ")}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(u.createdAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/users/${u.id}`} className="text-xs text-primary hover:underline">View</Link>
                        {u.status === "ACTIVE" ? (
                          <SuspendUserButton userId={u.id} userName={u.name} />
                        ) : u.status === "SUSPENDED" ? (
                          <ActivateUserButton userId={u.id} userName={u.name} />
                        ) : null}
                        {u.role !== "SUPER_ADMIN" && ["SUPER_ADMIN", "ADMIN"].includes(session.role) && (
                          <DeleteUserButton userId={u.id} userName={u.name} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AdminPagination page={page} totalPages={totalPages} total={total} />
    </div>
  );
}
