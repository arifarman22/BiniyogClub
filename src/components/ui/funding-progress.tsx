import { cn } from "@/lib/utils";

interface FundingProgressProps {
  funded: number;
  goal: number;
  showLabels?: boolean;
  showPercentage?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function FundingProgress({
  funded,
  goal,
  showLabels = true,
  showPercentage = true,
  className,
  size = "md",
}: FundingProgressProps) {
  const pct = goal > 0 ? Math.min((funded / goal) * 100, 100) : 0;
  const isComplete = pct >= 100;

  return (
    <div className={cn("space-y-1.5", className)}>
      {showLabels && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Funded</span>
          {showPercentage && (
            <span className={cn("font-semibold", isComplete ? "text-success" : "text-foreground")}>
              {pct.toFixed(1)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          "w-full overflow-hidden rounded-full bg-muted",
          size === "sm" ? "h-1.5" : "h-2",
        )}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            isComplete ? "bg-success" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
