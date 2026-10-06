"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "cn";
import {
  Menu, X, ChevronLeft, Bell, LogOut, User, ExternalLink,
  LayoutDashboard, TrendingUp, FolderOpen, PieChart, Wallet,
  ArrowLeftRight, ArrowDownLeft, FileText, ShieldCheck, Building2, BarChart3,
  ShieldAlert, ArrowRight, Clock, RefreshCw,
} from "lucide-react";
import { logoutAction } from "@/server/actions/auth.actions";

const NAV = [
  { href: "/dashboard",               label: "Overview",      icon: LayoutDashboard, exact: true },
  { href: "/dashboard/investments",   label: "Investments",   icon: TrendingUp },
  { href: "/dashboard/groups",        label: "Group Invest",  icon: Building2 },
  { href: "/dashboard/projects",      label: "My Projects",   icon: FolderOpen },
  { href: "/dashboard/portfolio",     label: "Portfolio",     icon: PieChart },
  { href: "/dashboard/wallet",        label: "Wallet",        icon: Wallet },
  { href: "/dashboard/transactions",  label: "Transactions",  icon: ArrowLeftRight },
  { href: "/dashboard/deposits",      label: "Deposits",      icon: ArrowDownLeft },
  { href: "/dashboard/documents",     label: "Documents",     icon: FileText },
  { href: "/dashboard/reports",        label: "Reports",       icon: BarChart3 },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile",       label: "Profile",       icon: User },
  { href: "/dashboard/kyc",           label: "KYC",           icon: ShieldCheck },
];

interface Props {
  initials: string;
  name: string;
  email: string;
  kycStatus: string;
  avatarUrl: string | null;
  children: React.ReactNode;
}

export function DashboardShell({ initials, name, email, kycStatus, avatarUrl, children }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);       // mobile drawer
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [mobile, setMobile] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Detect mobile
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const handler = (e: MediaQueryList | MediaQueryListEvent) => setMobile(e.matches);
    handler(mq);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock scroll when mobile drawer open
  useEffect(() => {
    document.body.style.overflow = mobile && open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobile, open]);

  const sidebarW = mobile ? 0 : collapsed ? 64 : 240;

  return (
    <div className="min-h-screen bg-muted/30">

      {/* Mobile backdrop */}
      {mobile && open && (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          onClick={() => setOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          zIndex: 50,
          width: mobile ? 280 : collapsed ? 64 : 240,
          transform: mobile && !open ? "translateX(-100%)" : "translateX(0)",
          transition: "width 0.25s ease, transform 0.25s ease",
          display: "flex",
          flexDirection: "column",
          borderRight: "1px solid var(--color-sidebar-border)",
          backgroundColor: "var(--color-sidebar)",
        }}
      >
        {/* Logo row */}
        <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-3"
          style={{ justifyContent: collapsed && !mobile ? "center" : "space-between" }}
        >
          {(!collapsed || mobile) && (
            <div className="flex items-center gap-2 overflow-hidden">
              <Image src="/Biniyog Club Logo Icon PNG.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-md object-contain" />
              <span className="whitespace-nowrap text-sm font-bold text-sidebar-foreground">
                Biniyog <span className="text-sidebar-primary">Club</span>
              </span>
            </div>
          )}
          {collapsed && !mobile && (
            <Image src="/Biniyog Club Logo Icon PNG.png" alt="" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
          )}
          <button
            onClick={() => mobile ? setOpen(false) : setCollapsed(c => !c)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            {mobile
              ? <X className="h-4 w-4" />
              : <ChevronLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
            }
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2 pt-3 space-y-0.5">
          {(!collapsed || mobile) && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
              Menu
            </p>
          )}
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed && !mobile ? label : undefined}
                className={cn(
                  "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  collapsed && !mobile ? "justify-center" : "gap-2.5",
                  active
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {(!collapsed || mobile) && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-sidebar-border p-2 space-y-1">
          {(!collapsed || mobile) ? (
            <>
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground overflow-hidden">
                  {avatarUrl
                    ? <Image src={avatarUrl} alt={name} width={32} height={32} className="h-full w-full object-cover" />
                    : initials
                  }
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-sidebar-foreground">{name}</p>
                  <p className="truncate text-[10px] text-sidebar-foreground/40">{email}</p>
                </div>
              </div>
              <Link href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                <span>Back to site</span>
              </Link>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1 py-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground overflow-hidden" title={name}>
                {avatarUrl
                  ? <Image src={avatarUrl} alt={name} width={32} height={32} className="h-full w-full object-cover" />
                  : initials
                }
              </div>
              <Link href="/" title="Back to site" className="flex h-7 w-7 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent transition-colors">
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div
        style={{
          paddingLeft: sidebarW,
          transition: "padding-left 0.25s ease",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 sm:px-5">
          <div className="flex items-center gap-3">
            {mobile && (
              <button
                onClick={() => setOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
            )}
            {mobile ? (
              <div className="flex items-center gap-2">
                <Image src="/Biniyog Club Logo Icon PNG.png" alt="" width={22} height={22} className="h-5 w-5 rounded object-contain" />
                <span className="text-sm font-bold">Biniyog Club</span>
              </div>
            ) : (
              <p className="text-sm font-medium text-muted-foreground">
                Welcome back, <span className="text-foreground font-semibold">{name.split(" ")[0]}</span> 👋
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/dashboard/notifications" className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
              <Bell className="h-4 w-4" />
            </Link>

            {/* Avatar dropdown */}
            <div className="relative">
              <button
                onClick={() => setAvatarOpen(v => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground overflow-hidden"
              >
                {avatarUrl
                  ? <Image src={avatarUrl} alt={name} width={32} height={32} className="h-full w-full object-cover" />
                  : initials
                }
              </button>
              {avatarOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setAvatarOpen(false)} />
                  <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-border bg-popover shadow-lg">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-xs font-semibold truncate">{name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{email}</p>
                    </div>
                    <div className="p-1.5 space-y-0.5">
                      <Link href="/dashboard/profile" onClick={() => setAvatarOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs hover:bg-muted transition-colors">
                        <User className="h-3.5 w-3.5" /> Profile
                      </Link>
                      <button
                        onClick={() => { setLoggingOut(true); logoutAction(); }}
                        disabled={loggingOut}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        {loggingOut ? "Signing out…" : "Sign out"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* ── KYC notification banner (all pages) ── */}
        {kycStatus !== "VERIFIED" && (
          <KycBanner kycStatus={kycStatus} />
        )}

        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

function KycBanner({ kycStatus }: { kycStatus: string }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  if (kycStatus === "NOT_STARTED") {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <ShieldAlert className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            <span className="font-semibold">You can&apos;t invest without doing the KYC verification.</span>
            {" "}Complete your identity verification to unlock investing.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/kyc"
            className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors"
          >
            Verify Now <ArrowRight className="h-3 w-3" />
          </Link>
          <button onClick={() => setDismissed(true)} className="flex h-6 w-6 items-center justify-center rounded text-destructive/60 hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (kycStatus === "SUBMITTED" || kycStatus === "UNDER_REVIEW") {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-warning/20 bg-warning/5 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <Clock className="h-4 w-4 shrink-0 text-warning" />
          <p className="text-sm">
            <span className="font-semibold">KYC under review.</span>
            {" "}You can&apos;t invest until your verification is approved by our finance team.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/kyc"
            className="flex items-center gap-1 rounded-lg border border-warning/40 px-3 py-1.5 text-xs font-semibold text-warning hover:bg-warning/10 transition-colors"
          >
            View Status <ArrowRight className="h-3 w-3" />
          </Link>
          <button onClick={() => setDismissed(true)} className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (kycStatus === "REJECTED" || kycStatus === "RESUBMISSION_REQUIRED") {
    return (
      <div className="flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/5 px-4 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <RefreshCw className="h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">
            <span className="font-semibold">KYC {kycStatus === "REJECTED" ? "rejected" : "needs update"}.</span>
            {" "}You can&apos;t invest until your KYC is approved. Please resubmit your documents.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/dashboard/kyc"
            className="flex items-center gap-1 rounded-lg bg-destructive px-3 py-1.5 text-xs font-semibold text-white hover:bg-destructive/90 transition-colors"
          >
            Resubmit <ArrowRight className="h-3 w-3" />
          </Link>
          <button onClick={() => setDismissed(true)} className="flex h-6 w-6 items-center justify-center rounded text-destructive/60 hover:text-destructive transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
