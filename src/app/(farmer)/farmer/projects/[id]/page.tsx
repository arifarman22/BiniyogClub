import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFarmerProjectById } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { FundingProgress } from "@/components/ui/funding-progress";
import { SubmitProjectButton } from "@/components/farmer/submit-project-button";
import { Sprout, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Project — Farmer Portal" };

const STATUS_VARIANT: Record<string, string> = {
  DRAFT: "default", PENDING_APPROVAL: "pending", APPROVED: "review",
  FUNDRAISING: "funding", FUNDED: "confirmed", ACTIVE: "active",
  HARVESTING: "processing", COMPLETED: "completed", CANCELLED: "cancelled",
};

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Draft", PENDING_APPROVAL: "Pending Approval", APPROVED: "Approved",
  FUNDRAISING: "Fundraising", FUNDED: "Funded", ACTIVE: "Active",
  HARVESTING: "Harvesting", SOLD: "Sold", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const CROP_STATUS_LABEL: Record<string, string> = {
  PLANNED: "Planned", PLANTED: "Planted", GROWING: "Growing",
  HARVESTING: "Harvesting", COMPLETED: "Completed", FAILED: "Failed",
};

export default async function FarmerProjectDetailPage({ params }: AsyncComponentProps) {
  const session = await requireSession();
  const { id } = await params!;
  const project = await getFarmerProjectById(session, id as string);

  const canSubmit = project.status === "DRAFT";
  const showFunding = ["FUNDRAISING", "FUNDED", "ACTIVE", "HARVESTING", "COMPLETED"].includes(project.status);

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={project.title}
        breadcrumb={
          <Link href="/farmer/projects" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to projects
          </Link>
        }
        action={
          <div className="flex items-center gap-2">
            <StatusBadge status={STATUS_VARIANT[project.status] as never ?? "default"}>
              {STATUS_LABEL[project.status] ?? project.status}
            </StatusBadge>
            {canSubmit && <SubmitProjectButton projectId={project.id} />}
          </div>
        }
      />

      {/* Rejection / cancellation reason */}
      {project.rejectionReason && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-xs font-medium text-destructive">Rejection reason</p>
          <p className="mt-1 text-sm">{project.rejectionReason}</p>
        </div>
      )}

      {/* Funding progress (no investor count or amounts) */}
      {showFunding && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 font-semibold">Funding Progress</h2>
          <FundingProgress
            funded={Number(project.fundedAmountBdt)}
            goal={Number(project.fundingGoalBdt)}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Goal: ৳{Number(project.fundingGoalBdt).toLocaleString("en-BD")}
            {project.fundingDeadline && ` · Deadline: ${formatDate(project.fundingDeadline)}`}
          </p>
        </div>
      )}

      {/* Project details */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Project Details</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Category</p>
            <p className="font-medium mt-0.5">{project.category.replace("_", " ")}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Farm</p>
            <p className="font-medium mt-0.5">{project.farm.name}</p>
          </div>
          {project.startDate && (
            <div>
              <p className="text-muted-foreground">Start date</p>
              <p className="font-medium mt-0.5">{formatDate(project.startDate)}</p>
            </div>
          )}
          {project.endDate && (
            <div>
              <p className="text-muted-foreground">End date</p>
              <p className="font-medium mt-0.5">{formatDate(project.endDate)}</p>
            </div>
          )}
          {project.location && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Location</p>
              <p className="font-medium mt-0.5">{project.location}</p>
            </div>
          )}
          <div className="col-span-2">
            <p className="text-muted-foreground">Description</p>
            <p className="mt-0.5 whitespace-pre-line">{project.description}</p>
          </div>
        </div>
      </div>

      {/* Crop cycles */}
      {project.cropCycles.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Crop Cycles ({project.cropCycles.length})</h2>
          </div>
          <ul className="divide-y divide-border">
            {project.cropCycles.map((cc) => (
              <li key={cc.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <Sprout className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{cc.crop.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cc.field.name} · {Number(cc.areaAcres).toFixed(2)} acres
                      {cc.expectedHarvestAt && ` · Harvest: ${formatDate(cc.expectedHarvestAt)}`}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {CROP_STATUS_LABEL[cc.status] ?? cc.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Project updates */}
      {project.updates.length > 0 && (
        <div className="rounded-xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Project Updates</h2>
          </div>
          <ul className="divide-y divide-border">
            {project.updates.map((u) => (
              <li key={u.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{u.title}</p>
                    <p className="text-xs text-muted-foreground mb-1">
                      {u.type} {u.publishedAt && `· ${formatDate(u.publishedAt)}`}
                    </p>
                    <p className="text-sm text-muted-foreground line-clamp-2">{u.content}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
