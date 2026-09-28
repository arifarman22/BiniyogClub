import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerFieldVisits } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Eye, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Field Visits — Farmer Portal" };

const STATUS_VARIANT: Record<string, string> = {
  SCHEDULED: "pending", IN_PROGRESS: "processing",
  COMPLETED: "completed", CANCELLED: "cancelled",
};

export default async function FarmerFieldVisitsPage() {
  const session = await requireSession();
  const visits = await getFarmerFieldVisits(session);

  const upcoming = visits.filter((v) => v.status === "SCHEDULED");
  const past = visits.filter((v) => ["COMPLETED", "IN_PROGRESS", "CANCELLED"].includes(v.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Field Visits"
        description="Scheduled and completed visits by field officers"
      />

      {visits.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Eye className="h-6 w-6" />}
            title="No field visits"
            description="Field visits will appear here when scheduled by your project manager"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Upcoming</h2>
              <div className="space-y-3">
                {upcoming.map((v) => <VisitCard key={v.id} visit={v} statusVariant={STATUS_VARIANT} />)}
              </div>
            </section>
          )}
          {past.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Past Visits</h2>
              <div className="space-y-3">
                {past.map((v) => <VisitCard key={v.id} visit={v} statusVariant={STATUS_VARIANT} />)}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function VisitCard({
  visit: v,
  statusVariant,
}: {
  visit: Awaited<ReturnType<typeof getFarmerFieldVisits>>[number];
  statusVariant: Record<string, string>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold">{v.project.title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(v.scheduledAt)}
            </span>
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {v.fieldOfficerProfile.user.name}
            </span>
          </div>
        </div>
        <StatusBadge status={statusVariant[v.status] as never ?? "default"}>
          {v.status.replace("_", " ")}
        </StatusBadge>
      </div>

      {v.summary && (
        <div className="mt-3 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Summary</p>
          <p className="text-sm">{v.summary}</p>
        </div>
      )}

      {v.findings && (
        <div className="mt-2 rounded-lg bg-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Findings</p>
          <p className="text-sm">{v.findings}</p>
        </div>
      )}

      {v.recommendations && (
        <div className="mt-2 rounded-lg bg-info-muted/40 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-1">Recommendations</p>
          <p className="text-sm">{v.recommendations}</p>
        </div>
      )}
    </div>
  );
}
