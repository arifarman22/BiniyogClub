import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard,
  TrendingUp,
  FolderOpen,
  PieChart,
  Wallet,
  ArrowLeftRight,
  FileText,
  Bell,
  User,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { cn } from "cn";

const NAV = [
  { href: "/dashboard",               label: "Overview",       icon: LayoutDashboard, exact: true },
  { href: "/dashboard/investments",   label: "Investments",    icon: TrendingUp },
  { href: "/dashboard/projects",      label: "My Projects",    icon: FolderOpen },
  { href: "/dashboard/portfolio",     label: "Portfolio",      icon: PieChart },
  { href: "/dashboard/wallet",        label: "Wallet",         icon: Wallet },
  { href: "/dashboard/transactions",  label: "Transactions",   icon: ArrowLeftRight },
  { href: "/dashboard/documents",     label: "Documents",      icon: FileText },
  { href: "/dashboard/notifications", label: "Notifications",  icon: Bell },
  { href: "/dashboard/profile",       label: "Profile",        icon: User },
  { href: "/dashboard/kyc",           label: "KYC",            icon: ShieldCheck },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?callbackUrl=/dashboard");
  if (session.role !== "INVESTOR") redirect("/unauthorized");

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
          <Image
            src="/Biniyog Club Logo Icon PNG.png"
            alt="Biniyog Club"
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-contain"
          />
          <span className="text-sm font-semibold text-sidebar-foreground">
            Biniyog <span className="text-sidebar-primary">Club</span>
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 p-2 pt-3">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-3 py-1">
            <p className="truncate text-xs font-medium text-sidebar-foreground">{session.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50">{session.email}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Back to site
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:hidden">
          <span className="text-sm font-semibold">Investor Dashboard</span>
          <span className="text-xs text-muted-foreground">{session.name}</span>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
