import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getAdminExpenses } from "@/server/data/admin.data";
import { PageHeader } from "@/components/ui/page-header";
import { AdminSearchBar } from "@/components/admin/admin-search-bar";
import { AdminFilterBar } from "@/components/admin/admin-filter-bar";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminActionButton } from "@/components/admin/admin-action-button";
import { approveExpenseAction } from "@/server/actions/admin.actions";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { CheckCircle2 } from "lucide-react";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Expenses — Admin" };

const CATEGORY_OPTIONS = [
  { value: "SEEDS", label: "Seeds" }, { value: "FERTILIZER", label: "Fertilizer" },
  { value: "PESTICIDE", label: "Pesticide" }, { value: "LABOR", label: "Labor" },
  { value: "EQUIPMENT", label: "Equipment" }, { value: "IRRIGATION", label: "Irrigation" },
  { value: "TRANSPORT", label: "Transport" }, { value: "STORAGE", label: "Storage" },
  { value: "INSURANCE", label: "Insurance" }, { value: "LAND_LEASE", label: "Land Lease" },
  { value: "OTHER", label: "Other" },
];

export default async function AdminExpensesPage({ searchParams }: AsyncComponentProps) {
  const session = await requireSession();
  const sp = await searchParams ?? {};
  const search = typeof sp.search === "string" ? sp.search : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));

  const { items, total, totalPages } = await getAdminExpenses(session, { search, category, page });

  return (
    <div className="space-y-5">
      <PageHeader title="Expenses" description={`${total} total expenses`} />

      <div className="flex flex-wrap items-center gap-3">
        <AdminSearchBar placeholder="Search description, project..." className="w-64" />
        <AdminFilterBar paramName="category" options={CATEGORY_OPTIONS} allLabel="All Categories" />
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">No expenses found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Project</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden xl:table-cell">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Approved</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{e.description}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-xs text-muted-foreground">{e.category.replace(/_/g, " ")}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-xs text-muted-foreground line-clamp-1">{e.project.title}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="font-mono font-medium">{fmtBdt(e.amountBdt)}</span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">{fmtDate(e.incurredAt)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {e.approvedAt ? (
                        <CheckCircle2 className="h-4 w-4 text-success ml-auto" />
                      ) : (
                        <AdminActionButton
                          label="Approve"
                          confirmTitle="Approve Expense"
                          confirmDescription={`Approve expense of ${fmtBdt(e.amountBdt)}?`}
                          onConfirm={() => approveExpenseAction(e.id)}
                          size="xs"
                        />
                      )}
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
