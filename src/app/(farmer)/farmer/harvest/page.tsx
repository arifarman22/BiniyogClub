import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerHarvests, getFarmerProjects, getFarmerActiveCropCycles } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RecordHarvestDialog } from "@/components/farmer/record-harvest-dialog";
import { Wheat } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Harvest — Farmer Portal" };

export default async function FarmerHarvestPage() {
  const session = await requireSession();
  const [harvests, projects, cropCycles] = await Promise.all([
    getFarmerHarvests(session),
    getFarmerProjects(session),
    getFarmerActiveCropCycles(session),
  ]);

  const totalYield = harvests.reduce((s, h) => s + Number(h.yieldKg), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Harvest Records"
        description={`Total yield: ${totalYield.toLocaleString()} kg`}
        action={<RecordHarvestDialog projects={projects} cropCycles={cropCycles} />}
      />

      {harvests.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Wheat className="h-6 w-6" />}
            title="No harvests recorded"
            description="Record your harvests to track yield and quality"
            action={<RecordHarvestDialog projects={projects} cropCycles={cropCycles} />}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Crop</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Project</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Yield (kg)</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Grade</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {harvests.map((h) => (
                <tr key={h.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3">
                    <p className="font-medium">{h.cropCycle.crop.name}</p>
                    <p className="text-xs text-muted-foreground">{h.cropCycle.field.name}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                    {h.project.title}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-medium">
                    {Number(h.yieldKg).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {h.qualityGrade ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(h.harvestedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
