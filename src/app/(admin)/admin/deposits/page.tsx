export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { ConfirmDepositButton } from "@/components/admin/confirm-deposit-button";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, ArrowDownLeft, XCircle } from "lucide-react";
import type { AsyncComponentProps } from "@/types";
import { AdminPagination } from "@/components/admin/admin-pagination";

export const metadata: Metadata = { title: "Deposits — Admin" };

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-warning/10 text-warning border-warning/30",
  PROCESSING: "bg-info/10 text-info border-info/30",
  COMPLETED:  "bg-success/10 text-success border-success/30",
  FAILED:     "bg-destructive/10 text-destructive border-destructive/30",
  REFUNDED:   "bg-muted text-muted-foreground border-border",
  CANCELLED:  "bg-muted text-muted-foreground border-border",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending Review", PROCESSING: "Processing",
  COMPLETED: "Completed", FAILED: "Failed",
  REFUNDED: "Refunded", CANCELLED: "Cancelled",
};

export default async function AdminDepositsPage({ searchParams }: AsyncComponentProps) {
  await requireSession();
  const sp = await searchParams ?? {};
  const page = Math.max(1, parseInt(typeof sp.page === "string" ? sp.page : "1", 10));
  const limit = 20;
  const skip = (page - 1) * limit;

  const [pending, { items, total }, stats] = await Promise.all([
    // All pending deposits (no pagination — usually small)
    db.payment.findMany({
      where: { direction: "INBOUND", status: "PENDING" },
      select: {
        id: true, amountBdt: true, method: true,
        externalReference: true, gatewayResponse: true, createdAt: true,
        wallet: { select: { user: { select: { id: true, name: true, email: true } } } },
      },
      orderBy: { createdAt: "asc" },
    }),
    // Paginated history (non-pending)
    (async () => {
      const [items, total] = await Promise.all([
        db.payment.findMany({
          where: { direction: "INBOUND", status: { not: "PENDING" } },
          select: {
            id: true, method: true, status: true,
            amountBdt: true, feeBdt: true, netAmountBdt: true,
            externalReference: true, processedAt: true, createdAt: true,
            wallet: { select: { user: { select: { name: true, email: true } } } },
          },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
        }),
        db.payment.count({ where: { direction: "INBOUND", status: { not: "PENDING" } } }),
      ]);
      return { items, total };
    })(),
    // Stats
    Promise.all([
      db.payment.aggregate({
        where: { direction: "INBOUND", status: "COMPLETED" },
        _sum: { netAmountBdt: true },
        _count: true,
      }),
      db.payment.count({ where: { direction: "INBOUND", status: "PENDING" } }),
    ]),
  ]);

  const [completedAgg, pendingCount] = stats;
  const totalDeposited = Number(completedAgg._sum.netAmountBdt ?? 0);
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <PageHeader title="Deposits" description="All investor wallet deposit requests" />

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: "Total Deposited", value: fmtBdt(totalDeposited), icon: ArrowDownLeft, color: "text-success", bg: "bg-success/10" },
          { label: "Pending Review",  value: String(pendingCount),   icon: Clock,         color: pendingCount > 0 ? "text-warning" : "text-muted-foreground", bg: pendingCount > 0 ? "bg-warning/10" : "bg-muted" },
          { label: "Completed",       value: String(completedAgg._count), icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
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
      {pending.length > 0 ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 overflow-hidden">
          <div className="flex items-center justify-between border-b border-warning/20 px-5 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-warning" />
              <h2 className="font-semibold text-sm">Pending Requests</h2>
            </div>
            <span className="rounded-full bg-warning/20 px-2.5 py-0.5 text-xs font-semibold text-warning">
              {pending.length} awaiting confirmation
            </span>
          </div>
          <div className="divide-y divide-warning/10">
            {pending.map((p) => {
              const proof = (p.gatewayResponse as Record<string, string> | null)?.proofFileUrl;
              return (
                <div key={p.id} className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-medium text-sm">{p.wallet.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{p.wallet.user?.email}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.method.replace(/_/g, " ")}
                      {p.externalReference ? ` · Ref: ${p.externalReference}` : ""}
                      {" · "}{fmtDate(p.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono font-semibold text-sm">{fmtBdt(p.amountBdt)}</span>
                    {proof && (
                      <a href={proof} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline">
                        View Proof ↗
                      </a>
                    )}
                    <ConfirmDepositButton paymentId={p.id} amount={String(p.amountBdt)} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-8 text-center">
          <CheckCircle2 className="h-6 w-6 text-success mx-auto mb-2" />
          <p className="text-sm font-medium">No pending deposit requests</p>
          <p className="text-xs text-muted-foreground mt-1">All deposits have been reviewed.</p>
        </div>
      )}

      {/* History */}
      <div>
        <h2 className="font-semibold text-sm mb-3">Deposit History</h2>
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {items.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No deposit history yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Investor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Method</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Reference</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {items.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium">{d.wallet.user?.name}</p>
                        <p className="text-xs text-muted-foreground">{d.wallet.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex items-center gap-2">
                          <div className={cn("flex h-6 w-6 items-center justify-center rounded-full",
                            d.status === "COMPLETED" ? "bg-success/10" : "bg-muted"
                          )}>
                            {d.status === "COMPLETED"
                              ? <CheckCircle2 className="h-3 w-3 text-success" />
                              : d.status === "FAILED" || d.status === "CANCELLED"
                                ? <XCircle className="h-3 w-3 text-destructive" />
                                : <ArrowDownLeft className="h-3 w-3 text-muted-foreground" />
                            }
                          </div>
                          <span className="text-xs text-muted-foreground">{d.method.replace(/_/g, " ")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={cn("font-mono font-semibold", d.status === "COMPLETED" ? "text-success" : "")}>
                          {fmtBdt(d.netAmountBdt)}
                        </span>
                        {Number(d.feeBdt) > 0 && (
                          <p className="text-[10px] text-muted-foreground">fee: {fmtBdt(d.feeBdt)}</p>
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
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {fmtDate(d.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <AdminPagination page={page} totalPages={totalPages} total={total} />
      </div>
    </div>
  );
}
