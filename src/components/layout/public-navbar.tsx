"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";
import { cn } from "cn";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/server/actions/auth.actions";

const NAV_LINKS = [
  { href: "/projects", label: "Projects" },
  { href: "/groups", label: "Groups" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/updates", label: "Updates" },
  { href: "/about", label: "About" },
];

export function PublicNavbar({ session }: { session: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 font-bold text-lg">
          <Image
            src="/Biniyog Club Logo Icon PNG.png"
            alt="Biniyog Club"
            width={32}
            height={32}
            className="h-8 w-8 rounded-lg object-contain"
            priority
          />
          <span className="text-foreground">
            Biniyog<span className="text-primary"> Club</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === link.href || pathname.startsWith(link.href + "/")
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <ButtonLink href="/dashboard" size="sm">Dashboard</ButtonLink>
              <form action={logoutAction}>
                <button type="submit" className="btn-arc group/button relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background px-4 h-8 text-[0.8rem] font-medium whitespace-nowrap transition-all hover:bg-muted hover:-translate-y-0.5">
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/auth/login" variant="ghost" size="sm">Sign In</ButtonLink>
              <ButtonLink href="/auth/register" size="sm">Start Investing</ButtonLink>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="rounded-md p-2 text-muted-foreground hover:text-foreground md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border bg-background px-4 pb-4 md:hidden">
          <nav className="flex flex-col gap-1 pt-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                  pathname === link.href ? "text-primary bg-secondary" : "text-muted-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3">
            {session ? (
              <>
                <ButtonLink href="/dashboard" size="sm" onClick={() => setOpen(false)}>Dashboard</ButtonLink>
                <form action={logoutAction}>
                  <button type="submit" className="btn-arc group/button relative inline-flex w-full shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-background px-4 h-8 text-[0.8rem] font-medium whitespace-nowrap transition-all hover:bg-muted">
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <ButtonLink href="/auth/login" variant="outline" size="sm" onClick={() => setOpen(false)}>Sign In</ButtonLink>
                <ButtonLink href="/auth/register" size="sm" onClick={() => setOpen(false)}>Start Investing</ButtonLink>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
