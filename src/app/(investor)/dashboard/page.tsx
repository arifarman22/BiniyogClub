import type { Metadata } from "next";
import Link from "next/link";
import { requireSession } from "@/lib/auth/session";
import {
  getInvestorDashboard,
  getInvestorProjectUpdates,
  getInvestorInvestments,
} from "@/server/data/investor.data";
import {
  TrendingUp, Wallet, CheckCircle2, Clock, BarChart3,
  ArrowRight, AlertCircle, Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export const metadata: Metadata = { title: "Dashboard — Biniyog Club" };

function formatBdt(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(2)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

const INV_STATUS_COLORS: Record<string, string> = {
  PENDING:   "bg-muted text-muted-foreground",
  CONFIRMED: "bg-info-muted text-info-foreground",
  ACTIVE:    "bg-brand-100 text-brand-700",
  MATURED:   "bg-success-muted text-success",
  CANCELLED: "bg-destructive/10 text-destructive",
  DEFAULTED: "bg-destructive/10 text-destructive",
};

const INV_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", ACTIVE: "Active",
  MATURED: "Matured", CANCELLED: "Cancelled", DEFAULTED: "Defaulted",
};

const UPDATE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General", MILESTONE: "Milestone", ISSUE: "Issue",
  HARVEST_REPORT: "Harvest", FINANCIAL_REPORT: "Financial", FIELD_VISIT_REPORT: "Field Visit",
};

export default async function DashboardPage() {
  const session = await requireSession();

  let stats, recentUpdates, investments;
  try {
    [stats, recentUpdates, investments] = await Promise.all([
      getInvestorDashboard(session),
      getInvestorProjectUpdates(session, 5),
      getInvestorInvestments(session),
    ]);
  } catch {
    // Profile not set up yet — show empty state
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
        <p className="text-4xl mb-4">👋</p>
        <h1 className="text-xl font-bold mb-2">Welcome, {session.name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Your investor profile is being set up. Complete your profile to start investing.
        </p>
        <Link href="/dashboard/profile" className={cn(buttonVariants({ size: "sm" }))}>
          Complete Profile
        </Link>
      </div>
    );
  }

  const recentInvestments = investments.slice(0, 5);

  const statCards = [
    {
      label: "Total Invested",
      value: formatBdt(stats.totalInvested),
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/investments",
    },
    {
      label: "Active Investments",
      value: stats.activeCount.toString(),
      icon: <BarChart3 className="h-5 w-5" />,
      color: "text-brand-600",
      bg: "bg-brand-100",
      href: "/dashboard/investments",
    },
    {
      label: "Completed",
      value: stats.completedCount.toString(),
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-success",
      bg: "bg-success-muted",
      href: "/dashboard/investments",
    },
    {
      label: "Portfolio Value",
      value: formatBdt(stats.portfolioValue),
      icon: <BarChart3 className="h-5 w-5" />,
      color: "text-finance-600",
      bg: "bg-finance-100",
      href: "/dashboard/portfolio",
    },
    {
      label: "Distributed Returns",
      value: formatBdt(stats.distributedReturns),
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-harvest-600",
      bg: "bg-harvest-100",
      href: "/dashboard/portfolio",
    },
    {
      label: "Wallet Balance",
      value: formatBdt(stats.walletBalance),
      icon: <Wallet className="h-5 w-5" />,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/dashboard/wallet",
    },
    {
      label: "Pending Transactions",
      value: stats.pendingTransactions.toString(),
      icon: <Clock className="h-5 w-5" />,
      color: stats.pendingTransactions > 0 ? "text-warning" : "text-muted-foreground",
      bg: stats.pendingTransactions > 0 ? "bg-warning-muted" : "bg-muted",
      href: "/dashboard/transactions",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold">Welcome back, {session.name.split(" ")[0]}</h1>
        <p className="text-sm text-muted-foreground">
          Here&apos;s your investment overview.
        </p>
      </div>

      {/* KYC warning */}
      {!session.emailVerified && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-muted p-4">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
          <div className="flex-1">
            <p className="text-sm font-medium">Verify your email to unlock investing</p>
            <p className="text-xs text-muted-foreground">Check your inbox for a verification link.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, icon, color, bg, href }) => (
          <Link key={label} href={href} className="group">
            <Card className="transition-shadow hover:shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("mt-1 text-2xl font-bold", color)}>{value}</p>
                  </div>
                  <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg", bg, color)}>
                    {icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent investments */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Investments</h2>
            <Link href="/dashboard/investments" className={cn(buttonVariants({ size: "xs", variant: "ghost" }))}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          {recentInvestments.length > 0 ? (
            <div className="space-y-2">
              {recentInvestments.map((inv) => (
                <div key={inv.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv.project.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleDateString("en-BD", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="ml-3 flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold">৳{Number(inv.amountBdt).toLocaleString()}</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", INV_STATUS_COLORS[inv.status] ?? "bg-muted text-muted-foreground")}>
                      {INV_STATUS_LABELS[inv.status] ?? inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-muted-foreground">No investments yet.</p>
              <Link href="/projects" className={cn(buttonVariants({ size: "sm" }), "mt-3")}>
                Browse Projects
              </Link>
            </div>
          )}
        </div>

        {/* Project updates */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Project Updates</h2>
            <Link href="/dashboard/projects" className={cn(buttonVariants({ size: "xs", variant: "ghost" }))}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </div>
          {recentUpdates.length > 0 ? (
            <div className="space-y-2">
              {recentUpdates.map((u) => (
                <Link
                  key={u.id}
                  href={`/projects/${u.project.slug}`}
                  className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/30"
                >
                  <Bell className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{u.title}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-xs text-muted-foreground truncate">{u.project.title}</span>
                      <Badge variant="secondary" className="text-[10px] shrink-0">
                        {UPDATE_TYPE_LABELS[u.type] ?? u.type}
                      </Badge>
                    </div>
                  </div>
                  {u.publishedAt && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {new Date(u.publishedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-10 text-center">
              <p className="text-sm text-muted-foreground">No updates from your projects yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
