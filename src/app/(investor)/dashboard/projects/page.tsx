export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getInvestorProjects } from "@/server/data/investor.data";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, Bell } from "lucide-react";
import { cn } from "cn";

export const metadata: Metadata = { title: "My Projects — Dashboard" };

const PROJECT_STATUS_COLORS: Record<string, string> = {
  FUNDRAISING: "bg-harvest-100 text-harvest-600",
  FUNDED: "bg-brand-100 text-brand-700",
  ACTIVE: "bg-brand-100 text-brand-700",
  HARVESTING: "bg-finance-100 text-finance-600",
  SOLD: "bg-finance-100 text-finance-600",
  PROFIT_CALCULATION: "bg-finance-100 text-finance-600",
  DISTRIBUTION: "bg-finance-100 text-finance-600",
  COMPLETED: "bg-success-muted text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const PROJECT_STATUS_LABELS: Record<string, string> = {
  FUNDRAISING: "Fundraising", FUNDED: "Funded", ACTIVE: "Active",
  HARVESTING: "Harvesting", SOLD: "Sold", PROFIT_CALCULATION: "Profit Calc",
  DISTRIBUTION: "Distribution", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const INV_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONFIRMED: "bg-info-muted text-info-foreground",
  ACTIVE: "bg-brand-100 text-brand-700",
  MATURED: "bg-success-muted text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
};

const UPDATE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General", MILESTONE: "Milestone", ISSUE: "Issue",
  HARVEST_REPORT: "Harvest", FINANCIAL_REPORT: "Financial", FIELD_VISIT_REPORT: "Field Visit",
};

const CATEGORY_LABELS: Record<string, string> = {
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing", OTHER: "Other",
};

function formatBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

function fundingPct(funded: unknown, goal: unknown) {
  const g = Number(goal);
  if (g === 0) return 0;
  return Math.min(100, Math.round((Number(funded) / g) * 100));
}

export default async function MyProjectsPage() {
  const session = await requireSession();

  let investments: Awaited<ReturnType<typeof getInvestorProjects>>;
  try {
    investments = await getInvestorProjects(session);
  } catch {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold">My Projects</h1>
          <p className="text-sm text-muted-foreground">Projects you&apos;ve invested in</p>
        </div>
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-2xl mb-2">🌾</p>
          <p className="font-medium">Profile setup required</p>
          <p className="mt-1 text-sm text-muted-foreground max-w-xs mx-auto">
            Complete your investor profile to view your projects.
          </p>
          <a href="/dashboard/profile" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            Complete Profile
          </a>
        </div>
      </div>
    );
  }

  // Deduplicate by project (investor may have multiple investments in same project)
  const seen = new Set<string>();
  const unique = investments.filter((inv) => {
    if (seen.has(inv.project.id)) return false;
    seen.add(inv.project.id);
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">My Projects</h1>
        <p className="text-sm text-muted-foreground">
          {unique.length} project{unique.length !== 1 ? "s" : ""} you&apos;ve invested in
        </p>
      </div>

      {unique.length > 0 ? (
        <div className="space-y-5">
          {unique.map((inv) => {
            const p = inv.project;
            const pct = fundingPct(p.fundedAmountBdt.toString(), p.fundingGoalBdt.toString());
            return (
              <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
                {/* Project header */}
                <div className="p-5 border-b border-border">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap gap-1.5">
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", PROJECT_STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground")}>
                          {PROJECT_STATUS_LABELS[p.status] ?? p.status}
                        </span>
                        <Badge variant="secondary" className="text-[10px]">
                          {CATEGORY_LABELS[p.category] ?? p.category}
                        </Badge>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", INV_STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
                          My investment: {inv.status}
                        </span>
                      </div>
                      <Link href={`/projects/${p.slug}`} className="hover:text-primary">
                        <h2 className="font-semibold">{p.title}</h2>
                      </Link>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {p.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {p.location}
                          </span>
                        )}
                        {p.endDate && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Matures {new Date(p.endDate).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">My investment</p>
                      <p className="text-lg font-bold text-primary">{formatBdt(inv.amountBdt.toString())}</p>
                    </div>
                  </div>

                  {/* Funding progress */}
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                      <span>{pct}% funded</span>
                      <span>{formatBdt(p.fundingGoalBdt.toString())} goal</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Return", value: p.returnPctMin && p.returnPctMax ? `${Number(p.returnPctMin).toFixed(0)}–${Number(p.returnPctMax).toFixed(0)}%` : `${Number(p.expectedReturnPct.toString()).toFixed(1)}%` },
                      { label: "Duration", value: `${p.durationDays}d` },
                      { label: "Investors", value: p._count.investments.toString() },
                      ...(p.startDate ? [{ label: "Started", value: new Date(p.startDate).toLocaleDateString("en-BD", { day: "numeric", month: "short" }) }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} className="rounded-lg bg-muted/40 p-2 text-center">
                        <p className="text-xs font-semibold">{value}</p>
                        <p className="text-[10px] text-muted-foreground">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Project updates — only from this project */}
                {p.updates.length > 0 && (
                  <div className="p-5">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Latest Updates
                    </p>
                    <div className="space-y-2">
                      {p.updates.map((u) => (
                        <div key={u.id} className="flex items-start gap-2.5">
                          <Bell className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs font-medium line-clamp-1">{u.title}</span>
                              <Badge variant="secondary" className="text-[10px] shrink-0">
                                {UPDATE_TYPE_LABELS[u.type] ?? u.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{u.content}</p>
                          </div>
                          {u.publishedAt && (
                            <span className="shrink-0 text-[10px] text-muted-foreground">
                              {new Date(u.publishedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-2xl mb-2">🌾</p>
          <p className="font-medium">No projects yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Invest in a project to see it here.</p>
          <Link href="/projects" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            Browse Projects
          </Link>
        </div>
      )}
    </div>
  );
}
