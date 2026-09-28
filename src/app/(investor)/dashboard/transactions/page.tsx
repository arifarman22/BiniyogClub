import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorTransactions } from "@/server/data/investor.data";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { cn } from "cn";
import Link from "next/link";

export const metadata: Metadata = { title: "Transactions — Dashboard" };

type SearchParams = Promise<{ page?: string }>;

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-warning-muted text-warning-foreground",
  PROCESSING: "bg-info-muted text-info-foreground",
  COMPLETED:  "bg-success-muted text-success",
  FAILED:     "bg-destructive/10 text-destructive",
  REFUNDED:   "bg-muted text-muted-foreground",
  CANCELLED:  "bg-muted text-muted-foreground",
};

function formatBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

export default async function TransactionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const session = await requireSession();
  const { payments, total, totalPages } = await getInvestorTransactions(session, page);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold">Transactions</h1>
        <p className="text-sm text-muted-foreground">{total} total transactions</p>
      </div>

      {payments.length > 0 ? (
        <>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Method</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Description</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground hidden lg:table-cell">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "flex h-7 w-7 items-center justify-center rounded-full",
                          p.direction === "INBOUND" ? "bg-success-muted text-success" : "bg-destructive/10 text-destructive"
                        )}>
                          {p.direction === "INBOUND"
                            ? <ArrowDownLeft className="h-3.5 w-3.5" />
                            : <ArrowUpRight className="h-3.5 w-3.5" />}
                        </div>
                        <span className="text-xs font-medium">
                          {p.direction === "INBOUND" ? "Deposit" : "Withdrawal"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn("font-semibold", p.direction === "INBOUND" ? "text-success" : "text-destructive")}>
                        {p.direction === "INBOUND" ? "+" : "-"}{formatBdt(p.netAmountBdt.toString())}
                      </span>
                      {Number(p.feeBdt.toString()) > 0 && (
                        <p className="text-[10px] text-muted-foreground">fee: {formatBdt(p.feeBdt.toString())}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                      {p.method.replace("_", " ")}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[p.status] ?? "bg-muted text-muted-foreground")}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell max-w-xs truncate">
                      {p.description ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-muted-foreground hidden lg:table-cell">
                      {new Date(p.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`/dashboard/transactions?page=${page - 1}`} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/transactions?page=${page + 1}`} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-2xl mb-2">💳</p>
          <p className="font-medium">No transactions yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Your payment history will appear here.</p>
        </div>
      )}
    </div>
  );
}
