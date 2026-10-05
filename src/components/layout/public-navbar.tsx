"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Menu,
  X,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
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
  { href: "/contact", label: "Contact" },
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
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      {/* ── 1. Upper Stripe Header with Contact Information ── */}
      <div className="bg-[#05110c] text-slate-300 border-b border-emerald-900/30 text-[11px] font-light transition-all duration-300">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left info (Headquarters Location & Support Schedule) */}
          <div className="flex items-center gap-4 text-slate-300">
            <span className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>MG SAM Center, 12 Mohakhali C/A, Dhaka-1212</span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-slate-400">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Sun–Thu: 9:00 AM – 6:00 PM BST</span>
            </span>
            {/* Mobile city preview */}
            <span className="inline-flex sm:hidden items-center gap-1.5 text-emerald-400 font-normal">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dhaka, Bangladesh</span>
            </span>
          </div>

          {/* Right info (Helpline, Email, Security) */}
          <div className="flex items-center gap-3.5 sm:gap-4 text-xs font-light">
            <a
              href="tel:+8801335149033"
              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-emerald-300 transition-colors"
            >
              <Phone className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="font-medium text-[11px]">+880 1335-149033</span>
            </a>

            <span className="hidden md:inline text-slate-700">|</span>

            <a
              href="mailto:info@biniyogclub.com"
              className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 transition-colors text-[11px]"
            >
              <Mail className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>info@biniyogclub.com</span>
            </a>

            <span className="hidden xl:inline text-slate-700">|</span>

            <span className="hidden xl:inline-flex items-center gap-1.5 text-emerald-400 text-[11px]">
              <ShieldCheck className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>100% KYC & Legal Deeds</span>
            </span>
          </div>
        </div>
      </div>

      {/* ── 2. Main Navigation Bar ── */}
      <div
        className={cn(
          "transition-all duration-300",
          transparent
            ? "border-b border-white/10 bg-slate-950/65 backdrop-blur-md shadow-sm"
            : "border-b border-border/70 bg-background/95 backdrop-blur-xl shadow-[0_4px_25px_-4px_rgba(0,140,100,0.08)]"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative h-10 w-32 overflow-hidden group-hover:opacity-90 transition-opacity">
              <Image
                src="/logo.png"
                alt="Biniyog Club"
                fill
                className={cn(
                  "object-contain object-left transition-all",
                  transparent && "brightness-0 invert",
                  "dark:brightness-0 dark:invert"
                )}
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 lg:gap-1.5 md:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all duration-200",
                    active
                      ? transparent
                        ? "text-emerald-300 bg-white/15 font-semibold shadow-sm"
                        : "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 font-semibold shadow-sm"
                      : transparent
                        ? "text-slate-100 hover:text-white hover:bg-white/10"
                        : "text-slate-800 dark:text-slate-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-2.5 md:flex">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs sm:text-sm font-medium text-white shadow-md shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all hover:-translate-y-0.5",
                      transparent
                        ? "border-white/20 text-slate-100 hover:text-white hover:bg-white/10"
                        : "border-slate-300 dark:border-white/15 text-slate-800 dark:text-slate-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
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
                    "rounded-full px-3.5 py-1.5 text-xs sm:text-sm font-medium transition-all hover:-translate-y-0.5",
                    transparent
                      ? "text-slate-100 hover:text-white"
                      : "text-slate-800 dark:text-slate-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs sm:text-sm font-medium text-white shadow-md shadow-emerald-600/25 transition-all duration-200 hover:bg-emerald-700 hover:-translate-y-0.5"
                >
                  Start Investing <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className={cn(
              "rounded-xl p-2 transition-colors md:hidden border border-transparent",
              transparent
                ? "text-white hover:bg-white/10"
                : "text-foreground hover:bg-muted"
            )}
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── 3. Mobile Navigation Drawer ── */}
      {open && (
        <div className="border-b border-border/80 bg-background/98 backdrop-blur-2xl px-4 pt-3 pb-6 md:hidden shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname === link.href || pathname.startsWith(link.href + "/");

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center justify-between rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 font-semibold"
                      : "text-slate-800 dark:text-slate-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  )}
                >
                  <span>{link.label}</span>
                  {active && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Contact Quick Card */}
          <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-slate-700 dark:text-slate-300">
            <p className="font-medium text-foreground flex items-center gap-1.5 mb-1.5">
              <Phone className="h-3 w-3 text-emerald-500" />
              <span>Investor Support Line</span>
            </p>
            <div className="flex items-center justify-between">
              <a href="tel:+8801335149033" className="font-semibold text-emerald-700 dark:text-emerald-400">
                +880 1335-149033
              </a>
              <a href="mailto:info@biniyogclub.com" className="text-[11px] font-medium underline text-slate-600 dark:text-slate-400">
                info@biniyogclub.com
              </a>
            </div>
          </div>

          {/* Mobile Auth Actions */}
          <div className="mt-4 flex flex-col gap-2 border-t border-border/60 pt-4">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white text-center shadow-md shadow-emerald-600/20"
                >
                  Go to Dashboard
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-full border border-slate-300 dark:border-white/15 px-4 py-2 text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-foreground hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-slate-300 dark:border-white/15 px-4 py-2.5 text-sm font-medium text-center text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white text-center shadow-md shadow-emerald-600/20"
                >
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
