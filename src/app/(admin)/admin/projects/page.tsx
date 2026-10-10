import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { getAdminProjects, getProjectStatusCounts } from "@/server/data/admin.data";
import { DeleteProjectButton } from "@/components/admin/delete-project-button";
import type { ProjectStatus, ProjectCategory } from "@prisma/client";

export const metadata: Metadata = { title: "Projects — Admin" };

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending", APPROVED: "Approved",
  FUNDRAISING: "Fundraising", FUNDED: "Funded", ACTIVE: "Active",
  HARVESTING: "Harvesting", SOLD: "Sold", PROFIT_CALCULATION: "Profit Calc",
  DISTRIBUTION: "Distribution", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  PENDING_APPROVAL: "bg-warning-muted text-warning-foreground",
  APPROVED: "bg-info-muted text-info-foreground",
  FUNDRAISING: "bg-harvest-100 text-harvest-600",
  FUNDED: "bg-brand-100 text-brand-700",
  ACTIVE: "bg-brand-100 text-brand-700",
  HARVESTING: "bg-finance-100 text-finance-600",
  SOLD: "bg-finance-100 text-finance-600",
  PROFIT_CALCULATION: "bg-finance-100 text-finance-600",
  DISTRIBUTION: "bg-finance-100 text-finance-600",
  COMPLETED: "bg-success-muted text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const CATEGORY_LABELS: Record<string, string> = {
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing", OTHER: "Other",
};

type SearchParams = Promise<{
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
}>;

function formatBdt(n: number | string) {
  const v = Number(n);
  if (v >= 100000) return `৳${(v / 100000).toFixed(1)}L`;
  return `৳${v.toLocaleString()}`;
}

function fundingPct(funded: number | string, goal: number | string) {
  return Math.min(100, Math.round((Number(funded) / Number(goal)) * 100));
}

export default async function AdminProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const status = params.status as ProjectStatus | undefined;
  const category = params.category as ProjectCategory | undefined;
  const search = params.search;
  const sort = (params.sort ?? "newest") as "newest" | "oldest" | "deadline" | "funded_pct" | "goal_asc" | "goal_desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [{ items, total, totalPages }, statusCounts] = await Promise.all([
    getAdminProjects({ status, category, search }, sort, page, 20),
    getProjectStatusCounts(),
  ]);

  const totalAll = Object.values(statusCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Projects</h1>
          <p className="text-sm text-muted-foreground">{totalAll} total projects</p>
        </div>
        <Link href="/admin/projects/new" className={cn(buttonVariants({ size: "sm" }))}>
          <Plus className="h-4 w-4 mr-1" /> New Project
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/admin/projects"
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            !status ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50",
          )}
        >
          All ({totalAll})
        </Link>
        {Object.entries(STATUS_LABELS).map(([s, label]) => {
          const count = statusCounts[s] ?? 0;
          if (count === 0 && s !== status) return null;
          return (
            <Link
              key={s}
              href={`/admin/projects?status=${s}`}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                status === s ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50",
              )}
            >
              {label} ({count})
            </Link>
          );
        })}
      </div>

      {/* Search + sort bar */}
      <div className="flex flex-wrap items-center gap-3">
        <form className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            name="search"
            defaultValue={search}
            placeholder="Search projects..."
            className="w-full rounded-xl border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          />
        </form>
        <form method="get">
          <input type="hidden" name="status" value={status ?? ""} />
          <input type="hidden" name="search" value={search ?? ""} />
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10"
          >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="deadline">Deadline soon</option>
          <option value="funded_pct">Most funded</option>
          <option value="goal_desc">Largest goal</option>
          <option value="goal_asc">Smallest goal</option>
          </select>
          <button type="submit" className="rounded-xl border border-input bg-background px-3 py-2 text-sm hover:bg-muted/40">Sort</button>
        </form>
      </div>

      {/* Table */}
      {items.length > 0 ? (
        <div className="surface-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Group / Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden lg:table-cell">Funding</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden xl:table-cell">Deadline</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {items.map((p) => {
                const pct = fundingPct(p.fundedAmountBdt.toString(), p.fundingGoalBdt.toString());
                return (
                  <tr key={p.id} className="hover:bg-primary/[0.03] transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-1">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.location ?? p.category}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {p.group ? (
                        <span className="text-xs font-medium text-primary">{p.group.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{CATEGORY_LABELS[p.category] ?? p.category}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-xs font-medium">{formatBdt(p.fundingGoalBdt.toString())}</p>
                      <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-[10px] text-muted-foreground">{pct}% funded</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground")}>
                        {STATUS_LABELS[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-xs text-muted-foreground">
                        {new Date(p.fundingDeadline).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link href={`/admin/projects/${p.id}`} className={cn(buttonVariants({ size: "xs", variant: "outline" }))}>
                          View
                        </Link>
                        <Link href={`/admin/projects/${p.id}/edit`} className={cn(buttonVariants({ size: "xs", variant: "ghost" }))}>
                          Edit
                        </Link>
                        <DeleteProjectButton projectId={p.id} projectTitle={p.title} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="surface-card border-dashed py-16 text-center">
          <p className="text-muted-foreground">No projects found.</p>
          <Link href="/admin/projects/new" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
            Create First Project
          </Link>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Showing {(page - 1) * 20 + 1}–{Math.min(page * 20, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/projects?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/projects?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
