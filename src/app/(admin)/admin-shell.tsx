"use client";

import {
  LayoutDashboard, FolderKanban, Users, BarChart3, Settings,
  ShieldCheck, TrendingUp, CreditCard, ArrowDownToLine,
  Bell, ScrollText, FileText, UserCheck, PieChart, Building2, Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DashboardFrame, type FrameNavGroup } from "@/components/layout/dashboard-frame";

// permission: null means visible to all staff
type NavItem = { href: string; label: string; icon: LucideIcon; permission: string | null; exact?: boolean; badgeHref?: string };

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Overview",
    items: [
      { href: "/admin",         label: "Dashboard", icon: LayoutDashboard, exact: true, permission: null },
      { href: "/admin/reports", label: "Reports",   icon: BarChart3,        permission: "report.view" },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users",     label: "Users",       icon: Users,       permission: "user.view" },
      { href: "/admin/investors", label: "Investors",   icon: UserCheck,   permission: "investment.view" },
      { href: "/admin/kyc",       label: "KYC Reviews", icon: ShieldCheck, permission: "kyc.view", badgeHref: "/admin/kyc" },
    ],
  },
  {
    label: "Projects",
    items: [
      { href: "/admin/projects", label: "Projects", icon: FolderKanban, permission: "project.view" },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/investments",   label: "Investments",  icon: TrendingUp,      permission: "investment.view" },
      { href: "/admin/groups",        label: "Group Invest", icon: Building2,       permission: "investment.view" },
      { href: "/admin/payments",      label: "Payments",     icon: CreditCard,      permission: "payment.view",   badgeHref: "/admin/payments/manual" },
      { href: "/admin/withdrawals",   label: "Withdrawals",  icon: ArrowDownToLine, permission: "withdrawal.view" },
      { href: "/admin/distributions", label: "Distributions",icon: PieChart,        permission: "distribution.view" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications",   icon: Bell,       permission: null },
      { href: "/admin/documents",     label: "Documents",       icon: FileText,   permission: "document.view" },
      { href: "/admin/audit-logs",    label: "Audit Logs",      icon: ScrollText, permission: "audit.view" },
      { href: "/admin/settings/bank-accounts", label: "Bank Accounts", icon: Landmark, permission: "project.update" },
      { href: "/admin/settings",      label: "Configuration",   icon: Settings,   permission: "audit.view" },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FINANCE_OFFICER: "Finance Officer",
  PROJECT_MANAGER: "Project Manager",
  KYC_OFFICER: "KYC Officer",
  SUPPORT: "Support",
};

type Props = {
  children: React.ReactNode;
  name: string;
  role: string;
  initials: string;
  userPermissions: string[];
  badges?: Record<string, number>;
};

export function AdminShell({ children, name, role, initials, userPermissions, badges = {} }: Props) {
  const hasPermission = (permission: string | null) =>
    permission === null || userPermissions.includes("*") || userPermissions.includes(permission);

  const groups: FrameNavGroup[] = NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items
      .filter((item) => hasPermission(item.permission))
      .map(({ href, label, icon, exact, badgeHref }) => ({
        href,
        label,
        icon,
        exact,
        badge: badgeHref ? badges[badgeHref] ?? 0 : 0,
      })),
  })).filter((group) => group.items.length > 0);

  const roleLabel = ROLE_LABELS[role] ?? role;

  return (
    <DashboardFrame
      groups={groups}
      consoleLabel="Admin Console"
      user={{ name, subtitle: roleLabel, initials, roleLabel }}
      notificationsHref="/admin/notifications"
    >
      {children}
    </DashboardFrame>
  );
}
