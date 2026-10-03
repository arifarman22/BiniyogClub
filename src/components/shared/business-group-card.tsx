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
    badge: string;
    icon: typeof Building2;
    gradient: string;
  }
> = {
  MARINERS: {
    sector: "Maritime Logistics & Cold Chain",
    badge: "CONGLOMERATE",
    icon: TrendingUp,
    gradient: "from-blue-600 to-cyan-500",
  },
  MOHS: {
    sector: "Real Estate & Commercial Ventures",
    badge: "HOLDING GROUP",
    icon: Building2,
    gradient: "from-emerald-600 to-teal-500",
  },
  MARINOZZ: {
    sector: "Hospitality & Public Holdings",
    badge: "PUBLIC PLC",
    icon: Landmark,
    gradient: "from-purple-600 to-indigo-500",
  },
};

const TIER_CONFIG: Record<
  string,
  { label: string; icon: string; style: string }
> = {
  INVESTOR: {
    label: "Investor",
    icon: "📈",
    style:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  },
  SHAREHOLDER: {
    label: "Shareholder",
    icon: "🏦",
    style:
      "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/25",
  },
  DIRECTORSHIP: {
    label: "Directorship",
    icon: "👔",
    style:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
  },
  PLOT_BOOKING: {
    label: "Plot Booking",
    icon: "🏗️",
    style:
      "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/25",
  },
  LAND_SHARE: {
    label: "Land Share",
    icon: "🌍",
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

  const coverImg = group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png";
  const meta = GROUP_META[group.slug] ?? {
    sector: "Institutional Enterprise",
    badge: "VERIFIED GROUP",
    icon: Building2,
    gradient: "from-emerald-600 to-teal-500",
  };
  const GroupIcon = meta.icon;

  return (
    <Link
      href={`/groups/${group.slug.toLowerCase()}`}
      className="group relative flex flex-col h-full overflow-hidden rounded-3xl border border-border/70 dark:border-white/10 bg-card/95 backdrop-blur-sm shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.5)] transition-all duration-500 hover:-translate-y-2 hover:border-primary/50 hover:shadow-[0_20px_45px_-12px_rgba(0,140,100,0.18)] dark:hover:shadow-[0_20px_45px_-12px_rgba(0,140,100,0.25)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-transparent before:via-primary/80 before:to-transparent before:opacity-0 group-hover:before:opacity-100 before:transition-opacity before:duration-500 before:z-20"
    >
      {/* ── Visual Media Header ── */}
      <div className="relative h-60 w-full overflow-hidden bg-slate-950">
        <Image
          src={coverImg}
          alt={group.name}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-108"
        />

        {/* Cinematic Vignettes */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent pointer-events-none" />

        {/* Top Floating Badges */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-normal tracking-wider text-white uppercase shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span>{group.slug}</span>
          </div>

          {totalInvestors > 0 ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-400/35 px-3 py-1 text-[11px] font-light text-emerald-300 shadow-sm">
              <Users className="h-3 w-3 text-emerald-400" />
              <span>{totalInvestors} Investors</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/20 px-3 py-1 text-[11px] font-light text-white/90 shadow-sm">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Vetted Group</span>
            </div>
          )}
        </div>

        {/* Header Identity Block (Bottom of cover) */}
        <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3.5 z-10">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner transition-colors duration-300 group-hover:border-emerald-400/50 group-hover:bg-emerald-950/60">
            <GroupIcon className="h-6 w-6 text-emerald-300" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-light uppercase tracking-widest text-emerald-300/90 block">
              {meta.sector}
            </span>
            <h3 className="text-2xl font-light sm:font-normal text-white leading-tight tracking-tight drop-shadow-sm transition-colors duration-300 group-hover:text-emerald-300 truncate">
              {group.name}
            </h3>
          </div>
        </div>
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-1 flex-col p-6 gap-5">
        {/* Description */}
        <p className="text-xs sm:text-sm font-light text-muted-foreground line-clamp-2 leading-relaxed">
          {group.description}
        </p>

        {/* Operating Entities Tag */}
        {group.entities.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800/40 px-3 py-2 border border-border/50 text-xs font-light text-muted-foreground">
            <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-normal text-foreground shrink-0">
              {group.entities.length} {group.entities.length === 1 ? "Entity" : "Entities"}:
            </span>
            <span className="truncate">
              {group.entities.map((e) => e.name).join(" • ")}
            </span>
          </div>
        )}

        {/* Financial KPI Bento */}
        <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 p-3 border border-border/60">
          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] uppercase font-light tracking-widest text-muted-foreground">
              Min. Entry
            </span>
            <span className="text-sm font-normal sm:font-medium text-foreground mt-1">
              {minEntry ? formatAmount(Number(minEntry.minAmountBdt)) : "—"}
            </span>
          </div>

          <div className="flex flex-col items-center text-center border-x border-border/60 px-1">
            <span className="text-[10px] uppercase font-light tracking-widest text-muted-foreground">
              Est. Return
            </span>
            <span className="text-sm font-normal sm:font-medium text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-0.5">
              <TrendingUp className="h-3 w-3 shrink-0" />
              {maxReturn?.expectedReturnPct
                ? `${Number(maxReturn.expectedReturnPct)}%`
                : "—"}
            </span>
          </div>

          <div className="flex flex-col items-center text-center">
            <span className="text-[10px] uppercase font-light tracking-widest text-muted-foreground">
              Tiers
            </span>
            <span className="text-sm font-normal sm:font-medium text-foreground mt-1 flex items-center gap-1">
              <Layers className="h-3 w-3 text-primary shrink-0" />
              {allTiers.length} Options
            </span>
          </div>
        </div>

        {/* Structured Participation Tiers Chips */}
        <div>
          <span className="text-[11px] font-light text-muted-foreground uppercase tracking-widest block mb-2">
            Available Participation Tiers
          </span>
          <div className="flex flex-wrap gap-1.5">
            {uniqueTypes.map((type) => {
              const cfg = TIER_CONFIG[type] ?? {
                label: type.replace(/_/g, " "),
                icon: "💼",
                style: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300",
              };
              return (
                <span
                  key={type}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-light sm:font-normal transition-transform duration-200 group-hover:scale-[1.02]",
                    cfg.style,
                  )}
                >
                  <span className="text-[11px]">{cfg.icon}</span>
                  <span>{cfg.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Action Footer */}
        <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/60">
          <span className="text-xs sm:text-sm font-normal sm:font-medium text-primary group-hover:underline">
            Explore Portfolio & Tiers
          </span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition-all duration-300 group-hover:bg-primary group-hover:text-white group-hover:translate-x-1 shadow-xs">
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
