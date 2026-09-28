import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerSales, getFarmerProjects, getFarmerHarvests } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RecordSaleDialog } from "@/components/farmer/record-sale-dialog";
import { ShoppingCart } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Sales — Farmer Portal" };

export default async function FarmerSalesPage() {
  const session = await requireSession();
  const [sales, projects, harvests] = await Promise.all([
    getFarmerSales(session),
    getFarmerProjects(session),
    getFarmerHarvests(session),
  ]);

  const totalRevenue = sales.reduce((s, sale) => s + Number(sale.totalAmountBdt), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description={`Total revenue: ৳${totalRevenue.toLocaleString("en-BD")}`}
        action={<RecordSaleDialog projects={projects} harvests={harvests} />}
      />

      {sales.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<ShoppingCart className="h-6 w-6" />}
            title="No sales recorded"
            description="Record sales after harvesting to track your revenue"
            action={<RecordSaleDialog projects={projects} harvests={harvests} />}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Crop / Harvest</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Buyer</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Qty (kg)</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground hidden md:table-cell">Price/kg</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Total</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sales.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3">
                    <p className="font-medium">{s.harvest.cropCycle.crop.name}</p>
                    <p className="text-xs text-muted-foreground">{s.project.title}</p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                    {s.buyerName ?? "—"}
                  </td>
                  <td className="px-5 py-3 text-right font-mono">
                    {Number(s.quantityKg).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-right font-mono text-muted-foreground hidden md:table-cell">
                    ৳{Number(s.pricePerKgBdt).toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-medium">
                    ৳{Number(s.totalAmountBdt).toLocaleString("en-BD")}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(s.soldAt)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/40">
                <td colSpan={4} className="px-5 py-3 font-semibold">Total Revenue</td>
                <td className="px-5 py-3 text-right font-mono font-bold">
                  ৳{totalRevenue.toLocaleString("en-BD")}
                </td>
                <td className="hidden sm:table-cell" />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
