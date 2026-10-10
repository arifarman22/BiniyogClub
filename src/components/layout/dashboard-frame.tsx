"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Bell, ChevronLeft, ChevronDown, Home, LogOut, Menu, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/server/actions/auth.actions";

export type FrameNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
  dot?: "success" | "warning" | "danger";
};

export type FrameNavGroup = { label: string; items: FrameNavItem[] };

interface DashboardFrameProps {
  groups: FrameNavGroup[];
  consoleLabel: string;
  user: { name: string; subtitle: string; initials: string; avatarUrl?: string | null; roleLabel?: string };
  notificationsHref: string;
  profileHref?: string;
  /** Rendered under the top bar on every page (e.g. KYC reminders). */
  banner?: ReactNode;
  /** Rendered above the user card in the expanded sidebar. */
  sidebarCta?: ReactNode;
  children: ReactNode;
}

const DOT_COLORS = { success: "bg-emerald-400", warning: "bg-amber-400", danger: "bg-red-400" };

const noopSubscribe = () => () => {};

function greetingFor(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Avatar({ user, size = 36 }: { user: DashboardFrameProps["user"]; size?: number }) {
  return (
    <span
      style={{ width: size, height: size }}
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white ring-2 ring-white/10"
    >
      {user.avatarUrl ? (
        <Image src={user.avatarUrl} alt={user.name} width={size} height={size} className="h-full w-full object-cover" />
      ) : (
        user.initials
      )}
    </span>
  );
}

export function DashboardFrame({
  groups,
  consoleLabel,
  user,
  notificationsHref,
  profileHref,
  banner,
  sidebarCta,
  children,
}: DashboardFrameProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Time-of-day greeting from the viewer's clock; the server renders a neutral fallback.
  const greeting = useSyncExternalStore(
    noopSubscribe,
    () => greetingFor(new Date().getHours()),
    () => "Welcome back",
  );

  // Close menus when the route changes (state reset during render, not in an effect)
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMobileOpen(false);
    setMenuOpen(false);
  }

  // Lock page scroll while the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close the account menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  // Most specific match wins, so /admin/settings/bank-accounts doesn't also light up /admin/settings
  const allItems = groups.flatMap((g) => g.items);
  const activeHref = allItems
    .filter((i) => (i.exact ? pathname === i.href : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const activeLabel = allItems.find((i) => i.href === activeHref)?.label ?? consoleLabel;

  const sidebar = (mini: boolean) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className={cn("flex h-16 shrink-0 items-center gap-3 px-5", mini && "justify-center px-0")}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06] ring-1 ring-white/10">
          <Image src="/Biniyog Club Logo Icon PNG.png" alt="Biniyog Club" width={24} height={24} className="h-6 w-6 object-contain" />
        </span>
        {!mini && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-white">Biniyog Club</p>
            <p className="truncate text-[11px] font-medium text-sidebar-primary">{consoleLabel}</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav aria-label="Dashboard" className={cn("flex-1 space-y-6 overflow-y-auto px-3 pb-4 pt-2", mini && "px-2")}>
        {groups.map((group) => (
          <div key={group.label}>
            {mini ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            ) : (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">{group.label}</p>
            )}
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, badge, dot }) => {
                const active = href === activeHref;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      title={mini ? label : undefined}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all",
                        mini && "justify-center px-0 py-2.5",
                        active
                          ? "bg-gradient-to-r from-emerald-500/20 to-emerald-500/[0.04] text-white shadow-[inset_0_0_0_1px_rgba(52,211,153,0.15)]"
                          : "text-white/60 hover:bg-white/[0.05] hover:text-white",
                      )}
                    >
                      {active && !mini && (
                        <span className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-emerald-400" aria-hidden="true" />
                      )}
                      <Icon
                        className={cn(
                          "h-[18px] w-[18px] shrink-0 transition-colors",
                          active ? "text-emerald-300" : "text-white/45 group-hover:text-white/80",
                        )}
                      />
                      {!mini && <span className="flex-1 truncate">{label}</span>}
                      {!mini && !!badge && (
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                      {!mini && dot && !badge && <span className={cn("h-2 w-2 rounded-full", DOT_COLORS[dot])} />}
                      {mini && (!!badge || dot) && (
                        <span
                          className={cn(
                            "absolute right-2 top-1.5 h-2 w-2 rounded-full ring-2 ring-sidebar",
                            badge ? "bg-red-500" : DOT_COLORS[dot!],
                          )}
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {!mini && sidebarCta && <div className="px-3 pb-3">{sidebarCta}</div>}

      {/* User */}
      <div className={cn("shrink-0 border-t border-white/[0.06] p-3", mini && "px-2")}>
        <div className={cn("flex items-center gap-3 rounded-xl p-2", mini && "justify-center p-1")}>
          <Avatar user={user} />
          {!mini && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold text-white">{user.name}</p>
              <p className="truncate text-[11px] text-white/45">{user.subtitle}</p>
            </div>
          )}
        </div>
        <div className={cn("mt-1 grid gap-1", mini ? "grid-cols-1" : "grid-cols-2")}>
          <Link
            href="/"
            title="Back to site"
            className="flex items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium text-white/50 transition-colors hover:bg-white/[0.05] hover:text-white"
          >
            <Home className="h-3.5 w-3.5" />
            {!mini && "Website"}
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              title="Sign out"
              className="flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-[11px] font-medium text-white/50 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-3.5 w-3.5" />
              {!mini && "Sign out"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[oklch(0.975_0.004_170)] dark:bg-background">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 border-r border-sidebar-border transition-[width] duration-300 lg:block",
          collapsed ? "w-[76px]" : "w-64",
        )}
      >
        {sidebar(collapsed)}
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors hover:text-foreground"
        >
          <ChevronLeft className={cn("h-3.5 w-3.5 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 shadow-2xl transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
      >
        {sidebar(false)}
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-background/75 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground hover:text-foreground lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[11px] font-medium text-muted-foreground sm:block">
                {greeting}, {user.name.split(" ")[0]}
              </p>
              <p className="truncate text-base font-semibold leading-tight tracking-tight text-foreground sm:text-lg">{activeLabel}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user.roleLabel && (
              <span className="hidden rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary md:inline-flex">
                {user.roleLabel}
              </span>
            )}
            <Link
              href={notificationsHref}
              aria-label="Notifications"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </Link>

            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                className="flex items-center gap-2 rounded-xl border border-border bg-card py-1 pl-1 pr-2 transition-colors hover:border-primary/40"
              >
                <Avatar user={user} size={28} />
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", menuOpen && "rotate-180")} />
              </button>
              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl shadow-slate-900/10 animate-in-up"
                >
                  <div className="flex items-center gap-3 border-b border-border bg-muted/40 px-4 py-3.5">
                    <Avatar user={user} size={36} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.subtitle}</p>
                    </div>
                  </div>
                  <div className="p-1.5">
                    {profileHref && (
                      <Link
                        role="menuitem"
                        href={profileHref}
                        className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted"
                      >
                        <User className="h-4 w-4 text-muted-foreground" /> Profile
                      </Link>
                    )}
                    <Link role="menuitem" href="/" className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm hover:bg-muted">
                      <Home className="h-4 w-4 text-muted-foreground" /> Back to website
                    </Link>
                    <form action={logoutAction}>
                      <button
                        role="menuitem"
                        type="submit"
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {banner}

        <main className="dash-content mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
