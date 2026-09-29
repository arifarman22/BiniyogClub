import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getMyGroupInvestments } from "@/server/data/groups.data";
import { getActiveBankAccounts } from "@/server/data/manual-payment.data";
import { GroupPaymentProofButton } from "@/components/groups/group-payment-proof-button";
import { cn } from "cn";

export const metadata: Metadata = { title: "Group Investments — Dashboard" };

const STATUS_COLORS: Record<string, string> = {
  PENDING:         "bg-muted text-muted-foreground border-border",
  PAYMENT_PENDING: "bg-warning/10 text-warning border-warning/30",
  ACTIVE:          "bg-success/10 text-success border-success/30",
  CANCELLED:       "bg-destructive/10 text-destructive border-destructive/30",
  COMPLETED:       "bg-brand-100 text-brand-700 border-brand-300/40",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", PAYMENT_PENDING: "Awaiting Payment",
  ACTIVE: "Active", CANCELLED: "Cancelled", COMPLETED: "Completed",
};

const SUBMISSION_COLORS: Record<string, string> = {
  SUBMITTED:    "bg-info/10 text-info border-info/30",
  UNDER_REVIEW: "bg-warning/10 text-warning border-warning/30",
  APPROVED:     "bg-success/10 text-success border-success/30",
  REJECTED:     "bg-destructive/10 text-destructive border-destructive/30",
};

const TIER_ICONS: Record<string, string> = {
  INVESTOR: "📈", SHAREHOLDER: "🏦", DIRECTORSHIP: "👔",
  PLOT_BOOKING: "🏗️", LAND_SHARE: "🌍",
};

function fmtBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" });
}

export default async function DashboardGroupsPage() {
  const session = await requireSession();
  const [investments, bankAccounts] = await Promise.all([
    getMyGroupInvestments(session),
    getActiveBankAccounts(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Group Investments</h1>
          <p className="text-sm text-muted-foreground">{investments.length} total group investments</p>
        </div>
        <Link href="/groups" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors">
          Browse Groups
        </Link>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <p className="text-3xl mb-3">🏢</p>
          <p className="font-semibold">No group investments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Explore Mariners, MOHS, and Marinozz groups to get started.</p>
          <Link href="/groups" className="mt-4 inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
            Explore Groups →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {investments.map((inv) => {
            const latestPayment = inv.manualPayments[0] ?? null;
            const canSubmit = inv.status === "PAYMENT_PENDING" &&
              bankAccounts.length > 0 &&
              (!latestPayment || latestPayment.status === "REJECTED");

            return (
              <div key={inv.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 px-4 py-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-2xl shrink-0">{TIER_ICONS[inv.tier.type] ?? "💼"}</span>
                    <div className="min-w-0">
                      <p className="font-semibold line-clamp-1">
                        {inv.tier.entity.group.name} — {inv.tier.entity.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {inv.tier.name} · {fmtDate(inv.createdAt)}
                        {inv.receiptNumber && ` · ${inv.receiptNumber}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold">{fmtBdt(inv.amountBdt.toString())}</p>
                    {inv.confirmedAt && (
                      <p className="text-xs text-muted-foreground">Active since {fmtDate(inv.confirmedAt)}</p>
                    )}
                  </div>

                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0", STATUS_COLORS[inv.status])}>
                    {STATUS_LABELS[inv.status] ?? inv.status}
                  </span>
                </div>

                {inv.status === "PAYMENT_PENDING" && (
                  <div className="border-t border-border bg-muted/20 px-4 py-3 space-y-2">
                    {latestPayment && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-medium", SUBMISSION_COLORS[latestPayment.status])}>
                          {latestPayment.status.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">Ref: {latestPayment.transactionRef}</span>
                        {latestPayment.status === "REJECTED" && latestPayment.rejectionReason && (
                          <p className="w-full rounded bg-destructive/10 px-3 py-1.5 text-xs text-destructive border border-destructive/20">
                            Rejected: {latestPayment.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}

                    {canSubmit && (
                      <div className="flex items-center gap-3">
                        <p className="text-xs text-muted-foreground flex-1">
                          {latestPayment?.status === "REJECTED"
                            ? "Please resubmit with correct details."
                            : "Transfer the amount to our bank account and submit your payment proof."}
                        </p>
                        <GroupPaymentProofButton
                          groupInvestmentId={inv.id}
                          amountBdt={Number(inv.amountBdt)}
                          bankAccounts={bankAccounts}
                        />
                      </div>
                    )}

                    {latestPayment && ["SUBMITTED", "UNDER_REVIEW"].includes(latestPayment.status) && (
                      <p className="text-xs text-muted-foreground">
                        Your proof is under review. This usually takes 1–2 business days.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
