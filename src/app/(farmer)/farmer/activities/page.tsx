import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerCropCycles } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Sprout } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Crop Cycles — Farmer Portal" };

const STATUS_VARIANT: Record<string, string> = {
  PLANNED: "default", PLANTED: "pending", GROWING: "active",
  HARVESTING: "processing", COMPLETED: "completed", FAILED: "rejected",
};

const STATUS_COLOR: Record<string, string> = {
  PLANTED: "border-l-info",
  GROWING: "border-l-success",
  HARVESTING: "border-l-warning",
  COMPLETED: "border-l-muted-foreground",
  FAILED: "border-l-destructive",
  PLANNED: "border-l-border",
};

export default async function FarmerActivitiesPage() {
  const session = await requireSession();
  const cycles = await getFarmerCropCycles(session);

  const active = cycles.filter((c) => ["PLANTED", "GROWING", "HARVESTING"].includes(c.status));
  const planned = cycles.filter((c) => c.status === "PLANNED");
  const done = cycles.filter((c) => ["COMPLETED", "FAILED"].includes(c.status));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Crop Cycles"
        description={`${active.length} active · ${planned.length} planned`}
      />

      {cycles.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Sprout className="h-6 w-6" />}
            title="No crop cycles recorded"
            description="Add crop cycles from your farm's field detail page"
          />
        </div>
      ) : (
        <div className="space-y-6">
          {active.length > 0 && (
            <Section title="Active" cycles={active} statusVariant={STATUS_VARIANT} statusColor={STATUS_COLOR} />
          )}
          {planned.length > 0 && (
            <Section title="Planned" cycles={planned} statusVariant={STATUS_VARIANT} statusColor={STATUS_COLOR} />
          )}
          {done.length > 0 && (
            <Section title="Completed / Failed" cycles={done} statusVariant={STATUS_VARIANT} statusColor={STATUS_COLOR} />
          )}
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  cycles,
  statusVariant,
  statusColor,
}: {
  title: string;
  cycles: Awaited<ReturnType<typeof getFarmerCropCycles>>;
  statusVariant: Record<string, string>;
  statusColor: Record<string, string>;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <ul className="divide-y divide-border">
          {cycles.map((cc) => (
            <li
              key={cc.id}
              className={cn("flex items-center justify-between px-5 py-4 border-l-4", statusColor[cc.status] ?? "border-l-border")}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-sm">{cc.crop.name}</p>
                  {cc.crop.localName && (
                    <span className="text-xs text-muted-foreground">({cc.crop.localName})</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {cc.field.name} · {cc.field.farm.name} · {Number(cc.areaAcres).toFixed(2)} acres
                </p>
                <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                  {cc.plantedAt && <span>Planted: {formatDate(cc.plantedAt)}</span>}
                  {cc.expectedHarvestAt && <span>Expected harvest: {formatDate(cc.expectedHarvestAt)}</span>}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 ml-4">
                <StatusBadge status={statusVariant[cc.status] as never ?? "default"}>
                  {cc.status}
                </StatusBadge>
                {cc.expectedYieldKg && (
                  <span className="text-xs text-muted-foreground">
                    {Number(cc.expectedYieldKg).toLocaleString()} kg expected
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
