import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminKycList, getKycStatusCounts } from "@/server/data/kyc.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "KYC Reviews — Admin" };

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "SUBMITTED", label: "Submitted" },
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "VERIFIED", label: "Verified" },
  { value: "REJECTED", label: "Rejected" },
  { value: "RESUBMISSION_REQUIRED", label: "Resubmission" },
] as const;

const STATUS_VARIANT: Record<string, "pending" | "review" | "approved" | "rejected" | "default"> = {
  NOT_STARTED: "default",
  SUBMITTED: "pending",
  UNDER_REVIEW: "review",
  VERIFIED: "approved",
  REJECTED: "rejected",
  RESUBMISSION_REQUIRED: "pending",
};

const STATUS_LABEL: Record<string, string> = {
  NOT_STARTED: "Not Started",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  RESUBMISSION_REQUIRED: "Resubmission",
};

export default async function AdminKycPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams;
  const statusFilter = typeof sp?.status === "string" ? sp.status : "";
  const page = typeof sp?.page === "string" ? Math.max(1, parseInt(sp.page)) : 1;

  const [{ items, total, totalPages }, counts] = await Promise.all([
    getAdminKycList(session, {
      status: statusFilter ? [statusFilter] : undefined,
      page,
      limit: 20,
    }),
    getKycStatusCounts(session),
  ]);

  const pendingCount = (counts["SUBMITTED"] ?? 0) + (counts["UNDER_REVIEW"] ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="KYC Reviews"
        description={`${pendingCount} pending review${pendingCount !== 1 ? "s" : ""}`}
      />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map(({ value, label }) => {
          const count = value ? (counts[value] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0);
          const active = statusFilter === value;
          return (
            <Link
              key={value}
              href={value ? `/admin/kyc?status=${value}` : "/admin/kyc"}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${active ? "bg-primary-foreground/20" : "bg-muted"}`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No KYC submissions found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Submitted</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Documents</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {items.map((kyc) => (
                <tr key={kyc.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium">{(kyc as typeof kyc & { user?: { name: string; email: string } }).user?.name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{(kyc as typeof kyc & { user?: { name: string; email: string } }).user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={STATUS_VARIANT[kyc.status] ?? "default"}>
                      {STATUS_LABEL[kyc.status] ?? kyc.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {kyc.submittedAt
                      ? new Date(kyc.submittedAt).toLocaleDateString("en-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                    {(kyc as typeof kyc & { _count?: { documents: number } })._count?.documents ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/kyc/${kyc.id}`}
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Review →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/kyc?${statusFilter ? `status=${statusFilter}&` : ""}page=${page - 1}`}
                className="rounded border border-border px-3 py-1 hover:bg-muted"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/kyc?${statusFilter ? `status=${statusFilter}&` : ""}page=${page + 1}`}
                className="rounded border border-border px-3 py-1 hover:bg-muted"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
