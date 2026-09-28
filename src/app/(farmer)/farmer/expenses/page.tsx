import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getFarmerExpenses, getFarmerProjects } from "@/server/data/farmer.data";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { RecordExpenseDialog } from "@/components/farmer/record-expense-dialog";
import { Receipt } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Expenses — Farmer Portal" };

const CATEGORY_LABEL: Record<string, string> = {
  SEEDS: "Seeds", FERTILIZER: "Fertilizer", PESTICIDE: "Pesticide",
  LABOR: "Labor", EQUIPMENT: "Equipment", IRRIGATION: "Irrigation",
  TRANSPORT: "Transport", STORAGE: "Storage", INSURANCE: "Insurance",
  LAND_LEASE: "Land Lease", OTHER: "Other",
};

export default async function FarmerExpensesPage() {
  const session = await requireSession();
  const [expenses, projects] = await Promise.all([
    getFarmerExpenses(session),
    getFarmerProjects(session),
  ]);

  const total = expenses.reduce((s, e) => s + Number(e.amountBdt), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expenses"
        description={`Total: ৳${total.toLocaleString("en-BD")}`}
        action={<RecordExpenseDialog projects={projects} />}
      />

      {expenses.length === 0 ? (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={<Receipt className="h-6 w-6" />}
            title="No expenses recorded"
            description="Track your farm expenses to monitor project costs"
            action={<RecordExpenseDialog projects={projects} />}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-5 py-3 text-left font-medium text-muted-foreground">Description</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden md:table-cell">Project</th>
                <th className="px-5 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-5 py-3 text-left font-medium text-muted-foreground hidden sm:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-muted/20">
                  <td className="px-5 py-3">
                    <p className="font-medium">{e.description}</p>
                    <p className="text-xs text-muted-foreground sm:hidden">
                      {CATEGORY_LABEL[e.category] ?? e.category}
                    </p>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                    {CATEGORY_LABEL[e.category] ?? e.category}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden md:table-cell">
                    {e.project.title}
                  </td>
                  <td className="px-5 py-3 text-right font-mono font-medium">
                    ৳{Number(e.amountBdt).toLocaleString("en-BD")}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">
                    {formatDate(e.incurredAt)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border bg-muted/40">
                <td colSpan={3} className="px-5 py-3 font-semibold">Total</td>
                <td className="px-5 py-3 text-right font-mono font-bold">
                  ৳{total.toLocaleString("en-BD")}
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
