import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  MapPin,
  TrendingUp,
  Building2,
  Coins,
  Briefcase,
  Cpu,
  Landmark,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProjectCategory, ProjectStatus, ReturnType } from "@prisma/client";

export type ProjectCardProps = {
  slug: string;
  title: string;
  description: string;
  category: ProjectCategory;
  status: ProjectStatus;
  fundingGoalBdt: number | string;
  fundedAmountBdt: number | string;
  minInvestmentBdt: number | string;
  expectedReturnPct: number | string;
  returnType: ReturnType;
  durationDays: number;
  fundingDeadline: Date | string;
  coverImageUrl?: string | null;
  location?: string | null;
  group?: { name: string; slug: string } | null;
  priority?: boolean;
};

const CATEGORY_META: Record<
  string,
  { label: string; icon: typeof Building2 }
> = {
  REAL_ESTATE: { label: "Real Estate", icon: Building2 },
  TRADE_FINANCE: { label: "Trade Finance", icon: Coins },
  SME: { label: "SME Business", icon: Briefcase },
  TECHNOLOGY: { label: "Technology", icon: Cpu },
  INFRASTRUCTURE: { label: "Infrastructure", icon: Landmark },
  OTHER: { label: "General", icon: Sparkles },
};

const STATUS_LABELS: Record<string, string> = {
  FUNDRAISING: "Open for Investment",
  FUNDED: "Fully Funded",
  ACTIVE: "In Progress",
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
};

function formatBdt(amount: number | string) {
  const n = Number(amount);
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

function fundingPercent(funded: number | string, goal: number | string) {
  const g = Number(goal);
  if (!g) return 0;
  return Math.min(Math.round((Number(funded) / g) * 100), 100);
}

function daysLeft(deadline: Date | string) {
  return Math.max(
    0,
    Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000),
  );
}

export function ProjectCard({
  slug,
  title,
  description,
  category,
  status,
  fundingGoalBdt,
  fundedAmountBdt,
  minInvestmentBdt,
  expectedReturnPct,
  returnType,
  durationDays,
  fundingDeadline,
  coverImageUrl,
  location,
  group,
  priority = false,
}: ProjectCardProps) {
  const pct = fundingPercent(fundedAmountBdt, fundingGoalBdt);
  const days = daysLeft(fundingDeadline);
  const catMeta = CATEGORY_META[category] ?? {
    label: category,
    icon: Sparkles,
  };
  const CategoryIcon = catMeta.icon;

  return (
    <Link
      href={`/projects/${slug}`}
      className="group relative flex flex-col h-full overflow-hidden rounded-3xl border border-border/70 dark:border-white/10 bg-card/95 backdrop-blur-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_20px_45px_-12px_rgba(0,140,100,0.18)] dark:hover:shadow-[0_20px_45px_-12px_rgba(0,140,100,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-transparent before:via-primary/80 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-500 before:z-20"
    >
      {/* ── Visual Media Container ── */}
      <div className="relative h-52 sm:h-56 w-full overflow-hidden bg-slate-950">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={title}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-emerald-900/60 to-slate-950">
            <TrendingUp className="h-14 w-14 text-emerald-400/40" />
          </div>
        )}

        {/* Dual Cinematic Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />

        {/* Top Badges Dock */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          {/* Category Chip */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-normal tracking-wider text-white uppercase shadow-sm">
            <CategoryIcon className="h-3 w-3 text-emerald-400" />
            <span>{catMeta.label}</span>
          </div>

          {/* Status Badge */}
          {status === "FUNDRAISING" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-400/40 px-3 py-1 text-[11px] font-normal text-emerald-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Active</span>
            </span>
          ) : status === "FUNDED" || status === "ACTIVE" ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950/80 backdrop-blur-md border border-blue-400/30 px-3 py-1 text-[11px] font-normal text-blue-300 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-400 shrink-0" />
              Running
            </span>
          ) : status === "COMPLETED" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/15 px-3 py-1 text-[11px] font-normal text-slate-300 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
              Completed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/80 backdrop-blur-md border border-red-400/30 px-3 py-1 text-[11px] font-normal text-red-300 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Inactive
            </span>
          )}
        </div>

        {/* Bottom Overlay inside Media Header */}
        <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between gap-2 z-10">
          {group ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 px-2.5 py-0.5 text-[11px] font-light text-white/90">
              <span className="truncate max-w-[140px]">{group.name}</span>
            </span>
          ) : location ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-black/50 backdrop-blur-md border border-white/15 px-2.5 py-0.5 text-[11px] font-light text-white/90">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="truncate max-w-[140px]">{location}</span>
            </span>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/85 backdrop-blur-md border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-normal text-emerald-300 shadow-sm ml-auto">
            <TrendingUp className="h-3 w-3 text-emerald-400 shrink-0" />
            <span>{Number(expectedReturnPct).toFixed(0)}% ROI</span>
          </span>
        </div>
      </div>

      {/* ── Content Section ── */}
      <div className="flex flex-1 flex-col p-6 gap-4">
        {/* Title & Description */}
        <div>
          <h3 className="text-lg font-normal sm:font-medium tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary leading-snug line-clamp-2">
            {title}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* High-End FinTech Progress Bar */}
        <div className="mt-auto pt-1">
          <div className="mb-2 flex items-center justify-between text-xs font-light">
            <span className="text-foreground font-normal">
              {formatBdt(fundedAmountBdt)}{" "}
              <span className="font-light text-muted-foreground">
                raised of {formatBdt(fundingGoalBdt)}
              </span>
            </span>
            <span className="font-normal text-primary bg-primary/10 px-2 py-0.5 rounded-full text-[11px]">
              {pct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 border border-border/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400 transition-all duration-1000 shadow-xs"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* 3-Column Financial KPI Bento */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 p-2.5 border border-border/60">
          <div className="flex flex-col items-center justify-center rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40 py-2 px-1 text-center">
            <span className="text-xs sm:text-sm font-normal sm:font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3 shrink-0" />
              {Number(expectedReturnPct).toFixed(0)}%
            </span>
            <span className="text-[10px] font-light uppercase tracking-widest text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">
              {returnType === "FIXED_RETURN" ? "Fixed Return" : "Est. Return"}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-card/60 dark:bg-slate-800/60 border border-border/40 py-2 px-1 text-center">
            <span className="text-xs sm:text-sm font-normal sm:font-medium text-foreground">
              {durationDays >= 30
                ? `${Math.round(durationDays / 30)} Mo`
                : `${durationDays}d`}
            </span>
            <span className="text-[10px] font-light uppercase tracking-widest text-muted-foreground mt-0.5">
              Term
            </span>
          </div>

          <div className="flex flex-col items-center justify-center rounded-xl bg-card/60 dark:bg-slate-800/60 border border-border/40 py-2 px-1 text-center">
            <span className="text-xs sm:text-sm font-normal sm:font-medium text-foreground truncate max-w-[85px]">
              {formatBdt(minInvestmentBdt)}
            </span>
            <span className="text-[10px] font-light uppercase tracking-widest text-muted-foreground mt-0.5">
              Min. Entry
            </span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-3 flex items-center justify-between border-t border-border/60">
          {status === "FUNDRAISING" ? (
            <div className="inline-flex items-center gap-1.5 text-xs font-light text-muted-foreground">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>{days > 0 ? `${days} days left` : "Closing soon"}</span>
            </div>
          ) : (
            <span className="text-xs font-light text-muted-foreground">
              {STATUS_LABELS[status] ?? status}
            </span>
          )}

          <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-normal sm:font-medium text-primary group-hover:underline">
            <span>Be an Investor</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:translate-x-1 shadow-xs">
              <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
