import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminAuditLogs } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtDateTime } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";
import type { AsyncComponentProps } from "@/types";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit Logs — Admin" };

const ACTION_OPTIONS = [
  { value: "CREATE", label: "Create" }, { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" }, { value: "APPROVE", label: "Approve" },
  { value: "REJECT", label: "Reject" }, { value: "SUSPEND", label: "Suspend" },
  { value: "ACTIVATE", label: "Activate" }, { value: "LOGIN", label: "Login" },
  { value: "LOGOUT", label: "Logout" }, { value: "EXPORT", label: "Export" },
];

const ACTION_COLOR: Record<string, string> = {
  CREATE: "bg-success-muted text-success",
  UPDATE: "bg-info-muted text-info-foreground",
  DELETE: "bg-destructive/10 text-destructive",
  APPROVE: "bg-success-muted text-success",
  REJECT: "bg-destructive/10 text-destructive",
  SUSPEND: "bg-warning-muted text-warning-foreground",
  ACTIVATE: "bg-success-muted text-success",
  LOGIN: "bg-muted text-muted-foreground",
  LOGOUT: "bg-muted text-muted-foreground",
  EXPORT: "bg-info-muted text-info-foreground",
};

export default async function AdminAuditLogsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const action = typeof sp.action === "string" ? sp.action : "";
  const entityType = typeof sp.entityType === "string" ? sp.entityType : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminAuditLogs(session, { search, action, entityType, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Audit Logs" description={`${total} log entries`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search actor, entity ID..." className="w-64" />
        <AdminFilterBar paramName="action" options={ACTION_OPTIONS} allLabel="All Actions" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No audit logs found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Actor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Entity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Entity ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">IP</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((log) => (
                  <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      {log.actor ? (
                        <>
                          <p className="font-medium">{log.actor.name}</p>
                          <p className="text-xs text-muted-foreground">{log.actor.role.replace(/_/g, " ")}</p>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">System</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                        ACTION_COLOR[log.action] ?? "bg-muted text-muted-foreground",
                      )}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{log.entityType}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
                        {log.entityId}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="font-mono text-xs text-muted-foreground">{log.ipAddress ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDateTime(log.createdAt)}</span>
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
