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

const variantStyles = {
  default: "bg-card border-border",
  brand:   "bg-brand-50 border-brand-200 dark:bg-brand-900/20 dark:border-brand-800",
  finance: "bg-finance-50 border-finance-100 dark:bg-finance-700/10 dark:border-finance-700/30",
  harvest: "bg-harvest-50 border-harvest-100 dark:bg-harvest-600/10 dark:border-harvest-600/30",
};

const iconVariantStyles = {
  default: "bg-muted text-muted-foreground",
  brand:   "bg-brand-100 text-brand-700 dark:bg-brand-800/40 dark:text-brand-300",
  finance: "bg-finance-100 text-finance-700 dark:bg-finance-700/20 dark:text-finance-100",
  harvest: "bg-harvest-100 text-harvest-600 dark:bg-harvest-600/20 dark:text-harvest-400",
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
        "rounded-xl border p-5 shadow-xs transition-shadow hover:shadow-sm",
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          {(description || trend) && (
            <div className="mt-1.5 flex items-center gap-2">
              {trend && (
                <span
                  className={cn("inline-flex items-center gap-0.5 text-xs font-medium", {
                    "text-success": isPositive,
                    "text-destructive": isNegative,
                    "text-muted-foreground": !isPositive && !isNegative,
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
              {description && (
                <span className="text-xs text-muted-foreground">{description}</span>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              "flex size-10 shrink-0 items-center justify-center rounded-lg",
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
