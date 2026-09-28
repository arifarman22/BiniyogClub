import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFarmerDashboard } from "@/server/data/farmer.data";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/utils";
import {
  Tractor, Sprout, FolderOpen, Wheat, Calendar, Bell,
  ArrowRight, Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard — Farmer Portal" };

const PROJECT_STATUS_VARIANT: Record<string, "pending" | "review" | "approved" | "active" | "funding" | "completed" | "rejected" | "cancelled" | "default"> = {
  DRAFT: "default",
  PENDING_APPROVAL: "pending",
  APPROVED: "review",
  FUNDRAISING: "funding",
  FUNDED: "confirmed",
  ACTIVE: "active",
  HARVESTING: "processing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as Record<string, never>;

const PROJECT_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending", APPROVED: "Approved",
  FUNDRAISING: "Fundraising", FUNDED: "Funded", ACTIVE: "Active",
  HARVESTING: "Harvesting", SOLD: "Sold", PROFIT_CALCULATION: "Calculating",
  DISTRIBUTION: "Distributing", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const CROP_STATUS_COLOR: Record<string, string> = {
  PLANTED: "bg-info-muted text-info-foreground",
  GROWING: "bg-success-muted text-success",
  HARVESTING: "bg-warning-muted text-warning-foreground",
};

export default async function FarmerDashboardPage() {
  const session = await requireSession();
  const data = await getFarmerDashboard(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${session.name.split(" ")[0]}`}
        description="Your farm operations at a glance"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          title="Active Projects"
          value={data.stats.activeProjects}
          icon={<FolderOpen className="h-5 w-5" />}
          variant="brand"
        />
        <StatCard
          title="Active Farms"
          value={data.stats.activeFarms}
          icon={<Tractor className="h-5 w-5" />}
          variant="harvest"
        />
        <StatCard
          title="Current Crops"
          value={data.stats.activeCrops}
          icon={<Sprout className="h-5 w-5" />}
          variant="harvest"
        />
        <StatCard
          title="Total Projects"
          value={data.stats.totalProjects}
          icon={<Wheat className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Projects */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Active Projects</h2>
            <Link href="/farmer/projects" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {data.activeProjects.length === 0 ? (
            <EmptyState
              icon={<FolderOpen className="h-5 w-5" />}
              title="No active projects"
              description="Create a project to start fundraising"
              size="sm"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.activeProjects.slice(0, 5).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/farmer/projects/${p.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.farm.name} · {p.farm.district}</p>
                    </div>
                    <StatusBadge status={PROJECT_STATUS_VARIANT[p.status] ?? "default"}>
                      {PROJECT_STATUS_LABEL[p.status] ?? p.status}
                    </StatusBadge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Current Crops */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Current Crops</h2>
            <Link href="/farmer/activities" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {data.activeCropCycles.length === 0 ? (
            <EmptyState
              icon={<Sprout className="h-5 w-5" />}
              title="No active crops"
              description="Log a crop cycle to track your growing season"
              size="sm"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.activeCropCycles.slice(0, 5).map((cc) => (
                <li key={cc.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">
                      {cc.crop.name}
                      {cc.crop.localName && (
                        <span className="ml-1 text-xs text-muted-foreground">({cc.crop.localName})</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {cc.field.name} · {Number(cc.areaAcres).toFixed(2)} acres
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CROP_STATUS_COLOR[cc.status] ?? "bg-muted text-muted-foreground")}>
                      {cc.status}
                    </span>
                    {cc.expectedHarvestAt && (
                      <span className="text-[10px] text-muted-foreground">
                        Harvest {formatDate(cc.expectedHarvestAt)}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Upcoming Field Visits */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Upcoming Field Visits</h2>
            <Link href="/farmer/field-visits" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          {data.upcomingVisits.length === 0 ? (
            <EmptyState
              icon={<Calendar className="h-5 w-5" />}
              title="No upcoming visits"
              size="sm"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.upcomingVisits.map((v) => (
                <li key={v.id} className="flex items-center gap-3 px-5 py-3">
                  <div className="flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="text-xs font-bold leading-none">
                      {new Date(v.scheduledAt).getDate()}
                    </span>
                    <span className="text-[9px] leading-none">
                      {new Date(v.scheduledAt).toLocaleString("en-BD", { month: "short" })}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{v.project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Officer: {v.fieldOfficerProfile.user.name}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Updates */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Recent Updates</h2>
          </div>
          {data.recentUpdates.length === 0 ? (
            <EmptyState
              icon={<Bell className="h-5 w-5" />}
              title="No recent updates"
              size="sm"
            />
          ) : (
            <ul className="divide-y divide-border">
              {data.recentUpdates.map((u) => (
                <li key={u.id} className="px-5 py-3">
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {u.project.title}
                    {u.publishedAt && ` · ${formatDate(u.publishedAt)}`}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Harvest Status */}
      {data.recentHarvests.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-semibold">Harvest Status</h2>
            <Link href="/farmer/harvest" className="text-xs text-primary hover:underline">
              View all →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Crop</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">Project</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">Yield (kg)</th>
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.recentHarvests.map((h) => (
                  <tr key={h.id} className="hover:bg-muted/20">
                    <td className="px-5 py-3 font-medium">{h.cropCycle.crop.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{h.project.title}</td>
                    <td className="px-5 py-3 text-right font-mono">{Number(h.yieldKg).toLocaleString()}</td>
                    <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                      {formatDate(h.harvestedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
