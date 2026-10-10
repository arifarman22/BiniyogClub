import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import {
  getInvestorDashboard,
  getInvestorProjectUpdates,
  getInvestorInvestments,
  getInvestorPortfolio,
  getInvestorKyc,
  getAvailableProjects,
} from "@/server/data/investor.data";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";
import {
  TrendingUp, CheckCircle2, Clock, BarChart3,
  ArrowRight, AlertCircle, Bell, ArrowUpRight,
  ShieldCheck, Layers, MapPin, Sparkles,
} from "lucide-react";
import { InvestorAnalyticsCharts } from "./investor-analytics-charts-lazy";
import { StatCard } from "@/components/ui/stat-card";

export const metadata: Metadata = { title: "Dashboard — Biniyog Club" };

function fmt(n: number) {
  if (n >= 10_000_000) return `৳${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000)    return `৳${(n / 100_000).toFixed(2)}L`;
  if (n >= 1_000)      return `৳${(n / 1_000).toFixed(1)}K`;
  return `৳${n.toLocaleString()}`;
}

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("en-BD", { day: "numeric", month: "short" });
}

const STATUS_DOT: Record<string, string> = {
  ACTIVE:   "bg-success",
  PENDING:  "bg-warning",
  PAYMENT_PENDING: "bg-warning",
  MATURED:  "bg-finance-500",
  CANCELLED:"bg-destructive",
  COMPLETED:"bg-finance-500",
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: "Active", PENDING: "Pending", PAYMENT_PENDING: "Awaiting Payment",
  MATURED: "Matured", CANCELLED: "Cancelled", COMPLETED: "Completed",
};

const CAT_COLORS: Record<string, string> = {
  REAL_ESTATE:    "#008C64",
  TRADE_FINANCE:  "#3B82F6",
  SME:            "#F59E0B",
  TECHNOLOGY:     "#8B5CF6",
  INFRASTRUCTURE: "#EC4899",
  OTHER:          "#6B7280",
};

export default async function DashboardPage() {
  const session = await requireSession().catch(() =>
    redirect("/auth/login?callbackUrl=/dashboard"),
  );

  let stats, recentUpdates, investments, portfolio, kyc, availableProjects;

  try {
    [stats, recentUpdates, investments, portfolio, kyc, availableProjects] = await Promise.all([
      getInvestorDashboard(session),
      getInvestorProjectUpdates(session, 4),
      getInvestorInvestments(session),
      getInvestorPortfolio(session),
      getInvestorKyc(session).catch(() => null),
      getAvailableProjects(6).catch(() => []),
    ]) as [Awaited<ReturnType<typeof getInvestorDashboard>>, Awaited<ReturnType<typeof getInvestorProjectUpdates>>, Awaited<ReturnType<typeof getInvestorInvestments>>, Awaited<ReturnType<typeof getInvestorPortfolio>>, Awaited<ReturnType<typeof getInvestorKyc>>, Awaited<ReturnType<typeof getAvailableProjects>>];
  } catch {
    // kyc may be undefined if the whole Promise.all failed; fetch it independently
    const fallbackKyc = await getInvestorKyc(session).catch(() => null);
    const kycStatus = fallbackKyc?.status ?? "NOT_STARTED";
    const kycVerified = kycStatus === "VERIFIED";

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 space-y-4">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25">{kycVerified ? <CheckCircle2 className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}</span>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem]">Welcome, {session.name.split(" ")[0]}!</h1>

        {!kycVerified && kycStatus === "NOT_STARTED" && (
          <>
            <p className="text-muted-foreground max-w-sm">
              Complete KYC verification to unlock investing.
            </p>
            <Link href="/dashboard/kyc" className={cn(buttonVariants({ size: "sm" }))}>
              Start KYC <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </>
        )}

        {(kycStatus === "SUBMITTED" || kycStatus === "UNDER_REVIEW") && (
          <>
            <p className="text-muted-foreground max-w-sm">
              Your KYC is under review. We&apos;ll notify you once verified.
            </p>
            <Link href="/dashboard/kyc" className={cn(buttonVariants({ size: "sm", variant: "outline" }))}>
              View KYC Status
            </Link>
          </>
        )}

        {(kycStatus === "REJECTED" || kycStatus === "RESUBMISSION_REQUIRED") && (
          <>
            <p className="text-muted-foreground max-w-sm">
              Your KYC needs attention. Please resubmit your documents.
            </p>
            <Link href="/dashboard/kyc" className={cn(buttonVariants({ size: "sm" }))}>
              Update KYC <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </>
        )}

        {kycVerified && (
          <>
            <p className="text-muted-foreground max-w-sm">
              Your KYC is verified! Complete your investor profile to start investing.
            </p>
            <Link href="/dashboard/profile" className={cn(buttonVariants({ size: "sm" }))}>
              Complete Profile
            </Link>
          </>
        )}
      </div>
    );
  }

  const kycStatus = kyc?.status ?? "NOT_STARTED";
  const kycVerified = kycStatus === "VERIFIED";
  const canInvest = kycVerified && session.emailVerified;

  // Distribution history (12 months)
  const now = new Date();
  const distributionHistory = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const label = d.toLocaleDateString("en-BD", { month: "short", year: "2-digit" });
    const amount = portfolio.investments
      .flatMap((inv) => inv.distributions)
      .filter((dist) => {
        const c = new Date(dist.distributedAt);
        return c.getFullYear() === d.getFullYear() && c.getMonth() === d.getMonth();
      })
      .reduce((s, dist) => s + Number(dist.netAmountBdt), 0);
    return { month: label, amount };
  });

  // Status data for pie
  const STATUS_COLORS: Record<string, string> = {
    ACTIVE: "#008C64", MATURED: "#10B981", COMPLETED: "#3B82F6",
    CANCELLED: "#EF4444", PENDING: "#F59E0B", PAYMENT_PENDING: "#F59E0B",
  };
  const statusData = Object.entries(portfolio.statusMap)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: k.replace(/_/g, " "), value: v, color: STATUS_COLORS[k] ?? "#9CA3AF" }));

  const recent = investments.slice(0, 6);
  const roi = stats.totalInvested > 0
    ? ((stats.distributedReturns / stats.totalInvested) * 100).toFixed(1)
    : "0.0";

  // Category donut data
  const categoryData = Object.entries(portfolio.categoryMap).map(([name, value]) => ({
    name: name.replace("_", " "),
    value,
    color: CAT_COLORS[name] ?? "#6B7280",
  }));


  return (
    <div className="space-y-8">

      {/* ── Email verification warning (KYC reminders live in the shell banner) ── */}
      {!session.emailVerified && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-4 w-4" />
          </span>
          <p className="text-sm">
            <span className="font-semibold">Verify your email to unlock investing.</span>{" "}
            <span className="text-muted-foreground">Check your inbox for the verification link.</span>
          </p>
        </div>
      )}

      {/* ── Portfolio hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-[#06140f] p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_80%_at_100%_0%,rgba(16,185,129,0.3),transparent_60%)]" />
        <div className="pointer-events-none absolute inset-0 fintech-grid-pattern opacity-30" />
        <div className="relative grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300/80">Total invested</p>
            <div className="mt-2 flex flex-wrap items-end gap-3">
              <p className="text-4xl font-semibold tabular-nums tracking-tight sm:text-5xl">{fmt(stats.totalInvested)}</p>
              <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/20">
                <ArrowUpRight className="h-3.5 w-3.5" /> {roi}% ROI
              </span>
            </div>
            <p className="mt-2 text-sm text-white/60">
              {stats.activeCount} active investment{stats.activeCount !== 1 ? "s" : ""} ·{" "}
              {fmt(stats.distributedReturns)} returns received
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/projects"
                className="group inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-colors hover:bg-emerald-400"
              >
                {canInvest ? "Invest in a project" : "Browse projects"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/dashboard/portfolio"
                className="inline-flex items-center gap-2 rounded-xl bg-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white ring-1 ring-white/15 transition-colors hover:bg-white/[0.12]"
              >
                View portfolio
              </Link>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 lg:col-span-6">
            {[
              { label: "Portfolio value", value: fmt(stats.portfolioValue) },
              { label: "Returns earned", value: fmt(stats.distributedReturns) },
              { label: "Active projects", value: stats.activeCount.toString() },
              { label: "Completed", value: stats.completedCount.toString() },
            ].map((s) => (
              <div key={s.label} className="bg-[#06140f]/80 px-5 py-4">
                <dt className="text-[11px] text-white/50">{s.label}</dt>
                <dd className="mt-0.5 text-xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link href="/dashboard/portfolio" className="block">
          <StatCard
            title="Portfolio value"
            value={fmt(stats.portfolioValue)}
            description={`${stats.activeCount} active`}
            icon={<BarChart3 />}
            variant="brand"
            className="h-full"
          />
        </Link>
        <Link href="/dashboard/portfolio" className="block">
          <StatCard title="ROI" value={`${roi}%`} description="From distributed returns" icon={<TrendingUp />} variant="finance" className="h-full" />
        </Link>
        <Link href="/dashboard/investments" className="block">
          <StatCard
            title="Completed"
            value={stats.completedCount.toString()}
            description="Matured investments"
            icon={<CheckCircle2 />}
            variant="harvest"
            className="h-full"
          />
        </Link>
        <Link href="/dashboard/investments" className="block">
          <StatCard
            title="Pending"
            value={stats.pendingTransactions.toString()}
            description="Awaiting approval"
            icon={<Clock />}
            className="h-full"
          />
        </Link>
      </div>

      {/* ── Available projects ── */}
      {availableProjects.length > 0 && (
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Open for investment</h2>
              <p className="text-sm text-muted-foreground">Vetted projects currently raising capital.</p>
            </div>
            <Link href="/projects" className="group inline-flex items-center gap-1 text-sm font-semibold text-primary">
              View all <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {availableProjects.map((p) => {
              const pct = Math.min(100, Math.round((Number(p.fundedAmountBdt) / Number(p.fundingGoalBdt)) * 100));
              const daysLeft = Math.max(0, Math.ceil((new Date(p.fundingDeadline).getTime() - now.getTime()) / 86400000));
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_40px_-16px_rgba(16,24,40,0.25)]"
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-brand-700 to-brand-500">
                    {p.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.coverImageUrl}
                        alt={p.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-slate-800 backdrop-blur">
                      {p.category.replace(/_/g, " ")}
                    </span>
                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur">
                      <Clock className="h-2.5 w-2.5" /> {daysLeft}d left
                    </span>
                    <p className="absolute inset-x-4 bottom-3 line-clamp-1 text-sm font-semibold text-white">{p.title}</p>
                  </div>

                  <div className="space-y-4 p-4">
                    {p.location && (
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" /> {p.location}
                      </p>
                    )}
                    <div>
                      <div className="mb-1.5 flex justify-between text-xs">
                        <span className="font-semibold text-foreground">{pct}% funded</span>
                        <span className="text-muted-foreground">৳{Number(p.fundingGoalBdt).toLocaleString("en-BD")} goal</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <dl className="grid grid-cols-3 divide-x divide-border/70 rounded-xl border border-border/70 text-center">
                      <div className="py-2">
                        <dd className="text-sm font-semibold text-success">
                          {p.returnType === "PROFIT_SHARE" && p.returnPctMin && p.returnPctMax
                            ? `${Number(p.returnPctMin).toFixed(1)}–${Number(p.returnPctMax).toFixed(1)}%`
                            : `${Number(p.expectedReturnPct).toFixed(1)}%`}
                        </dd>
                        <dt className="text-[10px] text-muted-foreground">Return</dt>
                      </div>
                      <div className="py-2">
                        <dd className="text-sm font-semibold">{p.durationDays}d</dd>
                        <dt className="text-[10px] text-muted-foreground">Duration</dt>
                      </div>
                      <div className="py-2">
                        <dd className="text-sm font-semibold">{p._count.investments}</dd>
                        <dt className="text-[10px] text-muted-foreground">Investors</dt>
                      </div>
                    </dl>
                    <p className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Min ৳{Number(p.minInvestmentBdt).toLocaleString("en-BD")}</span>
                      <span className="inline-flex items-center gap-1 font-semibold text-primary">
                        Details <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Analytics charts ── */}
      <InvestorAnalyticsCharts
        monthlyHistory={portfolio.monthlyHistory}
        categoryData={categoryData}
        distributionHistory={distributionHistory}
        statusData={statusData}
      />

      {/* ── Bottom grid: investments + updates ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Recent investments */}
        <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:col-span-3">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-sm font-semibold">Recent investments</h2>
            </div>
            <Link href="/dashboard/investments" className="group inline-flex items-center gap-1 text-xs font-semibold text-primary">
              View all <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="overflow-x-auto border-t border-border/70">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40">
                    <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Project</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="hidden px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Return</th>
                    <th className="px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {recent.map((inv) => (
                    <tr key={inv.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-3.5">
                        <p className="max-w-[200px] truncate font-medium">{inv.project?.title ?? "—"}</p>
                        <p className="text-[11px] text-muted-foreground">{fmtDate(inv.createdAt)}</p>
                      </td>
                      <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{fmt(Number(inv.amountBdt))}</td>
                      <td className="hidden px-5 py-3.5 text-right text-xs font-semibold text-success sm:table-cell">
                        {inv.project?.returnType === "PROFIT_SHARE" && inv.project?.returnPctMin && inv.project?.returnPctMax
                          ? `${Number(inv.project.returnPctMin).toFixed(1)}–${Number(inv.project.returnPctMax).toFixed(1)}%`
                          : Number(inv.project?.expectedReturnPct ?? 0) > 0
                            ? `+${Number(inv.project?.expectedReturnPct ?? 0).toFixed(1)}%`
                            : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1">
                          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[inv.status] ?? "bg-muted-foreground")} />
                          <span className="text-[11px] font-medium text-foreground/80">{STATUS_LABEL[inv.status] ?? inv.status}</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 border-t border-border/70 px-5 py-14 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </span>
              <p className="text-sm text-muted-foreground">You haven&apos;t invested yet.</p>
              <Link href="/projects" className={cn(buttonVariants({ size: "sm" }), "rounded-xl")}>
                Browse projects
              </Link>
            </div>
          )}
        </section>

        {/* Right column: updates + quick actions */}
        <div className="space-y-6 lg:col-span-2">
          <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="flex items-center justify-between px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Bell className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold">Project updates</h2>
              </div>
              <Link href="/dashboard/notifications" className="group inline-flex items-center gap-1 text-xs font-semibold text-primary">
                All <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            {recentUpdates.length > 0 ? (
              <ul className="divide-y divide-border/60 border-t border-border/70">
                {recentUpdates.map((u) => (
                  <li key={u.id}>
                    <Link
                      href={`/projects/${u.project.slug}`}
                      className="flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/30"
                    >
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/15" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{u.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.project.title}</p>
                      </div>
                      {u.publishedAt && (
                        <span className="shrink-0 text-[11px] text-muted-foreground">{fmtDate(u.publishedAt)}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="border-t border-border/70 px-5 py-10 text-center text-sm text-muted-foreground">No updates yet.</p>
            )}
          </section>

          <section className="rounded-2xl border border-border/70 bg-card p-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <p className="px-3 pb-1 pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Quick actions</p>
            {[
              {
                href: "/projects",
                label: canInvest ? "Browse & invest" : "Browse projects",
                icon: TrendingUp,
                tone: "from-emerald-500 to-teal-600",
              },
              {
                href: "/dashboard/kyc",
                label: kycVerified ? "KYC verified" : "Complete KYC",
                icon: ShieldCheck,
                tone: kycVerified ? "from-emerald-500 to-teal-600" : "from-amber-400 to-orange-500",
              },
              { href: "/dashboard/investments", label: "All investments", icon: BarChart3, tone: "from-sky-500 to-indigo-600" },
            ].map(({ href, label, icon: Icon, tone }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-muted/50"
              >
                <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm", tone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{label}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Link>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
