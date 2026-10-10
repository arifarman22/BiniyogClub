export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorNotifications } from "@/server/data/investor.data";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle, ArrowDownToLine, Bell, CheckCircle2, ClipboardList, PartyPopper, ShieldCheck, Sprout, Wallet, XCircle,
} from "lucide-react";
import { cn } from "cn";
import Link from "next/link";

export const metadata: Metadata = { title: "Notifications — Dashboard" };

type SearchParams = Promise<{ page?: string }>;

const NOTIF_TYPES: Record<string, { icon: LucideIcon; tone: string }> = {
  INVESTMENT_CONFIRMED: { icon: CheckCircle2,  tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  INVESTMENT_MATURED:   { icon: PartyPopper,   tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  PAYMENT_RECEIVED:     { icon: Wallet,        tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  PAYMENT_FAILED:       { icon: XCircle,       tone: "bg-red-500/10 text-red-600 dark:text-red-400" },
  PROJECT_APPROVED:     { icon: CheckCircle2,  tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  PROJECT_FUNDED:       { icon: Sprout,        tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  PROJECT_UPDATE:       { icon: ClipboardList, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  KYC_APPROVED:         { icon: ShieldCheck,   tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  KYC_REJECTED:         { icon: AlertTriangle, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  WITHDRAWAL_APPROVED:  { icon: CheckCircle2,  tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  WITHDRAWAL_COMPLETED: { icon: ArrowDownToLine, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  SYSTEM:               { icon: Bell,          tone: "bg-muted text-muted-foreground" },
};

export default async function NotificationsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const session = await requireSession();
  const { notifications, total, unreadCount, totalPages } = await getInvestorNotifications(session, page);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Notifications</h1>
          <p className="text-sm text-muted-foreground">
            {total} total · {unreadCount} unread
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>

      {notifications.length > 0 ? (
        <>
          <div className="space-y-2">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 rounded-2xl border px-5 py-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-colors",
                  n.isRead
                    ? "border-border/70 bg-card"
                    : "border-primary/25 bg-gradient-to-r from-primary/[0.06] to-card",
                )}
              >
                {(() => {
                  const { icon: Icon, tone } = NOTIF_TYPES[n.type] ?? NOTIF_TYPES.SYSTEM;
                  return (
                    <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", tone)}>
                      <Icon className="h-5 w-5" />
                    </span>
                  );
                })()}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn("text-sm font-medium", !n.isRead && "text-primary")}>
                      {n.title}
                    </p>
                    {!n.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary mt-1.5" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.body}</p>
                  <p className="mt-1.5 text-[10px] text-muted-foreground">
                    {new Date(n.createdAt).toLocaleDateString("en-BD", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                    {n.readAt && <span className="ml-2 text-muted-foreground/60">· Read</span>}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 && (
                <Link href={`/dashboard/notifications?page=${page - 1}`} className="rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:border-primary/40 hover:text-primary">
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/notifications?page=${page + 1}`} className="rounded-xl border border-border/70 bg-card px-4 py-2 text-sm font-medium shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:border-primary/40 hover:text-primary">
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="surface-card border-dashed py-20 text-center">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Bell className="h-6 w-6" /></span>
          <p className="font-medium">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">You&apos;ll be notified about your investments here.</p>
        </div>
      )}
    </div>
  );
}
