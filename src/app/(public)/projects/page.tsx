import type { Metadata } from "next";
import Link from "next/link";
import { Search, SlidersHorizontal, Building2, ArrowRight } from "lucide-react";
import { ProjectCard } from "@/components/shared/project-card";
import { projectRepository } from "@/db/repositories/project.repository";
import { cn } from "cn";
import type { ProjectCategory, ProjectStatus } from "@prisma/client";

export const metadata: Metadata = {
  title: "Investment Projects — Biniyog Club",
  description:
    "Explore verified commercial, agricultural, trade finance, and SME investment opportunities across Bangladesh. Direct legal deeds, asset backing, and yields starting from ৳5,000.",
  openGraph: {
    title: "Investment Projects | Biniyog Club Bangladesh",
    description: "Browse curated commercial syndicates and verified projects with 14% to 26% projected annual returns.",
  },
};

const PUBLIC_STATUSES: ProjectStatus[] = ["FUNDRAISING", "FUNDED", "ACTIVE", "COMPLETED"];

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

  const category = Object.keys(CATEGORY_LABELS).includes(params.category ?? "")
    ? (params.category as ProjectCategory)
    : undefined;

  const search = params.search?.trim() || undefined;
  const sort = (Object.keys(SORT_LABELS).includes(params.sort ?? "") ? params.sort : "newest") as
    | "newest" | "deadline" | "funded_pct" | "goal_asc" | "goal_desc";
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [{ items, total, totalPages }, categoryCountRows] = await Promise.all([
    projectRepository.findMany({ status: PUBLIC_STATUSES, category, search }, sort, page, 12),
    projectRepository.countByCategory({ status: PUBLIC_STATUSES }),
  ]);

  const categoryCounts: Record<string, number> = Object.fromEntries(
    categoryCountRows.map((r) => [r.category, r.count]),
  );

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      category: params.category,
      search: params.search,
      sort: params.sort,
      page: params.page,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v && v !== "1") p.set(k, v);
    }
    const qs = p.toString();
    return `/projects${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* ── Page Header ── */}
      <div className="border-b border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-2">
            Investment Pipeline
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground leading-tight">
                All{" "}
                <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Projects
                </span>
              </h1>
              <p className="mt-2 text-sm text-muted-foreground max-w-xl leading-relaxed">
                {total} verified {total === 1 ? "project" : "projects"} available for co-investment — audited, asset-backed, and governed under the Contract Act 1872.
              </p>
            </div>
            <Link
              href="/groups"
              className="shrink-0 inline-flex items-center gap-2 rounded-none border border-border bg-background px-5 py-2.5 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Building2 className="h-3.5 w-3.5" />
              Business Groups
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ── Filters + Grid ── */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">

        {/* Search + Sort */}
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <form method="GET" action="/projects" className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by title, sector, location..."
              className="w-full rounded-none border border-input bg-card py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            {category && <input type="hidden" name="category" value={category} />}
            {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
          </form>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SORT_LABELS).map(([v, l]) => (
                <Link
                  key={v}
                  href={buildUrl({ sort: v, page: "1" })}
                  className={cn(
                    "rounded-none px-3 py-1.5 text-xs font-semibold border transition-all",
                    sort === v
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
                  )}
                >
                  {l}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Category chips */}
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href={buildUrl({ category: undefined, page: "1" })}
            className={cn(
              "rounded-none border px-4 py-1.5 text-xs font-semibold transition-all",
              !category
                ? "border-primary bg-primary text-white"
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
                  "rounded-none border px-4 py-1.5 text-xs font-semibold transition-all",
                  category === cat
                    ? "border-primary bg-primary text-white"
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
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-stretch">
              {items.map((p, i) => (
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
                  returnPctMin={p.returnPctMin?.toString()}
                  returnPctMax={p.returnPctMax?.toString()}
                  returnType={p.returnType}
                  durationDays={p.durationDays}
                  fundingDeadline={p.fundingDeadline}
                  coverImageUrl={p.coverImageUrl}
                  imageUrls={p.imageUrls}
                  location={p.location}
                  group={p.group}
                  priority={i < 4}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-3">
                {page > 1 && (
                  <Link
                    href={buildUrl({ page: String(page - 1) })}
                    className="rounded-none border border-border px-5 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    Previous
                  </Link>
                )}
                <span className="text-xs text-muted-foreground font-mono">
                  Page {page} of {totalPages}
                </span>
                {page < totalPages && (
                  <Link
                    href={buildUrl({ page: String(page + 1) })}
                    className="rounded-none border border-border px-5 py-2 text-xs font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-none border border-dashed border-border bg-card/60 py-20 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <h3 className="text-base font-semibold text-foreground">No projects found</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {search || category ? (
                <>
                  Try adjusting your filters or{" "}
                  <Link href="/projects" className="text-primary font-semibold hover:underline">
                    view all projects
                  </Link>
                  .
                </>
              ) : (
                "New verified projects are currently undergoing due diligence and will launch soon."
              )}
            </p>
          </div>
        )}
      </div>

      {/* ── Bottom CTA ── */}
      <div className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-1">Institutional Syndicates</p>
            <h2 className="text-xl font-semibold text-foreground">Looking for Directorship or Property Stakes?</h2>
            <p className="mt-1 text-sm text-muted-foreground max-w-lg leading-relaxed">
              Explore Shareholder, Directorship, Plot Booking, and Land Sharing tiers across Mariners, MOHS, and Marinozz Group.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Explore Groups <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-none border border-border px-6 py-3 text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-colors"
            >
              How It Works
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
