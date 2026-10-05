import Link from "next/link";
import Image from "next/image";
import {
  Building2,
  ChevronRight,
  TrendingUp,
  Users,
  ShieldCheck,
  Landmark,
  Layers,
  ArrowRight,
  Briefcase,
  Sparkles,
  Clock,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BusinessGroupCardProps = {
  group: {
    id: string;
    slug: string;
    name: string;
    tagline?: string | null;
    description: string;
    logoUrl?: string | null;
    coverUrl?: string | null;
    entities: {
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      tiers: {
        id: string;
        type: string;
        name: string;
        minAmountBdt: number | string | any;
        maxAmountBdt?: number | string | any | null;
        expectedReturnPct?: number | string | any | null;
        durationMonths?: number | null;
        _count?: { investments: number };
      }[];
    }[];
  };
  priority?: boolean;
};

const GROUP_COVER: Record<string, string> = {
  MARINERS: "/2.png",
  MOHS: "/3.png",
  MARINOZZ: "/4.png",
};

const GROUP_META: Record<
  string,
  {
    sector: string;
    ticker: string;
    icon: typeof Building2;
  }
> = {
  MARINERS: {
    sector: "Maritime Logistics & Cold Chain",
    ticker: "MARINERS-GRP",
    icon: TrendingUp,
  },
  MOHS: {
    sector: "Real Estate & Commercial Holdings",
    ticker: "MOHS-CORP",
    icon: Building2,
  },
  MARINOZZ: {
    sector: "Hospitality & Public Enterprise",
    ticker: "MARINOZZ-PLC",
    icon: Landmark,
  },
};

const TIER_CONFIG: Record<
  string,
  { label: string; icon: typeof TrendingUp; style: string }
> = {
  INVESTOR: {
    label: "Investor",
    icon: TrendingUp,
    style:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  SHAREHOLDER: {
    label: "Shareholder",
    icon: Landmark,
    style:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  },
  DIRECTORSHIP: {
    label: "Directorship",
    icon: Briefcase,
    style:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  PLOT_BOOKING: {
    label: "Plot Booking",
    icon: Building2,
    style:
      "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
  },
  LAND_SHARE: {
    label: "Land Share",
    icon: Layers,
    style:
      "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
  },
};

function formatAmount(amount: number | string | null | undefined) {
  const n = Number(amount ?? 0);
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

export function BusinessGroupCard({ group, priority = false }: BusinessGroupCardProps) {
  const allTiers = group.entities.flatMap((e) => e.tiers);
  const uniqueTypes = [...new Set(allTiers.map((t) => t.type))];
  const totalInvestors = allTiers.reduce(
    (sum, t) => sum + (t._count?.investments ?? 0),
    0,
  );

  const minEntry = allTiers.reduce((min, t) => {
    if (!min) return t;
    return Number(t.minAmountBdt) < Number(min.minAmountBdt) ? t : min;
  }, allTiers[0]);

  const maxReturn = allTiers.reduce((max, t) => {
    if (!max) return t;
    return Number(t.expectedReturnPct ?? 0) > Number(max.expectedReturnPct ?? 0)
      ? t
      : max;
  }, allTiers[0]);

  const durations = allTiers
    .map((t) => t.durationMonths)
    .filter((d): d is number => d != null && d > 0);
  const minDuration = durations.length > 0 ? Math.min(...durations) : null;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : null;
  let durationLabel = "Flexible";
  if (minDuration && maxDuration) {
    durationLabel = minDuration === maxDuration ? `${minDuration} Mo.` : `${minDuration}–${maxDuration} Mo.`;
  } else if (minDuration) {
    durationLabel = `${minDuration} Mo.`;
  }

  const coverImg = group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png";
  const meta = GROUP_META[group.slug] ?? {
    sector: "Institutional Conglomerate",
    ticker: `${group.slug}-GRP`,
    icon: Building2,
  };
  const GroupIcon = meta.icon;

  return (
    <Link
      href={`/groups/${group.slug.toLowerCase()}`}
      className="group relative flex flex-col h-full rounded-none border border-border/80 dark:border-white/10 bg-card shadow-[0_2px_12px_-2px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)] transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.18)] dark:hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-emerald-500 before:via-teal-400 before:to-emerald-500 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-300 before:z-30 overflow-hidden"
    >
      {/* ── Cinematic Visual Header ── */}
      <div className="relative h-64 w-full overflow-hidden bg-slate-950">
        <Image
          src={coverImg}
          alt={group.name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Cinematic Vignette Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-black/30 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

        {/* Top Badges Bar */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          <div className="inline-flex items-center gap-2 rounded-none bg-slate-950/80 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[11px] font-mono tracking-wider text-white shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-500" />
            </span>
            <span>{meta.ticker}</span>
          </div>

          {totalInvestors > 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-none bg-emerald-950/80 backdrop-blur-md border border-emerald-400/40 px-3 py-1.5 text-[11px] font-medium text-emerald-300 shadow-sm">
              <Users className="h-3 w-3 text-emerald-400" />
              <span>{totalInvestors} Investors</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-none bg-slate-950/80 backdrop-blur-md border border-white/20 px-3 py-1.5 text-[11px] font-medium text-white/90 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Vetted Conglomerate</span>
            </div>
          )}
        </div>

        {/* Bottom Identity Overlay */}
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-none bg-slate-900/90 backdrop-blur-md border border-white/20 text-white shadow-md transition-colors duration-300 group-hover:border-emerald-400/60 group-hover:bg-emerald-950/70">
              <GroupIcon className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-medium uppercase tracking-widest text-emerald-400 block truncate">
                {meta.sector}
              </span>
              <h3 className="text-xl sm:text-2xl font-normal text-white leading-tight tracking-tight drop-shadow-sm transition-colors duration-300 group-hover:text-emerald-300 truncate">
                {group.name}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* ── Card Content Body ── */}
      <div className="flex flex-1 flex-col p-6 gap-5">
        {/* Description */}
        <p className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
          {group.description}
        </p>

        {/* Entities / Subsidiaries Chips */}
        {group.entities.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 text-primary" />
                <span>Operating Subsidiaries</span>
              </span>
              <span className="text-foreground font-semibold">
                {group.entities.length} Units
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {group.entities.map((entity) => (
                <span
                  key={entity.id}
                  className="inline-flex items-center rounded-none bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 text-[11px] font-normal text-slate-700 dark:text-slate-300 border border-border/70"
                >
                  {entity.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modern Financial KPI Bento Grid */}
        <div className="grid grid-cols-3 divide-x divide-border/70 rounded-none border border-border/70 bg-slate-50/70 dark:bg-slate-900/50 py-3">
          {/* Target Return */}
          <div className="flex flex-col items-center text-center px-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
              Est. Return
            </span>
            <span className="text-base sm:text-lg font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
              {maxReturn?.expectedReturnPct
                ? `${Number(maxReturn.expectedReturnPct)}%`
                : "—"}
            </span>
          </div>

          {/* Min Entry */}
          <div className="flex flex-col items-center text-center px-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
              Min. Entry
            </span>
            <span className="text-base sm:text-lg font-semibold text-foreground mt-0.5">
              {minEntry ? formatAmount(Number(minEntry.minAmountBdt)) : "—"}
            </span>
          </div>

          {/* Horizon / Tenure */}
          <div className="flex flex-col items-center text-center px-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
              Tenure
            </span>
            <span className="text-base sm:text-lg font-semibold text-foreground mt-0.5 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
              {durationLabel}
            </span>
          </div>
        </div>

        {/* Structured Participation Tiers */}
        {uniqueTypes.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
              Available Allocation Tiers ({allTiers.length} options)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {uniqueTypes.map((type) => {
                const cfg = TIER_CONFIG[type] ?? {
                  label: type.replace(/_/g, " "),
                  icon: TrendingUp,
                  style: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
                };
                const IconComponent = cfg.icon;
                return (
                  <span
                    key={type}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-none border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      cfg.style,
                    )}
                  >
                    <IconComponent className="h-3 w-3 shrink-0" />
                    <span>{cfg.label}</span>
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Modern Interactive Action Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/70">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              Explore Group Portfolio
            </span>
            <span className="text-[11px] font-normal text-muted-foreground">
              Direct institutional contracts
            </span>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-none border border-border/80 bg-slate-100 dark:bg-slate-800 text-foreground transition-all duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-white group-hover:translate-x-1 shadow-xs">
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
