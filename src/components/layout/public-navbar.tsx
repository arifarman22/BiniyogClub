"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Menu, X, ChevronRight } from "lucide-react";
import { cn } from "cn";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/server/actions/auth.actions";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/projects", label: "Projects" },
  { href: "/groups", label: "Groups" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/updates", label: "Updates" },
  { href: "/about", label: "About" },
];

export function PublicNavbar({ session }: { session: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isHome = pathname === "/";
  const transparent = isHome && !scrolled && !open;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300",
        transparent
          ? "border-b border-transparent bg-white/80 backdrop-blur-sm"
          : "border-b border-border/60 bg-background/95 backdrop-blur-md shadow-sm",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <div className="relative h-10 w-32 overflow-hidden group-hover:opacity-90 transition-opacity">
            <Image src="/logo.png" alt="Biniyog Club" fill className="object-contain object-left" priority />
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-primary bg-primary/8"
                    : transparent
                      ? "text-foreground hover:text-primary hover:bg-muted/60"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-2 md:flex">
          {session ? (
            <>
              <Link
                href="/dashboard"
                className="rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5"
              >
                Dashboard
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className={cn(
                    "rounded-full border px-4 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5",
                    transparent
                      ? "border-border text-foreground hover:text-primary hover:bg-muted/60"
                      : "border-border text-muted-foreground hover:text-foreground hover:bg-muted/60",
                  )}
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all hover:-translate-y-0.5",
                  transparent ? "text-foreground hover:text-primary" : "text-muted-foreground hover:text-foreground",
                )}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-white shadow-sm shadow-primary/20 transition-all hover:bg-brand-400 hover:-translate-y-0.5"
              >
                Start Investing <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className={cn(
            "rounded-lg p-2 transition-colors md:hidden",
            transparent ? "text-foreground hover:text-primary" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="border-t border-border/60 bg-background/98 backdrop-blur-md px-4 pb-5 md:hidden">
          <nav className="flex flex-col gap-0.5 pt-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
            {session ? (
              <>
                <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground text-center">
                  Dashboard
                </Link>
                <form action={logoutAction}>
                  <button type="submit" className="w-full rounded-full border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground">
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setOpen(false)} className="rounded-full border border-border px-4 py-2.5 text-sm font-medium text-center text-muted-foreground hover:text-foreground">
                  Sign In
                </Link>
                <Link href="/auth/register" onClick={() => setOpen(false)} className="rounded-full bg-harvest-500 px-4 py-2.5 text-sm font-semibold text-white text-center">
                  Start Investing
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
