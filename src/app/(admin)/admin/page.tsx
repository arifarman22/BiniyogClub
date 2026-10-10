export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import type { ReactNode } from "react";
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
  BarChart3, Layers, TrendingUp, ArrowRight, CheckCircle2, UserPlus, Wallet,
} from "lucide-react";
import { AdminAnalyticsCharts } from "./analytics-charts-lazy";

export const metadata: Metadata = { title: "Dashboard — Admin" };

const INV_STATUS_VARIANT: Record<string, string> = {
  PENDING: "pending", PAYMENT_PENDING: "pending", ACTIVE: "active",
  MATURED: "completed", CANCELLED: "cancelled", COMPLETED: "completed",
};

function initialsOf(name: string | null | undefined) {
  return (name ?? "?")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{children}</p>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

function Panel({
  title,
  icon,
  href,
  children,
}: {
  title: string;
  icon: ReactNode;
  href: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:h-4 [&_svg]:w-4">
            {icon}
          </span>
          <h2 className="text-sm font-semibold">{title}</h2>
        </div>
        <Link href={href} className="group inline-flex items-center gap-1 text-xs font-semibold text-primary">
          View all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <div className="flex-1 border-t border-border/70">{children}</div>
    </div>
  );
}

function Initials({ name }: { name: string | null | undefined }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-[11px] font-bold text-emerald-800 dark:from-emerald-900/50 dark:to-teal-900/50 dark:text-emerald-200">
      {initialsOf(name)}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireSession();
  const kpis = await getAdminDashboardKpis(session);
  const activity = await getAdminRecentActivity(session);
  const analytics = await getAdminAnalytics(session);

  const attention = [
    kpis.pendingKyc > 0 && {
      href: "/admin/kyc?status=SUBMITTED",
      icon: ShieldCheck,
      label: `${kpis.pendingKyc} KYC review${kpis.pendingKyc !== 1 ? "s" : ""}`,
    },
    kpis.pendingWithdrawals > 0 && {
      href: "/admin/withdrawals?status=PENDING",
      icon: ArrowDownToLine,
      label: `${kpis.pendingWithdrawals} withdrawal${kpis.pendingWithdrawals !== 1 ? "s" : ""}`,
    },
    kpis.projectsNearMaturity > 0 && {
      href: "/admin/projects",
      icon: AlertTriangle,
      label: `${kpis.projectsNearMaturity} project${kpis.projectsNearMaturity !== 1 ? "s" : ""} near maturity`,
    },
  ].filter(Boolean) as { href: string; icon: typeof ShieldCheck; label: string }[];

  return (
    <div className="space-y-8">
      <PageHeader title="Platform overview" description="Live metrics across users, capital and projects." className="mb-0" />

      {/* ── Hero summary ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#06140f] p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(16,185,129,0.28),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 fintech-grid-pattern opacity-30" />
        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Total capital invested</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">
              {fmtBdt(analytics.kpis.totalInvested)}
            </p>
            <p className="mt-2 text-sm text-white/60">
              Across {kpis.activeInvestments.toLocaleString()} active investments and{" "}
              {analytics.kpis.activeProjects.toLocaleString()} live projects.
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10 lg:col-span-4">
            {[
              { label: "Investors", value: analytics.kpis.totalInvestors.toLocaleString() },
              { label: "Distributed", value: fmtBdt(analytics.kpis.totalDistributed) },
              { label: "Funding rate", value: `${analytics.kpis.fundingRate}%` },
            ].map((s) => (
              <div key={s.label} className="bg-[#06140f]/80 px-4 py-3.5">
                <dt className="text-[11px] text-white/50">{s.label}</dt>
                <dd className="mt-0.5 truncate text-lg font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="lg:col-span-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">Needs attention</p>
            {attention.length === 0 ? (
              <p className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 px-3 py-2 text-sm font-medium text-emerald-200">
                <CheckCircle2 className="h-4 w-4" /> All caught up
              </p>
            ) : (
              <ul className="space-y-1.5">
                {attention.map(({ href, icon: Icon, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="group flex items-center gap-2.5 rounded-xl bg-white/[0.06] px-3 py-2 text-sm font-medium ring-1 ring-white/10 transition-colors hover:bg-white/[0.1]"
                    >
                      <Icon className="h-4 w-4 text-amber-300" />
                      <span className="flex-1">{label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-white/40 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* ── KPI groups ── */}
      <div className="grid gap-8 xl:grid-cols-2">
        <div>
          <SectionLabel>Users &amp; investors</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Total users" value={kpis.totalUsers.toLocaleString()} icon={<Users />} variant="brand" />
            <StatCard title="Investors" value={analytics.kpis.totalInvestors.toLocaleString()} icon={<UserCheck />} variant="brand" />
            <StatCard
              title="Pending KYC"
              value={kpis.pendingKyc.toLocaleString()}
              icon={<ShieldCheck />}
              description={kpis.pendingKyc > 0 ? "Needs review" : "All clear"}
              variant="brand"
            />
          </div>
        </div>
        <div>
          <SectionLabel>Projects</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard title="Active projects" value={analytics.kpis.activeProjects.toLocaleString()} icon={<FolderKanban />} variant="harvest" />
            <StatCard
              title="Funding rate"
              value={`${analytics.kpis.fundingRate}%`}
              icon={<BarChart3 />}
              description={`${analytics.kpis.completedProjects}/${analytics.kpis.totalProjects} projects`}
              variant="harvest"
            />
            <StatCard
              title="Near maturity"
              value={kpis.projectsNearMaturity.toLocaleString()}
              icon={<AlertTriangle />}
              description="Ending in 30 days"
              variant="harvest"
            />
          </div>
        </div>
      </div>

      <div>
        <SectionLabel>Finance</SectionLabel>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total investment" value={fmtBdt(analytics.kpis.totalInvested)} icon={<TrendingUp />} variant="finance" />
          <StatCard title="Active investments" value={kpis.activeInvestments.toLocaleString()} icon={<Clock />} variant="finance" />
          <StatCard title="Distributions" value={fmtBdt(analytics.kpis.totalDistributed)} icon={<Layers />} variant="finance" />
          <StatCard
            title="Pending withdrawals"
            value={kpis.pendingWithdrawals.toLocaleString()}
            icon={<ArrowDownToLine />}
            description={kpis.pendingWithdrawals > 0 ? "Awaiting approval" : "None pending"}
            variant="finance"
          />
        </div>
      </div>

      {/* ── Analytics charts ── */}
      <AdminAnalyticsCharts
        monthly={analytics.monthly}
        investmentsByStatus={analytics.investmentsByStatus as never}
        investmentsByReturnType={analytics.investmentsByReturnType as never}
        projectsByStatus={analytics.projectsByStatus as never}
        projectsByCategory={analytics.projectsByCategory as never}
        topProjects={analytics.topProjects as never}
      />

      {/* ── Activity ── */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Panel title="Recent users" icon={<UserPlus />} href="/admin/users">
          <ul className="divide-y divide-border/70">
            {activity.recentUsers.map((u) => (
              <li key={u.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                <Initials name={u.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{u.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    {u.role.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{fmtDate(u.createdAt)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Recent investments" icon={<TrendingUp />} href="/admin/investments">
          <ul className="divide-y divide-border/70">
            {activity.recentInvestments.map((inv) => (
              <li key={inv.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                <Initials name={inv.investorProfile.user.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{inv.investorProfile.user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{inv.project.title}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums">{fmtBdt(inv.amountBdt)}</span>
                  <StatusBadge status={(INV_STATUS_VARIANT[inv.status] as never) ?? "default"} dot={false}>
                    {inv.status.replace(/_/g, " ")}
                  </StatusBadge>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Pending withdrawals" icon={<Wallet />} href="/admin/withdrawals?status=PENDING">
          {activity.recentWithdrawals.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-5 py-12 text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <p className="text-sm text-muted-foreground">No pending withdrawals</p>
            </div>
          ) : (
            <ul className="divide-y divide-border/70">
              {activity.recentWithdrawals.map((w) => (
                <li key={w.id} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40">
                  <Initials name={w.wallet.user?.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{w.wallet.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{w.method.replace(/_/g, " ")}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-semibold tabular-nums">{fmtBdt(w.amountBdt)}</span>
                    <StatusBadge status="pending" dot={false}>{w.status}</StatusBadge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
