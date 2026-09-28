import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFarmerProjects } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { FundingProgress } from "@/components/ui/funding-progress";
import { FolderOpen, Plus } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Projects — Farmer Portal" };

const STATUS_VARIANT: Record<string, string> = {
  DRAFT: "default", PENDING_APPROVAL: "pending", APPROVED: "review",
  FUNDRAISING: "funding", FUNDED: "confirmed", ACTIVE: "active",
  HARVESTING: "processing", COMPLETED: "completed", CANCELLED: "cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", APPROVED: "Approved",
  FUNDRAISING: "Fundraising", FUNDED: "Funded", ACTIVE: "Active",
  HARVESTING: "Harvesting", SOLD: "Sold", PROFIT_CALCULATION: "Profit Calc.",
  DISTRIBUTION: "Distributing", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

export default async function FarmerProjectsPage() {
  const session = await requireSession();
  const projects = await getFarmerProjects(session);

  const active = projects.filter((p) => ["FUNDRAISING", "FUNDED", "ACTIVE", "HARVESTING"].includes(p.status));
  const drafts = projects.filter((p) => ["DRAFT", "PENDING_APPROVAL", "APPROVED"].includes(p.status));
  const completed = projects.filter((p) => ["COMPLETED", "CANCELLED"].includes(p.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Projects"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""} total`}
        action={
          <Button asChild size="sm">
            <Link href="/farmer/projects/new">
              <Plus className="mr-1.5 h-4 w-4" /> New Project
            </Link>
          </Button>
        }
      />

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<FolderOpen className="h-6 w-6" />}
            title="No projects yet"
            description="Create your first project to start fundraising from investors"
            action={
              <Button asChild size="sm">
                <Link href="/farmer/projects/new">
                  <Plus className="mr-1.5 h-4 w-4" /> Create Project
                </Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Active</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {active.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          {drafts.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">In Progress</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {drafts.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}

          {completed.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Completed / Cancelled</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {completed.map((p) => (
                  <ProjectCard key={p.id} project={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project: p }: { project: Awaited<ReturnType<typeof getFarmerProjects>>[number] }) {
  const fundedPct = Number(p.fundedAmountBdt) / Number(p.fundingGoalBdt);

  return (
    <Link
      href={`/farmer/projects/${p.id}`}
      className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{p.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{p.farm.name} · {p.farm.district}</p>
        </div>
        <StatusBadge status={STATUS_VARIANT[p.status] as never ?? "default"}>
          {STATUS_LABEL[p.status] ?? p.status}
        </StatusBadge>
      </div>

      {["FUNDRAISING", "FUNDED", "ACTIVE", "HARVESTING"].includes(p.status) && (
        <div className="mb-3">
          <FundingProgress
            funded={Number(p.fundedAmountBdt)}
            goal={Number(p.fundingGoalBdt)}
          />
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{p.category.replace("_", " ")}</span>
        <span>
          {p.fundingDeadline && `Deadline: ${formatDate(p.fundingDeadline)}`}
        </span>
      </div>
    </Link>
  );
}
