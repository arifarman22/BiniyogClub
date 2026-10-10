import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  trend?: { value: number; label?: string };
  className?: string;
  variant?: "default" | "brand" | "finance" | "harvest";
}

// Soft corner wash + accent chip per variant; the card surface itself stays neutral.
const washStyles = {
  default: "from-slate-500/[0.06]",
  brand:   "from-emerald-500/[0.10]",
  finance: "from-sky-500/[0.10]",
  harvest: "from-amber-500/[0.12]",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground ring-border",
  brand:   "bg-gradient-to-br from-emerald-500 to-teal-600 text-white ring-emerald-500/20 shadow-emerald-500/25",
  finance: "bg-gradient-to-br from-sky-500 to-indigo-600 text-white ring-sky-500/20 shadow-sky-500/25",
  harvest: "bg-gradient-to-br from-amber-400 to-orange-500 text-white ring-amber-500/20 shadow-amber-500/25",
};

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className,
  variant = "default",
}: StatCardProps) {
  const isPositive = trend && trend.value > 0;
  const isNegative = trend && trend.value < 0;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/70 bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-12px_rgba(16,24,40,0.18)]",
        className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br to-transparent blur-2xl transition-transform duration-500 group-hover:scale-125",
          washStyles[variant],
        )}
        aria-hidden="true"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-foreground sm:text-[1.65rem]">{value}</p>
          {(description || trend) && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {trend && (
                <span
                  className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold", {
                    "bg-success/10 text-success": isPositive,
                    "bg-destructive/10 text-destructive": isNegative,
                    "bg-muted text-muted-foreground": !isPositive && !isNegative,
                  })}
                >
                  {isPositive ? (
                    <TrendingUp className="size-3" />
                  ) : isNegative ? (
                    <TrendingDown className="size-3" />
                  ) : (
                    <Minus className="size-3" />
                  )}
                  {Math.abs(trend.value)}%
                </span>
              )}
              {description && <span className="text-xs text-muted-foreground">{description}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-lg ring-1 [&_svg]:size-5",
              iconVariantStyles[variant],
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
