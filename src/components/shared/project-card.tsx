import Link from "next/link";
import { MapPin, Clock, TrendingUp, Users } from "lucide-react";
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
  farm: {
    district: string;
    division: string;
    farmerProfile?: { user: { name: string } } | null;
  };
};

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  CROP_FARMING: "Crop Farming",
  LIVESTOCK: "Livestock",
  AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry",
  DAIRY: "Dairy",
  HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing",
  OTHER: "Other",
};

const STATUS_STYLES: Record<string, string> = {
  FUNDRAISING: "bg-harvest-100 text-harvest-600 border-harvest-400/30",
  FUNDED: "bg-brand-100 text-brand-700 border-brand-400/30",
  ACTIVE: "bg-brand-100 text-brand-700 border-brand-400/30",
  HARVESTING: "bg-finance-100 text-finance-600 border-finance-500/30",
  SOLD: "bg-finance-100 text-finance-600 border-finance-500/30",
  PROFIT_CALCULATION: "bg-finance-100 text-finance-600 border-finance-500/30",
  DISTRIBUTION: "bg-finance-100 text-finance-600 border-finance-500/30",
  COMPLETED: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  FUNDRAISING: "Open for Investment",
  FUNDED: "Fully Funded",
  ACTIVE: "In Progress",
  HARVESTING: "Harvesting",
  SOLD: "Sold",
  PROFIT_CALCULATION: "Calculating Profits",
  DISTRIBUTION: "Distributing Returns",
  COMPLETED: "Completed",
};

function formatBdt(amount: number | string) {
  const n = Number(amount);
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

function fundingPercent(funded: number | string, goal: number | string) {
  const pct = (Number(funded) / Number(goal)) * 100;
  return Math.min(Math.round(pct), 100);
}

function daysLeft(deadline: Date | string) {
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
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
  farm,
}: ProjectCardProps) {
  const pct = fundingPercent(fundedAmountBdt, fundingGoalBdt);
  const days = daysLeft(fundingDeadline);

  return (
    <Link href={`/projects/${slug}`} className="group block">
      <Card className="h-full overflow-hidden transition-shadow hover:shadow-md">
        {/* Cover */}
        <div className="relative h-44 w-full overflow-hidden bg-brand-100">
          {coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverImageUrl}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center gradient-brand-subtle">
              <span className="text-4xl">🌾</span>
            </div>
          )}
          <span
            className={cn(
              "absolute right-2 top-2 rounded-full border px-2 py-0.5 text-xs font-medium",
              STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
            )}
          >
            {STATUS_LABELS[status] ?? status}
          </span>
        </div>

        <CardContent className="p-4">
          {/* Category + location */}
          <div className="mb-2 flex items-center justify-between gap-2">
            <Badge variant="secondary" className="text-xs">
              {CATEGORY_LABELS[category]}
            </Badge>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {farm.district}
            </span>
          </div>

          <h3 className="mb-1 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-primary">
            {title}
          </h3>
          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{description}</p>

          {/* Funding bar */}
          <div className="mb-3">
            <div className="mb-1 flex justify-between text-xs text-muted-foreground">
              <span>{pct}% funded</span>
              <span>{formatBdt(fundingGoalBdt)} goal</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
            <div className="text-center">
              <p className="text-xs font-semibold text-primary">
                {Number(expectedReturnPct).toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted-foreground">
                {returnType === "FIXED_RETURN" ? "Fixed" : "Est."} Return
              </p>
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
