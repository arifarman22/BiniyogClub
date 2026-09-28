import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getFarmerFarms } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { AddFarmDialog } from "@/components/farmer/add-farm-dialog";
import { Tractor, MapPin, Layers, Plus } from "lucide-react";

export const metadata: Metadata = { title: "Farms — Farmer Portal" };

export default async function FarmerFarmsPage() {
  const session = await requireSession();
  const farms = await getFarmerFarms(session);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Farms"
        description={`${farms.length} farm${farms.length !== 1 ? "s" : ""} registered`}
        action={<AddFarmDialog />}
      />

      {farms.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Tractor className="h-6 w-6" />}
            title="No farms registered"
            description="Register your farm to start creating projects"
            action={<AddFarmDialog />}
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {farms.map((farm) => (
            <Link
              key={farm.id}
              href={`/farmer/farms/${farm.id}`}
              className="block rounded-xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-harvest-100 text-harvest-600 dark:bg-harvest-600/20 dark:text-harvest-400">
                  <Tractor className="h-5 w-5" />
                </div>
                <StatusBadge status={farm.status === "ACTIVE" ? "active" : "inactive"}>
                  {farm.status}
                </StatusBadge>
              </div>

              <p className="font-semibold">{farm.name}</p>

              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {farm.district}, {farm.division}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Layers className="h-3.5 w-3.5 shrink-0" />
                  {Number(farm.totalAreaAcres).toFixed(2)} acres · {farm._count.fields} field{farm._count.fields !== 1 ? "s" : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
