"use client";

import { useState } from "react";
import Link from "next/link";
import {
  X, Bell, User, LayoutDashboard, TrendingUp, FolderOpen, PieChart,
  FileText, ShieldCheck, Building2, BarChart3, ShieldAlert, ArrowRight, Clock, RefreshCw, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardFrame, type FrameNavGroup } from "@/components/layout/dashboard-frame";

interface Props {
  initials: string;
  name: string;
  email: string;
  kycStatus: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}

function kycDot(status: string) {
  if (status === "VERIFIED") return "success" as const;
  if (status === "SUBMITTED" || status === "UNDER_REVIEW") return "warning" as const;
  return "danger" as const;
}

export function DashboardShell({ initials, name, email, kycStatus, avatarUrl, children }: Props) {
  const groups: FrameNavGroup[] = [
    {
      label: "Overview",
      items: [
        { href: "/dashboard",           label: "Overview",  icon: LayoutDashboard, exact: true },
        { href: "/dashboard/portfolio", label: "Portfolio", icon: PieChart },
        { href: "/dashboard/reports",   label: "Reports",   icon: BarChart3 },
      ],
    },
    {
      label: "Investing",
      items: [
        { href: "/dashboard/investments", label: "Investments",  icon: TrendingUp },
        { href: "/dashboard/groups",      label: "Group Invest", icon: Building2 },
        { href: "/dashboard/projects",    label: "My Projects",  icon: FolderOpen },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "/dashboard/documents",     label: "Documents",     icon: FileText },
        { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
        { href: "/dashboard/profile",       label: "Profile",       icon: User },
        { href: "/dashboard/kyc",           label: "KYC",           icon: ShieldCheck, dot: kycDot(kycStatus) },
      ],
    },
  ];

  return (
    <DashboardFrame
      groups={groups}
      consoleLabel="Investor Dashboard"
      user={{ name, subtitle: email, initials, avatarUrl }}
      notificationsHref="/dashboard/notifications"
      profileHref="/dashboard/profile"
      banner={kycStatus !== "VERIFIED" ? <KycBanner kycStatus={kycStatus} /> : null}
      sidebarCta={
        <Link
          href="/projects"
          className="group block overflow-hidden rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/20 via-emerald-500/5 to-transparent p-4 transition-colors hover:border-emerald-400/30"
        >
          <Sparkles className="h-4 w-4 text-emerald-300" />
          <p className="mt-2 text-[13px] font-semibold text-white">Explore new projects</p>
          <p className="mt-0.5 text-[11px] leading-snug text-white/50">Vetted opportunities open for investment.</p>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
            Browse now <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      }
    >
      {children}
    </DashboardFrame>
  );
}

const BANNERS: Record<
  string,
  { tone: "danger" | "warning"; icon: typeof ShieldAlert; title: string; body: string; cta: string }
> = {
  NOT_STARTED: {
    tone: "danger",
    icon: ShieldAlert,
    title: "Verify your identity to start investing.",
    body: "Complete KYC verification to unlock investing.",
    cta: "Verify now",
  },
  SUBMITTED: {
    tone: "warning",
    icon: Clock,
    title: "KYC under review.",
    body: "You can invest once our team approves your verification.",
    cta: "View status",
  },
  REJECTED: {
    tone: "danger",
    icon: RefreshCw,
    title: "KYC rejected.",
    body: "Please resubmit your documents to unlock investing.",
    cta: "Resubmit",
  },
  RESUBMISSION_REQUIRED: {
    tone: "warning",
    icon: RefreshCw,
    title: "KYC needs an update.",
    body: "Our team needs corrected or additional documents.",
    cta: "Update KYC",
  },
};
BANNERS.UNDER_REVIEW = BANNERS.SUBMITTED;

function KycBanner({ kycStatus }: { kycStatus: string }) {
  const [dismissed, setDismissed] = useState(false);
  const banner = BANNERS[kycStatus];
  if (dismissed || !banner) return null;
  const Icon = banner.icon;
  const danger = banner.tone === "danger";

  return (
    <div className="px-4 pt-4 sm:px-6 lg:px-8">
      <div
        className={cn(
          "mx-auto flex max-w-[1600px] items-center gap-3 rounded-2xl border px-4 py-3",
          danger ? "border-red-500/20 bg-red-500/[0.06]" : "border-amber-500/25 bg-amber-500/[0.07]",
        )}
      >
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            danger ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/15 text-amber-600 dark:text-amber-400",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <p className="min-w-0 flex-1 text-sm text-foreground">
          <span className="font-semibold">{banner.title}</span>{" "}
          <span className="text-muted-foreground">{banner.body}</span>
        </p>
        <Link
          href="/dashboard/kyc"
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            danger ? "bg-red-600 text-white hover:bg-red-700" : "border border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300",
          )}
        >
          {banner.cta} <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
