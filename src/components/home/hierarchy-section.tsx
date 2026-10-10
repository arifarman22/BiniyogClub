"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  FolderOpen,
  TrendingUp,
  Clock,
  ArrowUpRight,
  Layers,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Landmark,
  Users,
  Briefcase,
  Coins,
  CheckCircle2,
  Lock,
  ArrowRight,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

export type Project = {
  id: string;
  title: string;
  slug: string;
  status: string;
  category: string;
  expectedReturnPct: number | null;
  returnPctMin: number | null;
  returnPctMax: number | null;
  durationDays: number;
  minInvestmentBdt: number;
  coverImageUrl?: string | null;
  imageUrls?: string[] | null;
};

export type Group = {
  id: string;
  slug: string | null;
  name: string;
  tagline: string | null;
  description?: string | null;
  logoUrl: string | null;
  coverUrl?: string | null;
  projects: Project[];
};

const STATIC_GROUPS: Group[] = [
  {
    id: "cv",
    slug: null,
    name: "Community Ventures",
    tagline: "Community-driven co-investment initiatives",
    description: "Grassroots impact ventures and collective cooperative co-investment opportunities.",
    logoUrl: null,
    coverUrl: "/images/investor-community.jpg",
    projects: [],
  },
  {
    id: "va",
    slug: null,
    name: "Venture Alliances",
    tagline: "Strategic cross-sector consortium partnerships",
    description: "Institutional joint ventures, cross-border trade, and large-scale enterprise expansion.",
    logoUrl: null,
    coverUrl: "/images/about-due-diligence.jpg",
    projects: [],
  },
];

const GROUP_VISUAL_MAP: Record<
  string,
  {
    cover: string;
    sector: string;
    code: string;
    icon: typeof Building2;
    color: string;
  }
> = {
  MARINERS: {
    cover: "/2.png",
    sector: "Maritime & Supply Chain",
    code: "GRP-01",
    icon: Landmark,
    color: "from-blue-600/90 to-blue-950/90",
  },
  MOHS: {
    cover: "/3.png",
    sector: "Real Estate & Commercial Holdings",
    code: "GRP-02",
    icon: Building2,
    color: "from-amber-600/90 to-amber-950/90",
  },
  MARINOZZ: {
    cover: "/4.png",
    sector: "Hospitality & Agro Enterprise",
    code: "GRP-03",
    icon: Sparkles,
    color: "from-teal-600/90 to-teal-950/90",
  },
  CV: {
    cover: "/images/investor-community.jpg",
    sector: "Community & Impact Ventures",
    code: "GRP-04",
    icon: Users,
    color: "from-emerald-600/90 to-emerald-950/90",
  },
  VA: {
    cover: "/images/about-due-diligence.jpg",
    sector: "Strategic Cross-Sector Alliances",
    code: "GRP-05",
    icon: Briefcase,
    color: "from-indigo-600/90 to-indigo-950/90",
  },
};

const STATUS_META: Record<string, { label: string; badge: string; dot: string }> = {
  FUNDRAISING: {
    label: "Fundraising",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    dot: "bg-emerald-500",
  },
  FUNDED: {
    label: "Funded",
    badge: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
    dot: "bg-blue-500",
  },
  ACTIVE: {
    label: "Active",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
    dot: "bg-teal-500",
  },
  COMPLETED: {
    label: "Completed",
    badge: "bg-slate-500/10 text-muted-foreground border-slate-500/30",
    dot: "bg-slate-400",
  },
};

function returnLabel(p: Project) {
  if (p.returnPctMin != null && p.returnPctMax != null)
    return `${Number(p.returnPctMin)}–${Number(p.returnPctMax)}%`;
  if (p.expectedReturnPct != null) return `${Number(p.expectedReturnPct)}%`;
  return "—";
}

function formatBdt(amount: number | null | undefined) {
  if (!amount) return "৳0";
  const n = Number(amount);
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

function getProjectFallbackImage(project: Project, index: number): string {
  if (project.coverImageUrl) return project.coverImageUrl;
  if (project.imageUrls && project.imageUrls.length > 0) return project.imageUrls[0];

  const cat = (project.category || "").toUpperCase();
  if (cat.includes("AGRO") || cat.includes("FARM") || cat.includes("AGRICULTURE")) {
    return "/images/smart-agro-farm.jpg";
  }
  if (cat.includes("LOGISTICS") || cat.includes("COLD") || cat.includes("SUPPLY")) {
    return "/images/cold-chain-sme.jpg";
  }
  if (cat.includes("TECH") || cat.includes("IT") || cat.includes("DIGITAL")) {
    return "/images/digital-kyc-verify.jpg";
  }
  if (cat.includes("RETAIL") || cat.includes("COMMERCE") || cat.includes("TRADE")) {
    return "/images/wallet-returns-payout.jpg";
  }

  const rotation = [
    "/images/smart-agro-farm.jpg",
    "/images/cold-chain-sme.jpg",
    "/images/contract-security.jpg",
    "/images/wallet-returns-payout.jpg",
    "/images/digital-kyc-verify.jpg",
  ];
  return rotation[index % rotation.length];
}

function getGroupVisual(group: Group) {
  const key = (group.slug || group.id || "").toUpperCase();
  return (
    GROUP_VISUAL_MAP[key] ?? {
      cover: group.coverUrl || "/1..png",
      sector: "Commercial Holdings",
      code: `GRP-0${group.id.slice(0, 2)}`,
      icon: Building2,
      color: "from-emerald-700/90 to-slate-950/90",
    }
  );
}

function ProjectMiniCard({ project, index }: { project: Project; index: number }) {
  const meta = STATUS_META[project.status] ?? {
    label: project.status,
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    dot: "bg-slate-400",
  };
  const imgSrc = getProjectFallbackImage(project, index);

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group relative flex gap-3 rounded-none border border-border/70 bg-card/90 backdrop-blur-sm p-3 hover:border-primary/50 hover:bg-card hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
    >
      {/* Left accent hover stripe */}
      <div className="absolute left-0 inset-y-0 w-1 bg-gradient-to-b from-primary to-teal-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Project Thumbnail Image */}
      <div className="relative h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem] shrink-0 overflow-hidden rounded-none border border-border/80 bg-muted">
        <Image
          src={imgSrc}
          alt={project.title}
          fill
          sizes="80px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
        <span className="absolute bottom-1 left-1 max-w-[calc(100%-8px)] truncate text-[9px] font-semibold tracking-wider uppercase text-white/90 bg-black/60 px-1 py-0.5 rounded-[1px]">
          {project.category}
        </span>
      </div>

      {/* Content Details */}
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-1.5 mb-1">
            <h4 className="text-xs font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors duration-200">
              {project.title}
            </h4>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200" />
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-[2px] border",
                meta.badge
              )}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${meta.dot} animate-pulse`} />
              {meta.label}
            </span>
            <span className="text-[10px] text-muted-foreground">
              Min {formatBdt(project.minInvestmentBdt)}
            </span>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="mt-2 flex items-center justify-between border-t border-border/40 pt-1.5 text-[11px]">
          <div className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span>{returnLabel(project)}</span>
            <span className="text-[9px] text-muted-foreground font-normal">p.a.</span>
          </div>

          <div className="inline-flex items-center gap-1 text-muted-foreground text-[10px]">
            <Clock className="h-3 w-3" />
            <span>{Math.round(project.durationDays / 30)} mo</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function GroupCard({ group, index }: { group: Group; index: number }) {
  const isLive = Boolean(group.slug);
  const visual = getGroupVisual(group);
  const GroupIcon = visual.icon;
  const coverImage = group.coverUrl || visual.cover;

  return (
    <AnimatedSection delay={index * 80} animation="fade-up" className="flex flex-col h-full">
      <div className="flex flex-col h-full rounded-none border border-border/80 bg-card shadow-sm overflow-hidden hover:border-primary/40 hover:shadow-xl transition-all duration-300 group">
        {/* Cover Image & Header Banner */}
        <div className="relative h-36 w-full overflow-hidden bg-slate-900">
          <Image
            src={coverImage}
            alt={group.name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 ease-out"
          />
          {/* Multi-stage gradient overlays for high contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/40" />

          {/* Top badges bar */}
          <div className="absolute top-3 inset-x-3 flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-none bg-black/60 backdrop-blur-md text-emerald-400 border border-emerald-500/30">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              {visual.code}
            </span>

            {isLive ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/80 backdrop-blur-md px-2 py-0.5 border border-emerald-500/30">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Active Holding
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/80 backdrop-blur-md px-2 py-0.5 border border-amber-500/30">
                <Lock className="h-2.5 w-2.5 text-amber-400" />
                Incubating
              </span>
            )}
          </div>

          {/* Bottom Banner Content */}
          <div className="absolute bottom-3 inset-x-3 flex items-end justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Group Brand Logo / Icon Box */}
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-white/95 dark:bg-card/95 border border-primary/30 shadow-lg text-primary backdrop-blur-md">
                {group.logoUrl ? (
                  <div className="relative h-7 w-7">
                    <Image src={group.logoUrl} alt={group.name} fill className="object-contain" />
                  </div>
                ) : (
                  <GroupIcon className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 truncate">
                  {visual.sector}
                </p>
                <h3 className="text-base font-bold text-white leading-tight truncate drop-shadow-sm">
                  {group.name}
                </h3>
              </div>
            </div>
          </div>
        </div>

        {/* Card Sub-header & Description */}
        <div className="px-4 py-3 border-b border-border/60 bg-muted/20">
          <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem] leading-relaxed">
            {group.tagline || group.description || "Corporate holding entity operating verified co-investment ventures."}
          </p>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
            <div className="inline-flex items-center gap-1.5 font-medium">
              <Layers className="h-3.5 w-3.5 text-primary" />
              <span>
                {group.projects.length} Asset{group.projects.length !== 1 ? "s" : ""} Hosted
              </span>
            </div>

            {isLive ? (
              <Link
                href={`/groups/${group.slug!.toLowerCase()}`}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:text-primary/80 transition-colors"
              >
                <span>Details</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="text-[10px] text-muted-foreground font-medium">Audit in progress</span>
            )}
          </div>
        </div>

        {/* Nested Projects Showcase */}
        <div className="flex flex-col gap-2.5 p-3 flex-1 bg-gradient-to-b from-transparent to-muted/10">
          <div className="flex items-center justify-between text-[10px] font-bold tracking-wider uppercase text-muted-foreground/80 px-1 pt-1">
            <span>Commercial Projects</span>
            {group.projects.length > 0 && (
              <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                Live &amp; Vetted
              </span>
            )}
          </div>

          {group.projects.length > 0 ? (
            <div className="flex flex-col gap-2">
              {group.projects.map((project, pIdx) => (
                <ProjectMiniCard key={project.id} project={project} index={pIdx} />
              ))}
            </div>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-none border border-dashed border-border/70 bg-card/40 p-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-none bg-muted/60 text-muted-foreground border border-border/50">
                <FolderOpen className="h-5 w-5 stroke-[1.5]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">Upcoming Project Pipeline</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 max-w-[200px] leading-relaxed">
                  Compliance and risk underwriting currently in progress for co-investment listing.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Group Footer Action */}
        <div className="p-3 pt-0 border-t border-border/40 bg-card">
          {isLive ? (
            <Link
              href={`/groups/${group.slug!.toLowerCase()}`}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-foreground bg-muted/50 hover:bg-primary hover:text-white border border-border/60 hover:border-primary transition-all duration-200"
            >
              <span>Explore {group.name} Portfolio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <div className="mt-2 w-full py-2 px-3 text-center text-[11px] font-medium text-muted-foreground bg-muted/30 border border-border/40">
              Pipeline Scheduled for Q3 2026
            </div>
          )}
        </div>
      </div>
    </AnimatedSection>
  );
}

interface HierarchySectionProps {
  groups: Group[];
}

export function HierarchySection({ groups }: HierarchySectionProps) {
  const [filterMode, setFilterMode] = useState<"ALL" | "ACTIVE" | "UPCOMING">("ALL");

  const allGroups: Group[] = [
    ...groups,
    ...STATIC_GROUPS.map((sg) => ({ ...sg, projects: [] as Project[] })),
  ];

  const filteredGroups = allGroups.filter((g) => {
    if (filterMode === "ACTIVE") return Boolean(g.slug);
    if (filterMode === "UPCOMING") return !g.slug;
    return true;
  });

  const totalProjects = allGroups.reduce((acc, g) => acc + g.projects.length, 0);

  return (
    <section
      className="relative py-24 lg:py-28 bg-muted/40 overflow-hidden"
      id="structure"
    >
      {/* Decorative ambient background glows */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[800px] h-72 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-primary/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-40 right-10 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* ── Section Heading ── */}
        <AnimatedSection animation="fade-down" className="text-center max-w-3xl mx-auto mb-14">
          <SectionHeading
            eyebrow="Institutional architecture"
            title="Two-tier co-investment"
            highlight="structure & ecosystem"
            description="Capital flows through vetted parent holding groups directly into tangible, asset-backed ventures — combining corporate governance with commercial returns."
          />

          {/* Quick Architecture Indicators */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs text-muted-foreground">
            <div className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-foreground">1 Central Platform Hub</span>
            </div>
            <span className="text-border hidden sm:inline">•</span>
            <div className="inline-flex items-center gap-1.5">
              <Building2 className="h-4 w-4 text-teal-500" />
              <span className="font-semibold text-foreground">{allGroups.length} Business Groups</span>
            </div>
            <span className="text-border hidden sm:inline">•</span>
            <div className="inline-flex items-center gap-1.5">
              <Coins className="h-4 w-4 text-emerald-500" />
              <span className="font-semibold text-foreground">{totalProjects} Live Commercial Assets</span>
            </div>
          </div>
        </AnimatedSection>

        {/* ── Tier 1: Platform Root Node Architecture ── */}
        <AnimatedSection animation="fade-down" delay={100} className="flex flex-col items-center mb-12">
          {/* Master Hub Card */}
          <div className="relative group w-full max-w-xl rounded-none border border-primary/30 bg-card/95 backdrop-blur-md p-5 sm:p-6 shadow-2xl shadow-primary/5 hover:border-primary/50 transition-all duration-300">
            {/* Top glowing line */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-primary" />

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              {/* Official Platform Emblem */}
              <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-none bg-primary text-white shadow-md shadow-primary/30">
                <Image
                  src="/Biniyog Club Logo Icon PNG.png"
                  alt="Biniyog Club Emblem"
                  width={34}
                  height={34}
                  className="object-contain brightness-0 invert"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-between gap-2 mb-1">
                  <span className="text-[10px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-2 py-0.5 border border-primary/20">
                    Tier-1 Master Custody
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Central Escrow Active
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">Biniyog Club Core Platform</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Centralized institutional due diligence, legally binding digital contracts, verified KYC onboarding, and automated wallet escrow distributions.
                </p>
              </div>
            </div>

            {/* Platform Guarantees Badges */}
            <div className="mt-4 pt-3 border-t border-border/60 grid grid-cols-3 gap-2 text-center text-[10px] font-medium text-muted-foreground">
              <div className="px-1 py-1 bg-muted/40 border border-border/40">
                Contract Act 1872 Compliant
              </div>
              <div className="px-1 py-1 bg-muted/40 border border-border/40">
                100% Shariah-Vetted
              </div>
              <div className="px-1 py-1 bg-muted/40 border border-border/40">
                Multi-Sign Escrow
              </div>
            </div>
          </div>

          {/* Vertical Stem Connector */}
          <div className="flex flex-col items-center">
            <div className="h-8 w-0.5 bg-gradient-to-b from-primary via-primary/60 to-teal-500" />
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-primary/40 bg-card shadow-sm text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="h-6 w-0.5 bg-gradient-to-b from-teal-500 to-border" />
          </div>

          {/* Horizontal Bus Distribution Bar (Desktop/Tablet) */}
          <div className="hidden md:flex w-full max-w-5xl items-center justify-between relative px-8">
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-border to-transparent" />
            {/* Visual junction nodes */}
            <div className="absolute inset-x-12 flex justify-between pointer-events-none">
              <span className="h-2 w-2 -mt-[3px] rounded-full bg-primary/40 border border-card" />
              <span className="h-2 w-2 -mt-[3px] rounded-full bg-primary/40 border border-card" />
              <span className="h-2 w-2 -mt-[3px] rounded-full bg-primary border border-card" />
              <span className="h-2 w-2 -mt-[3px] rounded-full bg-primary/40 border border-card" />
              <span className="h-2 w-2 -mt-[3px] rounded-full bg-primary/40 border border-card" />
            </div>
          </div>
        </AnimatedSection>

        {/* ── Interactive View Filter Tabs ── */}
        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-primary">Tier-2 Corporate Holdings</p>
            <h3 className="text-xl font-bold text-foreground">Institutional Business Groups</h3>
          </div>

          <div className="inline-flex rounded-none border border-border bg-card p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setFilterMode("ALL")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                filterMode === "ALL"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              All Holdings ({allGroups.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("ACTIVE")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                filterMode === "ACTIVE"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Active Live ({groups.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode("UPCOMING")}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold transition-all duration-200",
                filterMode === "UPCOMING"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Incubating ({STATIC_GROUPS.length})
            </button>
          </div>
        </div>

        {/* ── Tier 2 & 3: Group Cards & Embedded Projects ── */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredGroups.map((group, i) => (
            <GroupCard key={group.id} group={group} index={i} />
          ))}
        </div>

        {/* ── Bottom Call To Action Hub ── */}
        <AnimatedSection
          animation="fade-up"
          delay={350}
          className="mt-14 rounded-none border border-border/80 bg-gradient-to-r from-card via-muted/20 to-card p-6 sm:p-8 shadow-sm text-center max-w-4xl mx-auto"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-left">
            <div className="max-w-xl">
              <h4 className="text-lg font-bold text-foreground">
                Ready to co-invest in verified commercial projects?
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                Choose an individual project or co-invest directly at the parent holding group level to gain diversified profit allocations.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                href="/projects"
                className="inline-flex items-center gap-2 rounded-none border border-border bg-card px-5 py-2.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary transition-all duration-200 shadow-sm"
              >
                <span>Browse Projects</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
              <Link
                href="/groups"
                className="inline-flex items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-all duration-200 shadow-md shadow-primary/20"
              >
                <span>Explore All Groups</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
