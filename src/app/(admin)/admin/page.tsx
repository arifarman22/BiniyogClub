export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import { getAdminDashboardKpis, getAdminRecentActivity, getAdminAnalytics } from "@/server/data/admin.data";
import { StatCard } from "@/components/ui/stat-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { fmtBdt, fmtDate } from "@/lib/admin/utils";
import {
  Users, UserCheck, FolderKanban,
  ShieldCheck, ArrowDownToLine, Clock, AlertTriangle,
  BarChart3, Layers, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { AdminAnalyticsCharts } from "./analytics-charts-lazy";

export const metadata: Metadata = { title: "Dashboard — Admin" };

const INV_STATUS_VARIANT: Record<string, string> = {
  PENDING: "pending", PAYMENT_PENDING: "pending", ACTIVE: "active",
  MATURED: "completed", CANCELLED: "cancelled", COMPLETED: "completed",
};

export default async function AdminDashboardPage() {
  const session = await requireSession();
  const kpis = await getAdminDashboardKpis(session);
  const activity = await getAdminRecentActivity(session);
  const analytics = await getAdminAnalytics(session);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Platform overview" />

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        <StatCard title="Total Users" value={kpis.totalUsers.toLocaleString()} icon={<Users className="h-5 w-5" />} variant="brand" />
        <StatCard title="Investors" value={analytics.kpis.totalInvestors.toLocaleString()} icon={<UserCheck className="h-5 w-5" />} />
        <StatCard title="Active Projects" value={analytics.kpis.activeProjects.toLocaleString()} icon={<FolderKanban className="h-5 w-5" />} variant="brand" />
        <StatCard title="Pending KYC" value={kpis.pendingKyc.toLocaleString()} icon={<ShieldCheck className="h-5 w-5" />} description={kpis.pendingKyc > 0 ? "Needs review" : "All clear"} />
        <StatCard title="Pending Withdrawals" value={kpis.pendingWithdrawals.toLocaleString()} icon={<ArrowDownToLine className="h-5 w-5" />} description={kpis.pendingWithdrawals > 0 ? "Awaiting approval" : "None pending"} />
        <StatCard title="Active Investments" value={kpis.activeInvestments.toLocaleString()} icon={<Clock className="h-5 w-5" />} />
        <StatCard title="Distributions" value={fmtBdt(analytics.kpis.totalDistributed)} icon={<Layers className="h-5 w-5" />} />
        <StatCard title="Funding Rate" value={`${analytics.kpis.fundingRate}%`} icon={<BarChart3 className="h-5 w-5" />} description={`${analytics.kpis.completedProjects}/${analytics.kpis.totalProjects} projects`} />
        <StatCard title="Near Maturity" value={kpis.projectsNearMaturity.toLocaleString()} icon={<AlertTriangle className="h-5 w-5" />} description="Projects ending in 30 days" />
      </div>

      {/* Alert banners */}
      {(kpis.pendingKyc > 0 || kpis.pendingWithdrawals > 0) && (
        <div className="flex flex-wrap gap-3">
          {kpis.pendingKyc > 0 && (
            <Link
              href="/admin/kyc?status=SUBMITTED"
              className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-muted/40 px-4 py-2.5 text-sm font-medium text-warning-foreground hover:bg-warning-muted/60 transition-colors"
            >
              <ShieldCheck className="h-4 w-4" />
              {kpis.pendingKyc} KYC submission{kpis.pendingKyc !== 1 ? "s" : ""} awaiting review →
            </Link>
          )}
          {kpis.pendingWithdrawals > 0 && (
            <Link
              href="/admin/withdrawals?status=PENDING"
              className="flex items-center gap-2 rounded-lg border border-info/30 bg-info-muted/40 px-4 py-2.5 text-sm font-medium text-info-foreground hover:bg-info-muted/60 transition-colors"
            >
              <ArrowDownToLine className="h-4 w-4" />
              {kpis.pendingWithdrawals} withdrawal{kpis.pendingWithdrawals !== 1 ? "s" : ""} pending approval →
            </Link>
          )}
        </div>
      )}

      {/* Analytics charts */}
      <AdminAnalyticsCharts
        monthly={analytics.monthly}
        investmentsByStatus={analytics.investmentsByStatus as never}
        investmentsByReturnType={analytics.investmentsByReturnType as never}
        projectsByStatus={analytics.projectsByStatus as never}
        projectsByCategory={analytics.projectsByCategory as never}
        topProjects={analytics.topProjects as never}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent users */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent Users</h2>
            <Link href="/admin/users" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <ul className="divide-y divide-border">
            {activity.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <span className="text-[10px] font-medium text-muted-foreground">{u.role.replace(/_/g, " ")}</span>
                  <span className="text-[10px] text-muted-foreground">{fmtDate(u.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent investments */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Recent Investments</h2>
            <Link href="/admin/investments" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          <ul className="divide-y divide-border">
            {activity.recentInvestments.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inv.investorProfile.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{inv.project.title}</p>
                </div>
                <div className="ml-3 flex flex-col items-end gap-1">
                  <span className="text-xs font-mono font-medium">{fmtBdt(inv.amountBdt)}</span>
                  <StatusBadge status={INV_STATUS_VARIANT[inv.status] as never ?? "default"} dot={false}>
                    {inv.status}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Pending withdrawals */}
        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="text-sm font-semibold">Pending Withdrawals</h2>
            <Link href="/admin/withdrawals?status=PENDING" className="text-xs text-primary hover:underline">View all →</Link>
          </div>
          {activity.recentWithdrawals.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No pending withdrawals</p>
          ) : (
            <ul className="divide-y divide-border">
              {activity.recentWithdrawals.map((w) => (
                <li key={w.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{w.wallet.user.name}</p>
                    <p className="text-xs text-muted-foreground">{w.method.replace(/_/g, " ")}</p>
                  </div>
                  <div className="ml-3 flex flex-col items-end gap-1">
                    <span className="text-xs font-mono font-medium">{fmtBdt(w.amountBdt)}</span>
                    <StatusBadge status="pending" dot={false}>{w.status}</StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
