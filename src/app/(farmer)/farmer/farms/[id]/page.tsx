import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerFarmById } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AddFieldDialog } from "@/components/farmer/add-field-dialog";
import { MapPin, Layers, Sprout } from "lucide-react";
import Link from "next/link";
import type { AsyncComponentProps } from "@/types";

export const metadata: Metadata = { title: "Farm Detail — Farmer Portal" };

const FIELD_STATUS_VARIANT: Record<string, string> = {
  AVAILABLE: "active", IN_USE: "processing", FALLOW: "default", MAINTENANCE: "pending",
};

export default async function FarmDetailPage({ params }: AsyncComponentProps) {
  const session = await requireSession();
  const { id } = await params!;
  const farm = await getFarmerFarmById(session, id as string);

  if (!farm) return <p className="text-muted-foreground">Farm not found.</p>;

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        title={farm.name}
        breadcrumb={
          <Link href="/farmer/farms" className="text-xs text-muted-foreground hover:text-foreground">
            ← Back to farms
          </Link>
        }
        action={
          <StatusBadge status={farm.status === "ACTIVE" ? "active" : "inactive"}>
            {farm.status}
          </StatusBadge>
        }
      />

      {/* Farm info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 font-semibold">Farm Details</h2>
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          <div>
            <p className="text-muted-foreground">Location</p>
            <p className="font-medium flex items-center gap-1 mt-0.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
              {farm.district}, {farm.division}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Total area</p>
            <p className="font-medium mt-0.5">{Number(farm.totalAreaAcres).toFixed(2)} acres</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Address</p>
            <p className="font-medium mt-0.5">{farm.address}</p>
          </div>
          {farm.description && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Description</p>
              <p className="mt-0.5">{farm.description}</p>
            </div>
          )}
          {farm.latitude && farm.longitude && (
            <div className="col-span-2">
              <p className="text-muted-foreground">Coordinates</p>
              <p className="font-mono text-xs mt-0.5">
                {Number(farm.latitude).toFixed(6)}, {Number(farm.longitude).toFixed(6)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-semibold">Fields ({farm.fields.length})</h2>
          <AddFieldDialog farmId={farm.id} />
        </div>

        {farm.fields.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-5 w-5" />}
            title="No fields added"
            description="Add fields to track individual plots within this farm"
            action={<AddFieldDialog farmId={farm.id} />}
            size="sm"
          />
        ) : (
          <ul className="divide-y divide-border">
            {farm.fields.map((field) => (
              <li key={field.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <Sprout className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{field.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {Number(field.areaAcres).toFixed(2)} acres
                      {field.soilType && ` · ${field.soilType}`}
                      {field.irrigationType && ` · ${field.irrigationType}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground hidden sm:block">
                    {field._count.cropCycles} crop{field._count.cropCycles !== 1 ? "s" : ""}
                  </span>
                  <StatusBadge status={FIELD_STATUS_VARIANT[field.status] as never ?? "default"}>
                    {field.status.replace("_", " ")}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
