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
} from "lucide-react";
import { cn } from "cn";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import type { SessionUser } from "@/lib/auth/session";
import { logoutAction } from "@/server/actions/auth.actions";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/projects", label: "Projects" },
  { href: "/groups", label: "Business Groups" },
  { href: "/faq", label: "FAQ" },
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      {/* ── 1. Upper Stripe Header with Contact Information ── */}
      <div className="bg-[#030b07] text-slate-300 border-b border-emerald-500/15 text-[11px] font-normal transition-all duration-300">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left info (Headquarters Location & Support Schedule) */}
          <div className="flex min-w-0 items-center gap-4 text-slate-300">
            <span className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition-colors">
              <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>MG SAM Center, 12 Mohakhali C/A, Dhaka-1212</span>
            </span>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-slate-400">
              <span className="h-1 w-1 rounded-full bg-emerald-500" />
              <Clock className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>Sat–Thu: 9:00 AM – 6:00 PM BST</span>
            </span>
            {/* Mobile city preview */}
            <span className="hidden min-[420px]:inline-flex sm:hidden items-center gap-1.5 text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Dhaka, Bangladesh</span>
            </span>
          </div>

          {/* Right info (Helpline, Email, Security) */}
          <div className="flex shrink-0 items-center gap-3 sm:gap-4 text-xs font-normal">
            <a
              href="tel:+8801335149033"
              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-emerald-300 transition-colors"
            >
              <Phone className="h-3 w-3 text-emerald-400 shrink-0" />
              <span className="font-semibold text-[11px]">+880 1335-149033</span>
            </a>

            <span className="hidden md:inline text-emerald-950">|</span>

            <a
              href="mailto:info@biniyogclub.com"
              className="hidden sm:inline-flex items-center gap-1.5 text-slate-300 hover:text-emerald-300 transition-colors text-[11px]"
            >
              <Mail className="h-3 w-3 text-emerald-400 shrink-0" />
              <span>info@biniyogclub.com</span>
            </a>

            <span className="hidden xl:inline text-emerald-950">|</span>

            <span className="hidden xl:inline-flex items-center gap-1.5 text-emerald-400 text-[11px] font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Contract Act 1872 • 100% Escrow Segregated</span>
            </span>

            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* ── 2. Main Navigation Bar ── */}
      <div
        className={cn(
          "transition-all duration-300",
          scrolled
            ? "border-b border-gray-200 bg-white shadow-sm"
            : "border-b border-gray-100 bg-white shadow-sm"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center group">
            <div className="relative h-10 w-36 overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/logo.png"
                alt="Biniyog Club"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 lg:gap-2 md:flex">
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
                    "rounded-none px-3.5 py-1.5 text-xs lg:text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold"
                      : "text-slate-700 hover:text-emerald-700 hover:bg-emerald-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden items-center gap-3 md:flex">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-none bg-emerald-600 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition-all hover:bg-emerald-500 hover:-translate-y-0.5"
                >
                  Dashboard
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="rounded-none border border-gray-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-emerald-700 hover:border-emerald-200 transition-all"
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="rounded-none border border-gray-200 bg-white px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 hover:text-emerald-700 hover:border-emerald-200 transition-all hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-1.5 rounded-none bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 transition-all duration-200 hover:shadow-emerald-500/50 hover:from-emerald-400 hover:to-teal-400 hover:-translate-y-0.5 active:translate-y-0"
                >
                  Get Started <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            className="rounded-none p-2 text-slate-700 hover:bg-gray-100 transition-colors md:hidden border border-gray-200"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* ── 3. Mobile Navigation Drawer (Consistent Dark Slate/Emerald Theme) ── */}
      {open && (
        <div className="border-b border-emerald-500/30 bg-slate-950/98 backdrop-blur-2xl px-4 pt-3 pb-6 md:hidden shadow-2xl animate-in slide-in-from-top-2 duration-200 text-white">
          <nav className="flex flex-col gap-1.5">
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
                    "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold"
                      : "text-slate-200 hover:text-white hover:bg-white/10"
                  )}
                >
                  <span>{link.label}</span>
                  {active ? (
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Mobile Contact Quick Card */}
          <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-slate-200">
            <p className="font-semibold text-emerald-300 flex items-center gap-1.5 mb-1.5">
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>Direct Investor Helpline</span>
            </p>
            <div className="flex items-center justify-between">
              <a href="tel:+8801335149033" className="font-bold text-white text-sm">
                +880 1335-149033
              </a>
              <a href="mailto:info@biniyogclub.com" className="text-xs text-emerald-400 underline">
                info@biniyogclub.com
              </a>
            </div>
          </div>

          {/* Mobile Auth Actions */}
          <div className="mt-4 flex flex-col gap-2.5 border-t border-white/10 pt-4">
            {session ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setOpen(false)}
                  className="rounded-none bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white text-center shadow-md shadow-emerald-600/30"
                >
                  Go to Dashboard
                </Link>
                <form action={logoutAction}>
                  <button
                    type="submit"
                    className="w-full rounded-none border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/10"
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
                  className="rounded-none border border-white/20 px-4 py-2.5 text-sm font-medium text-center text-slate-200 hover:bg-white/10"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="rounded-none bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-2.5 text-sm font-semibold text-white text-center shadow-lg shadow-emerald-600/30"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
