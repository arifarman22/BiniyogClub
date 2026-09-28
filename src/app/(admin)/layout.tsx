import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { isStaff } from "@/lib/authz";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, FolderKanban, Users, Sprout, BarChart3, Settings,
  LogOut, ShieldCheck, TrendingUp, CreditCard, ArrowDownToLine, Tractor,
  Eye, Receipt, Wheat, ShoppingCart, FileText, Bell, ScrollText,
  UserCheck, UserCog, PieChart, Home,
} from "lucide-react";
import { cn } from "cn";
import { logoutAction } from "@/server/actions/auth.actions";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/investors", label: "Investors", icon: UserCheck },
      { href: "/admin/farmers", label: "Farmers", icon: Sprout },
      { href: "/admin/kyc", label: "KYC Reviews", icon: ShieldCheck },
    ],
  },
  {
    label: "Projects & Farms",
    items: [
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/farms", label: "Farms", icon: Tractor },
      { href: "/admin/field-visits", label: "Field Visits", icon: Eye },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/expenses", label: "Expenses", icon: Receipt },
      { href: "/admin/harvests", label: "Harvests", icon: Wheat },
      { href: "/admin/sales", label: "Sales", icon: ShoppingCart },
    ],
  },
  {
    label: "Finance",
    items: [
      { href: "/admin/investments", label: "Investments", icon: TrendingUp },
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/withdrawals", label: "Withdrawals", icon: ArrowDownToLine },
      { href: "/admin/distributions", label: "Distributions", icon: PieChart },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/documents", label: "Documents", icon: FileText },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?callbackUrl=/admin");
  if (!isStaff(session.role)) redirect("/unauthorized");

  return (
    <div className="flex min-h-screen bg-muted/30">
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
            Biniyog <span className="text-sidebar-primary">Admin</span>
          </span>
        </div>

        <nav className="flex-1 overflow-y-auto p-2 pt-3 space-y-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-3">
          <div className="mb-2 px-3 py-1">
            <p className="text-xs font-medium text-sidebar-foreground">{session.name}</p>
            <p className="text-[10px] text-sidebar-foreground/50">{session.role.replace(/_/g, " ")}</p>
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          >
            <Home className="h-3.5 w-3.5" />
            Back to site
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-xs text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6 lg:hidden">
          <span className="text-sm font-semibold">Biniyog Admin</span>
          <span className="text-xs text-muted-foreground">{session.name}</span>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
