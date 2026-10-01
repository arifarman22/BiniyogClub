"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, FolderKanban, Users, BarChart3, Settings,
  LogOut, ShieldCheck, TrendingUp, CreditCard, ArrowDownToLine,
  Bell, ScrollText, FileText, UserCheck, PieChart, Home,
  Building2, ChevronLeft, Menu, X,
} from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin",         label: "Dashboard", icon: LayoutDashboard, exact: true, roles: [] },
      { href: "/admin/reports", label: "Reports",   icon: BarChart3,        roles: [] },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users",     label: "Users",       icon: Users,      roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/admin/investors", label: "Investors",   icon: UserCheck,  roles: ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER"] },
      { href: "/admin/kyc",       label: "KYC Reviews", icon: ShieldCheck, roles: ["SUPER_ADMIN", "ADMIN", "KYC_OFFICER"] },
    ],
  },
  {
    label: "Projects",
    items: [
      { href: "/admin/projects", label: "Projects", icon: FolderKanban, roles: ["SUPER_ADMIN", "ADMIN", "PROJECT_MANAGER", "FINANCE_OFFICER"] },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/investments",  label: "Investments",  icon: TrendingUp,      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER"] },
      { href: "/admin/groups",       label: "Group Invest", icon: Building2,       roles: ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER"] },
      { href: "/admin/payments",     label: "Payments",     icon: CreditCard,      roles: ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER"] },
      { href: "/admin/withdrawals",  label: "Withdrawals",  icon: ArrowDownToLine, roles: ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER"] },
      { href: "/admin/distributions",label: "Distributions",icon: PieChart,        roles: ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER"] },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell,      roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/admin/documents",     label: "Documents",     icon: FileText,  roles: ["SUPER_ADMIN", "ADMIN", "FINANCE_OFFICER", "PROJECT_MANAGER", "KYC_OFFICER"] },
      { href: "/admin/audit-logs",    label: "Audit Logs",    icon: ScrollText, roles: ["SUPER_ADMIN", "ADMIN"] },
      { href: "/admin/settings",      label: "Settings",      icon: Settings,  roles: ["SUPER_ADMIN", "ADMIN"] },
    ],
  },
];

// roles: [] means visible to all staff

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  FINANCE_OFFICER: "Finance Officer",
  PROJECT_MANAGER: "Project Manager",
  KYC_OFFICER: "KYC Officer",
  SUPPORT: "Support",
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: "bg-destructive/10 text-destructive",
  ADMIN: "bg-primary/10 text-primary",
  FINANCE_OFFICER: "bg-finance-100 text-finance-600",
  PROJECT_MANAGER: "bg-brand-100 text-brand-700",
  KYC_OFFICER: "bg-success/10 text-success",
  SUPPORT: "bg-muted text-muted-foreground",
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

type Props = {
  children: React.ReactNode;
  name: string;
  role: string;
  initials: string;
};

export function AdminShell({ children, name, role, initials }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const sidebarWidth = collapsed ? 64 : 224;

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  const SidebarContent = ({ mini }: { mini: boolean }) => {
    const visibleGroups = NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.length === 0 || item.roles.includes(role)),
    })).filter((group) => group.items.length > 0);
    return (
    <>
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
        <Image
          src="/Biniyog Club Logo Icon PNG.png"
          alt="Biniyog Club"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 rounded-md object-contain"
        />
        {!mini && (
          <span className="text-sm font-semibold text-sidebar-foreground">
            Biniyog <span className="text-sidebar-primary">Admin</span>
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2 pt-3 space-y-4">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {!mini && (
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <Link
                    key={href}
                    href={href}
                    title={mini ? label : undefined}
                    className={`flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    } ${mini ? "justify-center px-0" : ""}`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!mini && label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="shrink-0 border-t border-sidebar-border p-3 space-y-0.5">
        {!mini && (
          <div className="mb-2 px-3 py-1">
            <p className="text-xs font-medium text-sidebar-foreground truncate">{name}</p>
            <p className="text-[10px] text-sidebar-foreground/50">{ROLE_LABELS[role] ?? role}</p>
          </div>
        )}
        <Link
          href="/"
          title={mini ? "Back to site" : undefined}
          className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${mini ? "justify-center px-0" : ""}`}
        >
          <Home className="h-3.5 w-3.5 shrink-0" />
          {!mini && "Back to site"}
        </Link>
        <form action={logoutAction}>
          <button
            type="submit"
            title={mini ? "Sign out" : undefined}
            className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground ${mini ? "justify-center px-0" : ""}`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {!mini && "Sign out"}
          </button>
        </form>
      </div>
    </>
    );
  };

  return (
    <div className="flex min-h-screen bg-muted/30">

      {/* ── Desktop sidebar ── */}
      {!isMobile && (
        <aside
          style={{ width: sidebarWidth }}
          className="relative hidden lg:flex flex-col shrink-0 border-r border-border bg-sidebar transition-all duration-200"
        >
          <SidebarContent mini={collapsed} />

          {/* Collapse toggle */}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="absolute -right-3 top-[4.5rem] z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background shadow-sm hover:bg-muted transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={`h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </aside>
      )}

      {/* ── Mobile drawer backdrop ── */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ── */}
      {isMobile && (
        <aside
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: 224,
            zIndex: 50,
            transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.2s ease",
          }}
          className="flex flex-col border-r border-border bg-sidebar"
        >
          <SidebarContent mini={false} />
        </aside>
      )}

      {/* ── Main content ── */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 sm:px-6">

          {/* Left */}
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-muted transition-colors"
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            )}
            <span className="text-sm font-semibold text-muted-foreground lg:block hidden">
              Good {getGreeting()},{" "}
              <span className="font-bold text-foreground">{name.split(" ")[0]}</span> 👋
            </span>
            <span className="text-sm font-semibold lg:hidden">Biniyog Admin</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3">
            <span className={`hidden rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline-flex ${ROLE_COLORS[role] ?? "bg-muted text-muted-foreground"}`}>
              {ROLE_LABELS[role] ?? role}
            </span>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
