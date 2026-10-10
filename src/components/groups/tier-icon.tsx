import type { LucideIcon } from "lucide-react";
import { Briefcase, Building, Landmark, Map as MapIcon, TrendingUp, UserCog } from "lucide-react";
import { cn } from "@/lib/utils";

const TIER_ICONS: Record<string, LucideIcon> = {
  INVESTOR: TrendingUp,
  SHAREHOLDER: Landmark,
  DIRECTORSHIP: UserCog,
  PLOT_BOOKING: Building,
  LAND_SHARE: MapIcon,
};

/** Icon tile for a business-group tier type (INVESTOR, SHAREHOLDER, …). */
export function TierIcon({ type, size = "md", className }: { type: string; size?: "sm" | "md"; className?: string }) {
  const Icon = TIER_ICONS[type] ?? Briefcase;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary",
        size === "sm" ? "h-5 w-5 [&_svg]:h-3 [&_svg]:w-3" : "h-10 w-10 rounded-xl [&_svg]:h-5 [&_svg]:w-5",
        className,
      )}
      aria-hidden="true"
    >
      <Icon />
    </span>
  );
}
