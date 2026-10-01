export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminDistributionBatches } from "@/server/data/distribution.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Distributions — Admin" };

const STATUS_COLORS: Record<string, string> = {
  DRAFT:            "bg-muted text-muted-foreground",
  PENDING_APPROVAL: "bg-warning-muted text-warning-foreground",
  APPROVED:         "bg-info-muted text-info-foreground",
  POSTED:           "bg-success-muted text-success",
  VOIDED:           "bg-destructive/10 text-destructive",
};

const STATUS_OPTIONS = [
  { label: "Draft",            value: "DRAFT" },
  { label: "Pending Approval", value: "PENDING_APPROVAL" },
  { label: "Approved",         value: "APPROVED" },
  { label: "Posted",           value: "POSTED" },
  { label: "Voided",           value: "VOIDED" },
];

export default async function AdminDistributionsPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const page   = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminDistributionBatches(session, { search, status, page });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Profit Distributions"
        description={`${total} batch${total !== 1 ? "es" : ""}`}
        action={
          <Link
            href="/admin/distributions/new"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
          >
            New Distribution
          </Link>
        }
      />

      <div className="flex flex-wrap gap-3">
        <AdminSearchBar placeholder="Search project…" className="w-64" />
        <AdminFilterBar paramName="status" options={STATUS_OPTIONS} />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No distribution batches found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Net Revenue</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Total Net Payout</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Investors</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((b) => (
                  <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{b.project.title}</p>
                      <p className="text-xs text-muted-foreground">{b.project.status}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[b.status] ?? "bg-muted text-muted-foreground"}`}>
                        {b.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden md:table-cell">
                      <span className="font-mono text-sm">{fmtBdt(b.netRevenueBdt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium text-success">{fmtBdt(b.totalNetBdt)}</span>
                    </td>
                    <td className="px-4 py-3 text-center hidden lg:table-cell">
                      <span className="text-sm">{b._count.lineItems}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {b.postedAt ? fmtDate(b.postedAt) : fmtDate(b.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/distributions/${b.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        View →
                      </Link>
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
