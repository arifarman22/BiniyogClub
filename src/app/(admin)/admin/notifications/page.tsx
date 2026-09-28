import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminNotifications } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { fmtDateTime } from "@/lib/admin/utils";
import { CheckCircle2, Circle } from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Notifications — Admin" };

const TYPE_OPTIONS = [
  { value: "INVESTMENT_CONFIRMED", label: "Investment Confirmed" },
  { value: "PAYMENT_RECEIVED", label: "Payment Received" },
  { value: "PAYMENT_FAILED", label: "Payment Failed" },
  { value: "PROJECT_APPROVED", label: "Project Approved" },
  { value: "PROJECT_FUNDED", label: "Project Funded" },
  { value: "KYC_APPROVED", label: "KYC Approved" },
  { value: "KYC_REJECTED", label: "KYC Rejected" },
  { value: "WITHDRAWAL_COMPLETED", label: "Withdrawal Completed" },
  { value: "SYSTEM", label: "System" },
];

export default async function AdminNotificationsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const type = typeof sp.type === "string" ? sp.type : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminNotifications(session, { search, type, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description={`${total} total notifications`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search user, title..." className="w-64" />
        <AdminFilterBar paramName="type" options={TYPE_OPTIONS} allLabel="All Types" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No notifications found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">User</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Read</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Sent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((n) => (
                  <tr key={n.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{n.user.name}</p>
                      <p className="text-xs text-muted-foreground">{n.user.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{n.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{n.body}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{n.type.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {n.isRead ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDateTime(n.createdAt)}</span>
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
