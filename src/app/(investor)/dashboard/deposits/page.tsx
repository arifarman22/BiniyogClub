export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { cn } from "cn";
import { ArrowDownLeft, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { AddMoneyDialog } from "@/components/wallet/add-money-dialog";
import { DepositDetailPopup } from "./deposit-detail-popup";

export const metadata: Metadata = { title: "Deposits — Dashboard" };

type SearchParams = Promise<{ page?: string }>;

function fmtBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-warning-muted text-warning border-warning/30",
  PROCESSING: "bg-info/10 text-info border-info/30",
  COMPLETED:  "bg-success-muted text-success border-success/30",
  FAILED:     "bg-destructive/10 text-destructive border-destructive/30",
  REFUNDED:   "bg-muted text-muted-foreground border-border",
  CANCELLED:  "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Review", PROCESSING: "Processing",
  COMPLETED: "Completed", FAILED: "Failed",
  REFUNDED: "Refunded", CANCELLED: "Cancelled",
};

export default async function DepositsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const limit = 15;
  const skip = (page - 1) * limit;

  const session = await requireSession();

  const wallet = await db.wallet.findUnique({
    where: { userId: session.id },
    select: { id: true },
  });

  if (!wallet) {
    return (
      <div className="rounded-xl border border-dashed border-border py-20 text-center">
        <p className="font-medium">No wallet found</p>
      </div>
    );
  }

  const [allDeposits, total] = await Promise.all([
    db.payment.findMany({
      where: { walletId: wallet.id, direction: "INBOUND" },
      select: {
        id: true, method: true, status: true,
        amountBdt: true, feeBdt: true, netAmountBdt: true,
        externalReference: true, description: true,
        processedAt: true, createdAt: true, gatewayResponse: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    db.payment.count({ where: { walletId: wallet.id, direction: "INBOUND" } }),
  ]);

  // Stats (all-time, not paginated)
  const [statsAgg, pendingCount, completedCount] = await Promise.all([
    db.payment.aggregate({
      where: { walletId: wallet.id, direction: "INBOUND", status: "COMPLETED" },
      _sum: { netAmountBdt: true },
      _count: true,
    }),
    db.payment.count({ where: { walletId: wallet.id, direction: "INBOUND", status: "PENDING" } }),
    db.payment.count({ where: { walletId: wallet.id, direction: "INBOUND", status: "COMPLETED" } }),
  ]);

  const totalDeposited = Number(statsAgg._sum.netAmountBdt ?? 0);
  const totalPages = Math.ceil(total / limit);

  const pending = allDeposits.filter((d) => d.status === "PENDING");
  const history = allDeposits.filter((d) => d.status !== "PENDING");

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Deposits</h1>
          <p className="text-sm text-muted-foreground">All your wallet top-up requests</p>
        </div>
        <AddMoneyDialog walletId={wallet.id} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          {
            label: "Total Deposited",
            value: fmtBdt(totalDeposited),
            icon: ArrowDownLeft,
            color: "text-success",
            bg: "bg-success/10",
          },
          {
            label: "Pending Review",
            value: pendingCount.toString(),
            icon: Clock,
            color: pendingCount > 0 ? "text-warning" : "text-muted-foreground",
            bg: pendingCount > 0 ? "bg-warning/10" : "bg-muted",
          },
          {
            label: "Completed",
            value: completedCount.toString(),
            icon: CheckCircle2,
            color: "text-success",
            bg: "bg-success/10",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground">{label}</p>
              <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", bg, color)}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <p className={cn("text-xl font-bold", color)}>{value}</p>
          </div>
        ))}
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-warning/20 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <h2 className="font-semibold text-sm">Pending Requests</h2>
            </div>
            <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning">
              {pending.length} awaiting review
            </span>
          </div>
          <div className="divide-y divide-warning/10">
            {pending.map((d) => {
              const proof = (d.gatewayResponse as Record<string, string> | null)?.proofFileUrl;
              return (
                <div key={d.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{fmtBdt(Number(d.amountBdt))}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {d.method.replace(/_/g, " ")}
                      {d.externalReference ? ` · Ref: ${d.externalReference}` : ""}
                      {" · "}{fmtDate(d.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {proof && (
                      <a
                        href={proof}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        View Proof ↗
                      </a>
                    )}
                    <span className="rounded-full border border-warning/30 bg-warning-muted px-2.5 py-0.5 text-[10px] font-medium text-warning">
                      Pending Review
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-3 border-t border-warning/20 bg-warning/5">
            <p className="text-xs text-muted-foreground">
              Finance team reviews deposits within 1–2 business days. You&apos;ll be notified once confirmed.
            </p>
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Deposit History</h2>

        {history.length > 0 ? (
          <>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/30">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden sm:table-cell">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground hidden md:table-cell">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "flex h-7 w-7 items-center justify-center rounded-full",
                            d.status === "COMPLETED" ? "bg-success/10" : "bg-muted"
                          )}>
                            {d.status === "COMPLETED"
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                              : d.status === "FAILED" || d.status === "CANCELLED"
                                ? <XCircle className="h-3.5 w-3.5 text-destructive" />
                                : <ArrowDownLeft className="h-3.5 w-3.5 text-muted-foreground" />
                            }
                          </div>
                          <span className="text-xs font-medium">{d.method.replace(/_/g, " ")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("font-semibold", d.status === "COMPLETED" ? "text-success" : "")}>
                          {fmtBdt(Number(d.netAmountBdt))}
                        </span>
                        {Number(d.feeBdt) > 0 && (
                          <p className="text-[10px] text-muted-foreground">fee: {fmtBdt(Number(d.feeBdt))}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell">
                        {d.externalReference ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", STATUS_COLORS[d.status] ?? "bg-muted text-muted-foreground border-border")}>
                          {STATUS_LABELS[d.status] ?? d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {fmtDate(d.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DepositDetailPopup deposit={d} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {page > 1 && (
                  <Link href={`/dashboard/deposits?page=${page - 1}`} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                    Previous
                  </Link>
                )}
                <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                {page < totalPages && (
                  <Link href={`/dashboard/deposits?page=${page + 1}`} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                    Next
                  </Link>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            <ArrowDownLeft className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-medium">No deposit history yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Confirmed deposits will appear here.</p>
          </div>
        )}
      </div>

    </div>
  );
}
