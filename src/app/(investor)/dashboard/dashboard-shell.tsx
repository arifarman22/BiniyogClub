"use client";

import Link from "next/link";
import {
  Bell, User, LayoutDashboard, TrendingUp, FolderOpen, PieChart,
  FileText, Building2, BarChart3, ArrowRight, Sparkles,
} from "lucide-react";
import { DashboardFrame, type FrameNavGroup } from "@/components/layout/dashboard-frame";

interface Props {
  initials: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ initials, name, email, avatarUrl, children }: Props) {
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
