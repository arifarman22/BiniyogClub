import type { Metadata } from "next";
import { requireSession } from "@/lib/auth/session";
import { getInvestorNotifications } from "@/server/data/investor.data";
import { Bell, CheckCircle2 } from "lucide-react";
import { cn } from "cn";
import Link from "next/link";

export const metadata: Metadata = { title: "Notifications — Dashboard" };

type SearchParams = Promise<{ page?: string }>;

const NOTIF_TYPE_ICONS: Record<string, string> = {
  INVESTMENT_CONFIRMED: "✅",
  INVESTMENT_MATURED:   "🎉",
  PAYMENT_RECEIVED:     "💰",
  PAYMENT_FAILED:       "❌",
  PROJECT_APPROVED:     "✅",
  PROJECT_FUNDED:       "🌾",
  PROJECT_UPDATE:       "📋",
  KYC_APPROVED:         "🛡️",
  KYC_REJECTED:         "⚠️",
  WITHDRAWAL_APPROVED:  "✅",
  WITHDRAWAL_COMPLETED: "💸",
  SYSTEM:               "🔔",
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
          <h1 className="text-xl font-bold">Notifications</h1>
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
                  "flex items-start gap-3 rounded-xl border px-4 py-4 transition-colors",
                  n.isRead
                    ? "border-border bg-card"
                    : "border-primary/20 bg-primary/5",
                )}
              >
                <span className="mt-0.5 text-lg shrink-0">
                  {NOTIF_TYPE_ICONS[n.type] ?? "🔔"}
                </span>
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
                <Link href={`/dashboard/notifications?page=${page - 1}`} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <Link href={`/dashboard/notifications?page=${page + 1}`} className="rounded-md border border-border px-4 py-2 text-sm hover:border-primary/50">
                  Next
                </Link>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border py-20 text-center">
          <Bell className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="font-medium">No notifications yet</p>
          <p className="mt-1 text-sm text-muted-foreground">You&apos;ll be notified about your investments here.</p>
        </div>
      )}
    </div>
  );
}
