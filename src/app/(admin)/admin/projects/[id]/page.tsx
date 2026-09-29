import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Pencil, MapPin, Calendar, Users, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import { getAdminProjectById } from "@/server/data/admin.data";
import { ProjectStatusTransition } from "@/components/admin/project-status-transition";
import type { ProjectStatus } from "@prisma/client";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const project = await getAdminProjectById(id);
  return { title: project ? `${project.title} — Admin` : "Project Not Found" };
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", APPROVED: "Approved",
  FUNDRAISING: "Fundraising", FUNDED: "Funded", ACTIVE: "Active",
  HARVESTING: "Harvesting", SOLD: "Sold", PROFIT_CALCULATION: "Profit Calculation",
  DISTRIBUTION: "Distribution", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground border-border",
  PENDING_APPROVAL: "bg-warning-muted text-warning-foreground border-warning/30",
  APPROVED: "bg-info-muted text-info-foreground border-info/30",
  FUNDRAISING: "bg-harvest-100 text-harvest-600 border-harvest-400/30",
  FUNDED: "bg-brand-100 text-brand-700 border-brand-400/30",
  ACTIVE: "bg-brand-100 text-brand-700 border-brand-400/30",
  HARVESTING: "bg-finance-100 text-finance-600 border-finance-500/30",
  SOLD: "bg-finance-100 text-finance-600 border-finance-500/30",
  PROFIT_CALCULATION: "bg-finance-100 text-finance-600 border-finance-500/30",
  DISTRIBUTION: "bg-finance-100 text-finance-600 border-finance-500/30",
  COMPLETED: "bg-success-muted text-success border-success/30",
  CANCELLED: "bg-destructive/10 text-destructive border-destructive/30",
};

const CATEGORY_LABELS: Record<string, string> = {
  CROP_FARMING: "Crop Farming", LIVESTOCK: "Livestock", AQUACULTURE: "Aquaculture",
  POULTRY: "Poultry", DAIRY: "Dairy", HORTICULTURE: "Horticulture",
  AGRO_PROCESSING: "Agro Processing", OTHER: "Other",
};

function formatBdt(n: number | string) {
  const v = Number(n);
  if (v >= 100000) return `৳${(v / 100000).toFixed(2)}L`;
  return `৳${v.toLocaleString()}`;
}

function fundingPct(funded: number | string, goal: number | string) {
  return Math.min(100, Math.round((Number(funded) / Number(goal)) * 100));
}

export default async function AdminProjectDetailPage({ params }: Props) {
  const { id } = await params;
  const project = await getAdminProjectById(id);
  if (!project) notFound();

  const pct = fundingPct(project.fundedAmountBdt.toString(), project.fundingGoalBdt.toString());

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/admin/projects" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Projects
        </Link>
        <Link href={`/admin/projects/${id}/edit`} className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
        </Link>
      </div>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex flex-wrap gap-2">
              <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[project.status] ?? "bg-muted text-muted-foreground")}>
                {STATUS_LABELS[project.status] ?? project.status}
              </span>
              <Badge variant="secondary" className="text-xs">
                {CATEGORY_LABELS[project.category] ?? project.category}
              </Badge>
            </div>
            <h1 className="text-2xl font-bold">{project.title}</h1>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {project.location ?? "—"}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Deadline: {new Date(project.fundingDeadline).toLocaleDateString("en-BD", { day: "numeric", month: "long", year: "numeric" })}
              </span>
              {project.manager && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  Manager: {project.manager.name}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 font-semibold">Description</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.description}</p>
          </div>

          {/* Risk info */}
          {project.riskInfo && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 font-semibold">Risk Information</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{project.riskInfo}</p>
            </div>
          )}

          {/* Project details */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 font-semibold">Project Details</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Location", value: project.location ?? "—" },
                { label: "Category", value: project.category },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/40 p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent updates */}
          {project.updates.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 font-semibold">Recent Updates</h2>
              <div className="space-y-3">
                {project.updates.map((u) => (
                  <div key={u.id} className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{u.type.replace(/_/g, " ")}</Badge>
                      {u.publishedAt && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(u.publishedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{u.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{u.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Lifecycle transition */}
          <ProjectStatusTransition projectId={project.id} currentStatus={project.status as ProjectStatus} />

          {/* Funding stats */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <h3 className="text-sm font-semibold">Funding</h3>
            <div>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-primary">{pct}% funded</span>
                <span className="text-muted-foreground">{formatBdt(project.fundedAmountBdt.toString())} raised</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Goal: {formatBdt(project.fundingGoalBdt.toString())}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Return", value: `${Number(project.expectedReturnPct).toFixed(1)}%` },
                { label: "Duration", value: `${project.durationDays}d` },
                { label: "Min Invest", value: formatBdt(project.minInvestmentBdt.toString()) },
                { label: "Investors", value: project._count.investments.toString() },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg bg-muted/40 p-2.5 text-center">
                  <p className="text-sm font-semibold text-primary">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Audit trail */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Audit Trail</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(project.createdAt).toLocaleDateString("en-BD")}</span>
              </div>
              {project.approvedAt && (
                <div className="flex justify-between">
                  <span>Approved</span>
                  <span>{new Date(project.approvedAt).toLocaleDateString("en-BD")}</span>
                </div>
              )}
              {project.publishedAt && (
                <div className="flex justify-between">
                  <span>Published</span>
                  <span>{new Date(project.publishedAt).toLocaleDateString("en-BD")}</span>
                </div>
              )}
              {project.completedAt && (
                <div className="flex justify-between">
                  <span>Completed</span>
                  <span>{new Date(project.completedAt).toLocaleDateString("en-BD")}</span>
                </div>
              )}
              {project.cancelledAt && (
                <div className="flex justify-between">
                  <span>Cancelled</span>
                  <span>{new Date(project.cancelledAt).toLocaleDateString("en-BD")}</span>
                </div>
              )}
              {project.cancellationReason && (
                <p className="rounded bg-muted/50 p-2 text-xs">{project.cancellationReason}</p>
              )}
              {project.rejectionReason && (
                <p className="rounded bg-destructive/10 p-2 text-xs text-destructive">{project.rejectionReason}</p>
              )}
            </div>
          </div>

          {/* Public link */}
          {["FUNDRAISING", "FUNDED", "ACTIVE", "HARVESTING", "SOLD", "PROFIT_CALCULATION", "DISTRIBUTION", "COMPLETED"].includes(project.status) && (
            <Link
              href={`/projects/${project.slug}`}
              target="_blank"
              className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full justify-center")}
            >
              View Public Page ↗
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
