import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/shared/project-card";
import { projectRepository } from "@/db/repositories/project.repository";
import { cn } from "cn";
import type { ProjectCategory, ProjectStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Investment Projects",
  description:
    "Browse verified agricultural investment projects across Bangladesh. Crop farming, aquaculture, livestock, poultry and more. Start from ৳5,000.",
  openGraph: {
    title: "Agricultural Investment Projects — Biniyog Club",
    description: "Explore live farm investment opportunities across Bangladesh.",
  },
};

const PUBLIC_STATUSES: ProjectStatus[] = [
  "FUNDRAISING", "FUNDED", "ACTIVE", "COMPLETED",
];

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE: "Real Estate",
  TRADE_FINANCE: "Trade Finance",
  SME: "SME",
  TECHNOLOGY: "Technology",
  INFRASTRUCTURE: "Infrastructure",
  OTHER: "Other",
};

const SORT_LABELS: Record<string, string> = {
  newest: "Newest",
  deadline: "Deadline Soon",
  funded_pct: "Most Funded",
  goal_asc: "Smallest Goal",
  goal_desc: "Largest Goal",
};

type SearchParams = Promise<{
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
}>;

export default async function ProjectsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const category = Object.values<string>(
    Object.fromEntries(
      Object.entries(CATEGORY_LABELS).map(([k]) => [k, k])
    )
  ).includes(params.category ?? "")
    ? (params.category as ProjectCategory)
    : undefined;

  const search = params.search?.trim() || undefined;
  const sort = (Object.keys(SORT_LABELS).includes(params.sort ?? "") ? params.sort : "newest") as
    | "newest" | "deadline" | "funded_pct" | "goal_asc" | "goal_desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [{ items, total, totalPages }, categoryCountRows] = await Promise.all([
    projectRepository.findMany(
      { status: PUBLIC_STATUSES, category, search },
      sort,
      page,
      12,
    ),
    projectRepository.countByCategory({ status: PUBLIC_STATUSES }),
  ]);

  // Category counts via groupBy — single aggregation query, no row scan
  const categoryCounts: Record<string, number> = Object.fromEntries(
    categoryCountRows.map((r) => [r.category, r.count]),
  );

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = { category: params.category, search: params.search, sort: params.sort, page: params.page, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "1") p.set(k, v);
    }
    const qs = p.toString();
    return `/projects${qs ? `?${qs}` : ""}`;
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Investment Projects</h1>
          <p className="text-brand-100/90">
            {total} verified project{total !== 1 ? "s" : ""} across Bangladesh
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search + sort bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <form method="GET" action="/projects" className="relative flex-1 min-w-56">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search projects, locations..."
                className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {category && <input type="hidden" name="category" value={category} />}
              {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
            </form>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {Object.entries(SORT_LABELS).map(([v, l]) => (
                  <Link
                    key={v}
                    href={buildUrl({ sort: v, page: "1" })}
                    className={cn(
                      "rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                      sort === v
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Category filter chips */}
          <div className="mb-8 flex flex-wrap gap-2">
            <Link
              href={buildUrl({ category: undefined, page: "1" })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                !category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              All ({total})
            </Link>
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const count = categoryCounts[cat] ?? 0;
              if (count === 0) return null;
              return (
                <Link
                  key={cat}
                  href={buildUrl({ category: cat, page: "1" })}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                    category === cat
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {label} ({count})
                </Link>
              );
            })}
          </div>

          {/* Results */}
          {items.length > 0 ? (
            <>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((p) => (
                  <ProjectCard
                    key={p.id}
                    slug={p.slug}
                    title={p.title}
                    description={p.description}
                    category={p.category}
                    status={p.status}
                    fundingGoalBdt={p.fundingGoalBdt.toString()}
                    fundedAmountBdt={p.fundedAmountBdt.toString()}
                    minInvestmentBdt={p.minInvestmentBdt.toString()}
                    expectedReturnPct={p.expectedReturnPct.toString()}
                    returnType={p.returnType}
                    durationDays={p.durationDays}
                    fundingDeadline={p.fundingDeadline}
                    coverImageUrl={p.coverImageUrl}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-2">
                  {page > 1 && (
                    <Link href={buildUrl({ page: String(page - 1) })} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                      Previous
                    </Link>
                  )}
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link href={buildUrl({ page: String(page + 1) })} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-20 text-center">
              <p className="text-2xl mb-2">🌱</p>
              <p className="font-medium">No projects found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search || category ? (
                  <>
                    Try adjusting your filters or{" "}
                    <Link href="/projects" className="text-primary hover:underline">clear all</Link>
                  </>
                ) : (
                  "New projects are launching soon."
                )}
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
