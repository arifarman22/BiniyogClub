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
  TrendingUp, Wallet, CheckCircle2, Clock, BarChart3,
  ArrowRight, AlertCircle, Bell, ArrowUpRight, ArrowDownRight,
  ShieldCheck, Layers, Lock, RefreshCw, X, MapPin, Target,
} from "lucide-react";
import { DashboardCharts } from "./dashboard-charts";
import { InvestorAnalyticsCharts } from "./investor-analytics-charts";

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
  kyc = await getInvestorKyc(session).catch(() => null);
  availableProjects = await getAvailableProjects(6).catch(() => []);

  try {
    [stats, recentUpdates, investments, portfolio] = await Promise.all([
      getInvestorDashboard(session),
      getInvestorProjectUpdates(session, 4),
      getInvestorInvestments(session),
      getInvestorPortfolio(session),
    ]);
  } catch {
    const kycStatus = kyc?.status ?? "NOT_STARTED";
    const kycVerified = kycStatus === "VERIFIED";

    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4 space-y-4">
        <p className="text-4xl">{kycVerified ? "🎉" : "👋"}</p>
        <h1 className="text-xl font-bold">Welcome, {session.name.split(" ")[0]}!</h1>

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
    <div className="space-y-6">

      {/* ── Email verification warning ── */}
      {!session.emailVerified && (
        <div className="flex items-center gap-3 rounded-xl border border-warning/40 bg-warning-muted px-4 py-3">
          <AlertCircle className="h-4 w-4 shrink-0 text-warning" />
          <p className="text-sm font-medium">
            Verify your email to unlock investing —{" "}
            <span className="text-muted-foreground font-normal">check your inbox.</span>
          </p>
        </div>
      )}

      {/* ── KYC banner ── */}
      {kycStatus === "NOT_STARTED" && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <Lock className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">KYC verification required to invest</p>
              <p className="text-xs text-muted-foreground">Complete identity verification to unlock all investment features.</p>
            </div>
          </div>
          <Link
            href="/dashboard/kyc"
            className={cn(buttonVariants({ size: "sm" }), "btn-arc shrink-0 bg-destructive text-white hover:bg-destructive/90")}
          >
            Verify Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {(kycStatus === "SUBMITTED" || kycStatus === "UNDER_REVIEW") && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-warning/40 bg-warning-muted px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/20">
              <Clock className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold">KYC under review</p>
              <p className="text-xs text-muted-foreground">Your documents have been submitted. We&apos;ll notify you once verified — usually within 1–2 business days.</p>
            </div>
          </div>
          <Link
            href="/dashboard/kyc"
            className={cn(buttonVariants({ size: "sm", variant: "outline" }), "shrink-0")}
          >
            View Status
          </Link>
        </div>
      )}

      {kycStatus === "REJECTED" && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-destructive/10">
              <X className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-destructive">KYC rejected — action required</p>
              <p className="text-xs text-muted-foreground">Your verification was rejected. Please resubmit with the correct documents.</p>
            </div>
          </div>
          <Link
            href="/dashboard/kyc"
            className={cn(buttonVariants({ size: "sm" }), "btn-arc shrink-0 bg-destructive text-white hover:bg-destructive/90")}
          >
            Resubmit <RefreshCw className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {kycStatus === "RESUBMISSION_REQUIRED" && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-warning/40 bg-warning-muted px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-warning/20">
              <RefreshCw className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold">Additional information needed</p>
              <p className="text-xs text-muted-foreground">Our team requires updated documents or corrections before approving your KYC.</p>
            </div>
          </div>
          <Link
            href="/dashboard/kyc"
            className={cn(buttonVariants({ size: "sm" }), "btn-arc shrink-0")}
          >
            Update KYC <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* ── Hero: Balance + quick stats ── */}
      <div className="grid gap-4 lg:grid-cols-3">

        {/* Balance card */}
        <div className="relative overflow-hidden rounded-2xl gradient-brand p-6 text-white lg:col-span-1">
          {/* decorative circles */}
          <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10" />
          <div className="pointer-events-none absolute -bottom-10 -right-4 h-28 w-28 rounded-full bg-white/5" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="h-4 w-4 opacity-80" />
              <span className="text-sm font-medium opacity-80">Wallet Balance</span>
            </div>
            <p className="text-4xl font-bold tracking-tight">{fmt(stats.walletBalance)}</p>
            <p className="mt-1 text-xs opacity-60">Available to invest</p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-[10px] opacity-70 mb-0.5">Total Invested</p>
                <p className="text-base font-bold">{fmt(stats.totalInvested)}</p>
              </div>
              <div className="rounded-xl bg-white/10 px-3 py-2.5">
                <p className="text-[10px] opacity-70 mb-0.5">Returns Earned</p>
                <p className="text-base font-bold">{fmt(stats.distributedReturns)}</p>
              </div>
            </div>

            <Link
              href="/dashboard/wallet"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium opacity-80 hover:opacity-100 transition-opacity"
            >
              Manage wallet <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          {[
            {
              label: "Portfolio Value",
              value: fmt(stats.portfolioValue),
              sub: `${stats.activeCount} active`,
              icon: BarChart3,
              color: "text-brand-600",
              bg: "bg-brand-50",
              trend: stats.portfolioValue > stats.totalInvested ? "up" : null,
              href: "/dashboard/portfolio",
            },
            {
              label: "ROI",
              value: `${roi}%`,
              sub: "distributed returns",
              icon: TrendingUp,
              color: "text-success",
              bg: "bg-success-muted",
              trend: Number(roi) > 0 ? "up" : null,
              href: "/dashboard/portfolio",
            },
            {
              label: "Completed",
              value: stats.completedCount.toString(),
              sub: "matured investments",
              icon: CheckCircle2,
              color: "text-finance-600",
              bg: "bg-finance-100",
              trend: null,
              href: "/dashboard/investments",
            },
            {
              label: "Pending",
              value: stats.pendingTransactions.toString(),
              sub: "transactions",
              icon: Clock,
              color: stats.pendingTransactions > 0 ? "text-warning" : "text-muted-foreground",
              bg: stats.pendingTransactions > 0 ? "bg-warning-muted" : "bg-muted",
              trend: null,
              href: "/dashboard/transactions",
            },
          ].map(({ label, value, sub, icon: Icon, color, bg, trend, href }) => (
            <Link key={label} href={href} className="group">
              <div className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-md h-full">
                <div className="flex items-start justify-between">
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-xl", bg, color)}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {trend === "up" && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-success">
                      <ArrowUpRight className="h-3 w-3" /> Up
                    </span>
                  )}
                  {trend === "down" && (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-destructive">
                      <ArrowDownRight className="h-3 w-3" /> Down
                    </span>
                  )}
                </div>
                <p className={cn("mt-3 text-2xl font-bold", color)}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-0.5">{sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Analytics charts ── */}
      <InvestorAnalyticsCharts
        monthlyHistory={portfolio.monthlyHistory}
        categoryData={categoryData}
        distributionHistory={distributionHistory}
        statusData={statusData}
      />

      {/* ── Available projects ── */}
      {availableProjects.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Open for Investment</h2>
            </div>
            <Link href="/projects" className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "text-xs h-7 px-2")}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {availableProjects.map((p) => {
              const pct = Math.min(100, Math.round((Number(p.fundedAmountBdt) / Number(p.fundingGoalBdt)) * 100));
              const daysLeft = Math.max(0, Math.ceil((new Date(p.fundingDeadline).getTime() - Date.now()) / 86400000));
              return (
                <Link
                  key={p.id}
                  href={`/projects/${p.slug}`}
                  className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Cover */}
                  <div className="relative h-32 bg-gradient-to-br from-brand-700 to-brand-500">
                    {p.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImageUrl} alt={p.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    <span className="absolute bottom-2 left-3 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] font-medium text-white">
                      {p.category.replace(/_/g, " ")}
                    </span>
                    <span className="absolute bottom-2 right-3 flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2 py-0.5 text-[10px] text-white">
                      <Clock className="h-2.5 w-2.5" /> {daysLeft}d left
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{p.title}</p>
                      {p.location && (
                        <p className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                          <MapPin className="h-3 w-3" /> {p.location}
                        </p>
                      )}
                    </div>

                    {/* Funding bar */}
                    <div>
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{pct}% funded</span>
                        <span>৳{Number(p.fundingGoalBdt).toLocaleString("en-BD")} goal</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted/40 py-1.5">
                        <p className="text-xs font-bold text-success">{(Number(p.expectedReturnPct) * 100).toFixed(0)}%</p>
                        <p className="text-[9px] text-muted-foreground">Return</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 py-1.5">
                        <p className="text-xs font-bold">{p.durationDays}d</p>
                        <p className="text-[9px] text-muted-foreground">Duration</p>
                      </div>
                      <div className="rounded-lg bg-muted/40 py-1.5">
                        <p className="text-xs font-bold">{p._count.investments}</p>
                        <p className="text-[9px] text-muted-foreground">Investors</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-muted-foreground">
                      Min ৳{Number(p.minInvestmentBdt).toLocaleString("en-BD")}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Bottom grid: investments + updates ── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Recent investments — wider */}
        <div className="lg:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-sm">Recent Investments</h2>
            </div>
            <Link
              href="/dashboard/investments"
              className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "text-xs h-7 px-2")}
            >
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>

          {recent.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="px-4 py-2.5 text-left text-[11px] font-medium text-muted-foreground">Project</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-medium text-muted-foreground">Amount</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-medium text-muted-foreground hidden sm:table-cell">Return</th>
                    <th className="px-4 py-2.5 text-right text-[11px] font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((inv, i) => (
                    <tr
                      key={inv.id}
                      className={cn(
                        "transition-colors hover:bg-muted/30",
                        i < recent.length - 1 && "border-b border-border/60",
                      )}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[160px]">{inv.project?.title ?? "—"}</p>
                        <p className="text-[10px] text-muted-foreground">{fmtDate(inv.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {fmt(Number(inv.amountBdt))}
                      </td>
                      <td className="px-4 py-3 text-right text-success text-xs hidden sm:table-cell">
                        +{Number(inv.project?.expectedReturnPct ?? 0) * 100 > 0
                          ? `${(Number(inv.project?.expectedReturnPct ?? 0) * 100).toFixed(0)}%`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[inv.status] ?? "bg-muted-foreground")} />
                          <span className="text-[10px] font-medium text-muted-foreground">
                            {STATUS_LABEL[inv.status] ?? inv.status}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground mb-3">No investments yet.</p>
              <Link href="/projects" className={cn(buttonVariants({ size: "sm" }))}>
                Browse Projects
              </Link>
            </div>
          )}
        </div>

        {/* Right column: updates + quick actions */}
        <div className="lg:col-span-2 space-y-4">

          {/* Project updates */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm">Project Updates</h2>
              </div>
              <Link
                href="/dashboard/notifications"
                className={cn(buttonVariants({ size: "sm", variant: "ghost" }), "text-xs h-7 px-2")}
              >
                All <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>

            {recentUpdates.length > 0 ? (
              <div className="space-y-2">
                {recentUpdates.map((u) => (
                  <Link
                    key={u.id}
                    href={`/projects/${u.project.slug}`}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:bg-muted/30"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-50">
                      <Bell className="h-3.5 w-3.5 text-brand-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{u.title}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{u.project.title}</p>
                    </div>
                    {u.publishedAt && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">{fmtDate(u.publishedAt)}</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border py-8 text-center">
                <p className="text-xs text-muted-foreground">No updates yet.</p>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Quick Actions</p>
            <div className="space-y-1.5">
              {[
                {
                  href: "/projects",
                  label: canInvest ? "Browse & Invest" : "Browse Projects",
                  icon: canInvest ? TrendingUp : Lock,
                  color: canInvest ? "text-brand-600" : "text-muted-foreground",
                  bg: canInvest ? "bg-brand-50" : "bg-muted",
                },
                {
                  href: "/dashboard/kyc",
                  label: kycVerified ? "KYC Verified ✓" : "Complete KYC",
                  icon: ShieldCheck,
                  color: kycVerified ? "text-success" : "text-finance-600",
                  bg: kycVerified ? "bg-success-muted" : "bg-finance-100",
                },
                { href: "/dashboard/wallet",      label: "Manage Wallet",   icon: Wallet,   color: "text-harvest-600", bg: "bg-harvest-100" },
                { href: "/dashboard/investments", label: "All Investments", icon: BarChart3, color: "text-finance-600", bg: "bg-finance-100" },
              ].map(({ href, label, icon: Icon, color, bg }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-muted/50"
                >
                  <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", bg, color)}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
