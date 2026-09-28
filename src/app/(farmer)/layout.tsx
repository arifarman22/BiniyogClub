import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  LayoutDashboard, FolderOpen, Tractor, Sprout, Activity,
  Receipt, Eye, Wheat, ShoppingCart, FileText, User, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/farmer",              label: "Dashboard",    icon: LayoutDashboard, exact: true },
  { href: "/farmer/projects",     label: "Projects",     icon: FolderOpen },
  { href: "/farmer/farms",        label: "Farms",        icon: Tractor },
  { href: "/farmer/activities",   label: "Crop Cycles",  icon: Sprout },
  { href: "/farmer/expenses",     label: "Expenses",     icon: Receipt },
  { href: "/farmer/field-visits", label: "Field Visits", icon: Eye },
  { href: "/farmer/harvest",      label: "Harvest",      icon: Wheat },
  { href: "/farmer/sales",        label: "Sales",        icon: ShoppingCart },
  { href: "/farmer/documents",    label: "Documents",    icon: FileText },
  { href: "/farmer/profile",      label: "Profile",      icon: User },
];

export default async function FarmerLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/auth/login?callbackUrl=/farmer");
  if (session.role !== "FARMER") redirect("/unauthorized");

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
            Biniyog <span className="text-sidebar-primary">Farmer</span>
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2 pt-3">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
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
          <span className="text-sm font-semibold">Farmer Portal</span>
          <span className="text-xs text-muted-foreground">{session.name}</span>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
