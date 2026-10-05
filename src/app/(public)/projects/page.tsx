import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Landmark,
  ArrowRight,
  Building2,
  CheckCircle2,
  Layers,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjectCard } from "@/components/shared/project-card";
import { projectRepository } from "@/db/repositories/project.repository";
import { cn } from "cn";
import type { ProjectCategory, ProjectStatus } from "@prisma/client";
import { AnimatedSection } from "@/components/shared/animated-section";

export const metadata: Metadata = {
  title: "Investment Opportunities — Vetted Direct Portfolios | Biniyog Club",
  description:
    "Explore verified commercial, agricultural, trade finance, and SME investment opportunities across Bangladesh. Direct legal deeds, asset backing, and yields starting from ৳5,000.",
  openGraph: {
    title: "Investment Opportunities | Biniyog Club Bangladesh",
    description: "Browse curated commercial syndicates and verified projects with 14% to 26% projected annual returns.",
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

const SECTOR_HIGHLIGHTS = [
  {
    title: "Smart Agro & Farming",
    subtitle: "High-yield commercial agriculture, cold storage & supply chain",
    image: "/images/smart-agro-farm.jpg",
    expectedReturn: "16% - 24% p.a.",
    tag: "Agro Syndicate",
  },
  {
    title: "SME & Commercial Trade",
    subtitle: "Working capital & inventory financing for audited Bangladeshi SMEs",
    image: "/images/cold-chain-sme.jpg",
    expectedReturn: "14% - 22% p.a.",
    tag: "Trade Finance",
  },
  {
    title: "Asset-Backed Commercial",
    subtitle: "Industrial manufacturing, logistics facilities & structured covenants",
    image: "/images/contract-security.jpg",
    expectedReturn: "15% - 26% p.a.",
    tag: "Secured Portfolios",
  },
];

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
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 py-20 lg:py-24 text-white border-b border-border/40">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-down">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-emerald-300 backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>CURATED DIRECT INVESTMENTS • REAL ECONOMY CO-INVESTMENT</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-4xl mx-auto leading-tight">
              Co-Investment Opportunities in Bangladesh&apos;s{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Real Economy
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg font-normal text-slate-100 max-w-3xl mx-auto leading-relaxed">
              Explore audited commercial syndicates, agricultural ventures, SME trade finance, and expansion portfolios. Every opportunity is vetted by our Dhaka finance team, protected under the Contract Act 1872, and governed by segregated bank escrow.
            </p>
          </AnimatedSection>

          {/* Trust Guarantees Bar */}
          <AnimatedSection animation="fade-up" delay={120}>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto">
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 text-left">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Entry Level</span>
                <p className="text-xl sm:text-2xl font-normal text-white font-mono mt-0.5">৳5,000</p>
                <p className="text-xs text-slate-200 font-normal mt-0.5">Start with minimal capital</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 text-left">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Target Yield</span>
                <p className="text-xl sm:text-2xl font-normal text-white font-mono mt-0.5">14% - 26%</p>
                <p className="text-xs text-slate-200 font-normal mt-0.5">Annualized milestone returns</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 text-left">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Legal Security</span>
                <p className="text-xl sm:text-2xl font-normal text-white font-mono mt-0.5">Contract Act</p>
                <p className="text-xs text-slate-200 font-normal mt-0.5">Enforceable digital deeds</p>
              </div>

              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4 text-left">
                <span className="text-[10px] uppercase tracking-wider text-emerald-300 font-bold">Track Record</span>
                <p className="text-xl sm:text-2xl font-normal text-white font-mono mt-0.5">100%</p>
                <p className="text-xs text-slate-200 font-normal mt-0.5">On-time return disbursements</p>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 2. Sector Highlights Showcase with Rich Imagery ── */}
      <section className="relative z-20 -mt-8 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SECTOR_HIGHLIGHTS.map((item, idx) => (
            <AnimatedSection key={item.title} delay={idx * 80} animation="fade-up">
              <div className="group relative overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-5 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-xl">
                <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <span className="absolute top-3 right-3 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-200 uppercase tracking-wider">
                    {item.tag}
                  </span>
                  <span className="absolute bottom-3 left-3 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 px-3 py-0.5 text-xs font-bold text-emerald-200">
                    {item.expectedReturn}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 mt-1.5 leading-relaxed">
                  {item.subtitle}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── 3. Discovery Engine: Search, Filters & Project Cards ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header row */}
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border/60">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-2">
                <span>ACTIVE PIPELINE</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-900 dark:text-white">
                All Available Opportunities
              </h2>
              <p className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-200 mt-1">
                Showing {total} verified investment {total === 1 ? "project" : "projects"} currently available for syndication
              </p>
            </div>

            {/* Quick links to Groups */}
            <Link
              href="/groups"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20 transition-all shrink-0"
            >
              <Building2 className="h-3.5 w-3.5" /> Explore Partner Business Groups <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Search + Sort Bar */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <form method="GET" action="/projects" className="relative flex-1 min-w-[260px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 dark:text-slate-300" />
              <input
                name="search"
                defaultValue={search}
                placeholder="Search projects by title, sector, location..."
                className="w-full rounded-2xl border border-input bg-card py-2.5 pl-10 pr-4 text-sm font-normal text-slate-900 dark:text-white outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {category && <input type="hidden" name="category" value={category} />}
              {sort !== "newest" && <input type="hidden" name="sort" value={sort} />}
            </form>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-slate-700 dark:text-slate-300" />
              <div className="flex flex-wrap gap-1">
                {Object.entries(SORT_LABELS).map(([v, l]) => (
                  <Link
                    key={v}
                    href={buildUrl({ sort: v, page: "1" })}
                    className={cn(
                      "rounded-xl px-3 py-1.5 text-xs font-semibold transition-all",
                      sort === v
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "bg-muted text-slate-800 dark:text-slate-200 hover:text-foreground hover:bg-muted/80",
                    )}
                  >
                    {l}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Category Filter Chips */}
          <div className="mb-10 flex flex-wrap gap-2">
            <Link
              href={buildUrl({ category: undefined, page: "1" })}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                !category
                  ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "border-slate-300 dark:border-white/20 bg-card text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 hover:text-foreground",
              )}
            >
              All Sectors ({total})
            </Link>
            {Object.entries(CATEGORY_LABELS).map(([cat, label]) => {
              const count = categoryCounts[cat] ?? 0;
              if (count === 0) return null;
              return (
                <Link
                  key={cat}
                  href={buildUrl({ category: cat, page: "1" })}
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
                    category === cat
                      ? "border-emerald-600 bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                      : "border-slate-300 dark:border-white/20 bg-card text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 hover:text-foreground",
                  )}
                >
                  {label} ({count})
                </Link>
              );
            })}
          </div>

          {/* Results Grid */}
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
                      className="rounded-full border border-slate-300 dark:border-white/20 px-5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="text-xs text-slate-800 dark:text-slate-200 font-mono font-medium">
                    Page {page} of {totalPages}
                  </span>
                  {page < totalPages && (
                    <Link
                      href={buildUrl({ page: String(page + 1) })}
                      className="rounded-full border border-slate-300 dark:border-white/20 px-5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:border-emerald-500/50 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-border/80 bg-card/60 py-20 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No matching projects found</h3>
              <p className="mt-2 text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 max-w-md mx-auto leading-relaxed">
                {search || category ? (
                  <>
                    Try adjusting your filters, searching with different terms, or{" "}
                    <Link href="/projects" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">
                      view all available projects
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
      </section>

      {/* ── 4. Cross-Promotion: Institutional Business Groups ── */}
      <section className="py-20 bg-gradient-to-b from-card to-background border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-3">
                <Building2 className="h-3.5 w-3.5" />
                <span>INSTITUTIONAL SYNDICATES</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-900 dark:text-white">
                Looking for Higher-Tier Directorship or Property Stakes?
              </h2>
              <p className="mt-3 text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                In addition to commercial projects, Biniyog Club partners directly with leading conglomerate entities—Mariners Group, MOHS Group, and Marinozz Group. Explore Shareholder, Directorship, Plot Booking, and Land Sharing tiers.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3.5 shrink-0">
              <Link
                href="/groups"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5"
              >
                Explore Business Groups <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 dark:border-white/20 px-8 py-3.5 text-sm font-semibold text-slate-900 dark:text-white transition-all hover:border-emerald-500/50 hover:bg-muted/30"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
