"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "cn";
import {
  Menu, X,
  LayoutDashboard, TrendingUp, FolderOpen, PieChart,
  FileText, Bell, User, ShieldCheck, Building2, ExternalLink, BarChart3,
} from "lucide-react";

const NAV = [
  { href: "/dashboard",               label: "Overview",      icon: LayoutDashboard, exact: true },
  { href: "/dashboard/investments",   label: "Investments",   icon: TrendingUp },
  { href: "/dashboard/groups",        label: "Group Invest",  icon: Building2 },
  { href: "/dashboard/projects",      label: "My Projects",   icon: FolderOpen },
  { href: "/dashboard/portfolio",     label: "Portfolio",     icon: PieChart },
  { href: "/dashboard/documents",     label: "Documents",     icon: FileText },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile",       label: "Profile",       icon: User },
  { href: "/dashboard/kyc",           label: "KYC",           icon: ShieldCheck },
];

export function MobileSidebar({ initials, name, email }: { initials: string; name: string; email: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(0,0,0,0.6)" }}
          />

          {/* Drawer */}
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            width: "280px",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            borderRight: "1px solid var(--sidebar-border)",
            backgroundColor: "var(--sidebar)",
            boxShadow: "4px 0 24px rgba(0,0,0,0.3)",
          }}>
            {/* Header */}
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-sidebar-border px-5">
              <div className="flex items-center gap-2.5">
                <Image src="/Biniyog Club Logo Icon PNG.png" alt="Biniyog Club" width={28} height={28} className="h-7 w-7 rounded-md object-contain" />
                <span className="text-sm font-bold text-sidebar-foreground">
                  Biniyog <span className="text-sidebar-primary">Club</span>
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 pt-4">
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-sidebar-foreground/30">
                Menu
              </p>
              {NAV.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-sidebar-primary text-sidebar-primary-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="shrink-0 border-t border-sidebar-border p-3 space-y-1">
              <div className="flex items-center gap-2.5 rounded-xl px-3 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-sidebar-foreground">{name}</p>
                  <p className="truncate text-[10px] text-sidebar-foreground/40">{email}</p>
                </div>
              </div>
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Back to site
              </Link>
            </div>
          </div>
        </>
      )}
    </>
  );
}
