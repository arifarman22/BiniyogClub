import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "cn";
import type { ProjectCategory, ProjectStatus, ReturnType } from "@prisma/client";

type ProjectCardProps = {
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
};

const CATEGORY_LABELS: Record<string, string> = {
  REAL_ESTATE:    "Real Estate",
  TRADE_FINANCE:  "Trade Finance",
  SME:            "SME",
  TECHNOLOGY:     "Technology",
  INFRASTRUCTURE: "Infrastructure",
  OTHER:          "Other",
};

const STATUS_STYLES: Record<string, string> = {
  FUNDRAISING: "bg-harvest-100 text-harvest-600 border-harvest-400/30",
  FUNDED:      "bg-brand-100 text-brand-700 border-brand-400/30",
  ACTIVE:      "bg-brand-100 text-brand-700 border-brand-400/30",
  COMPLETED:   "bg-muted text-muted-foreground border-border",
  CANCELLED:   "bg-destructive/10 text-destructive border-destructive/20",
};

const STATUS_LABELS: Record<string, string> = {
  FUNDRAISING: "Open for Investment",
  FUNDED:      "Fully Funded",
  ACTIVE:      "In Progress",
  COMPLETED:   "Completed",
  CANCELLED:   "Cancelled",
};

function formatBdt(amount: number | string) {
  const n = Number(amount);
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

function fundingPercent(funded: number | string, goal: number | string) {
  return Math.min(Math.round((Number(funded) / Number(goal)) * 100), 100);
}

function daysLeft(deadline: Date | string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
}

export function ProjectCard({
  slug, title, description, category, status,
  fundingGoalBdt, fundedAmountBdt, minInvestmentBdt,
  expectedReturnPct, returnType, durationDays,
  fundingDeadline, coverImageUrl, location,
}: ProjectCardProps) {
  const pct = fundingPercent(fundedAmountBdt, fundingGoalBdt);
  const days = daysLeft(fundingDeadline);

  return (
    <Link href={`/projects/${slug}`} className="group block">
      <Card className="h-full overflow-hidden rounded-none border border-primary/20 transition-shadow hover:shadow-md">
        <div className="relative h-44 w-full overflow-hidden bg-brand-100">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
              <span className="text-4xl">📈</span>
            </div>
          )}
          <span className={cn(
            "absolute right-2 top-2 rounded-full border px-2 py-0.5 text-xs font-medium",
            STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
          )}>
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        <CardContent className="p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[category] ?? category}
            </Badge>
            {location && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {location}
              </span>
            )}
          </div>

          <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
            {title}
          </h3>
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{description}</p>

          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{pct}% funded</span>
              <span>{formatBdt(fundingGoalBdt)} goal</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
            <div className="text-center">
              <p className="text-xs font-semibold text-primary">{Number(expectedReturnPct).toFixed(0)}%</p>
              <p className="text-[10px] text-muted-foreground">{returnType === "FIXED_RETURN" ? "Fixed" : "Est."} Return</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold">{durationDays}d</p>
              <p className="text-[10px] text-muted-foreground">Duration</p>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold">{formatBdt(minInvestmentBdt)}</p>
              <p className="text-[10px] text-muted-foreground">Min. Invest</p>
            </div>
          </div>

          {status === "FUNDRAISING" && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {days > 0 ? `${days} days left` : "Closing soon"}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
