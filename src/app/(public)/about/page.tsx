import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Target,
  Eye,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
} from "lucide-react";

export const metadata: Metadata = {
  title: "About Us — Pioneering Direct Investment | Biniyog Club",
  description:
    "Discover Biniyog Club — Bangladesh's premier direct investment ecosystem connecting verified business groups with retail and corporate co-investors.",
  openGraph: {
    title: "About Biniyog Club",
    description: "Our mission, institutional values, and commitment to transparent direct investment in Bangladesh.",
  },
};

const VALUES = [
  {
    icon: "/icons/search-engine.png",
    title: "Radical Transparency",
    desc: "Every transaction, legal contract, and financial distribution is tracked in our immutable double-entry ledger with zero hidden charges.",
  },
  {
    icon: "/icons/investment.png",
    title: "Asset-Backed Due Diligence",
    desc: "We prioritize tangible business assets, audited bank records, and physical site verification before approving any business group listing.",
  },
  {
    icon: "/icons/user.png",
    title: "Enforceable Legal Deeds",
    desc: "Every co-investment is structured with an individualized digital contract registered and legally binding under Bangladesh Contract Act.",
  },
  {
    icon: "/icons/income.png",
    title: "On-Time Return Payouts",
    desc: "Our rigorous escrow allocation and repayment enforcement have maintained a 100% on-time payout record for our community.",
  },
];

const MILESTONES = [
  {
    year: "2023",
    tag: "FOUNDATION",
    title: "Legal Framework & Platform Inception",
    desc: "Founded in Dhaka with the ambition of bridging the SME capital deficit through legally protected digital syndicates.",
  },
  {
    year: "2024",
    tag: "PILOT LAUNCH",
    title: "First Syndicate Cohort & ৳1 Cr Disbursed",
    desc: "Successfully closed initial co-investment rounds for vetted local enterprises with 100% on-time return realization.",
  },
  {
    year: "2025",
    tag: "EXPANSION",
    title: "Institutional Business Groups & Tiers",
    desc: "Structured multi-tier institutional business group portfolios, enabling co-investors to allocate across diverse commercial sectors.",
  },
  {
    year: "2026",
    tag: "SCALE",
    title: "৳2.5 Cr+ Deployed & Automated Ledgers",
    desc: "Scaled verified co-investor base, automated cryptographic verification, and expanded direct corporate syndicate facilities.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/70 to-slate-950 py-20 lg:py-24 text-white">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-light tracking-widest text-emerald-300 backdrop-blur-md mb-6">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>PIONEERING DIRECT INVESTMENT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Bridging Productive Capital with{" "}
            <span className="font-normal bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Real Economic Growth
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Biniyog Club was established with an uncompromising mission: to give everyday investors secure, direct access to high-yield business investments backed by verified assets and enforceable legal deeds.
          </p>
        </div>
      </section>

      {/* ── 2. Mission, Vision, Approach Bento ── */}
      <section className="relative z-20 -mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-card p-8 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-500/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
              <Target className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-normal sm:font-medium text-foreground mb-3">Our Mission</h2>
            <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
              To democratize direct capital in Bangladesh by eliminating predatory intermediaries and connecting audited enterprises with retail and institutional co-investors.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-card p-8 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-500/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
              <Eye className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-normal sm:font-medium text-foreground mb-3">Our Vision</h2>
            <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
              A modern Bangladesh financial landscape where every sound business can raise expansion capital swiftly, and every citizen can earn predictable returns with complete confidence.
            </p>
          </div>

          <div className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-card p-8 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-500/40">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-6">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-normal sm:font-medium text-foreground mb-3">Legal Enforceability</h2>
            <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
              Every investment instrument on our platform is bound under Bangladesh Contract Act, backed by corporate guarantees, collateral covenants, and verified identity verification.
            </p>
          </div>
        </div>
      </section>

      {/* ── 3. Core Values with Flaticons ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <span>UNCOMPROMISING PRINCIPLES</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              The Pillars that Define Biniyog Club
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
              Our operating standards reflect our deep commitment to our co-investors and enterprise partners.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {VALUES.map((val) => (
              <div
                key={val.title}
                className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10"
              >
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm mb-4 transition-transform duration-300 group-hover:scale-110">
                    <Image src={val.icon} alt={val.title} width={32} height={32} className="object-contain" />
                  </div>
                  <h3 className="text-base font-normal sm:font-medium text-foreground mb-2">
                    {val.title}
                  </h3>
                  <p className="text-xs font-light text-muted-foreground leading-relaxed">
                    {val.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                  <span className="text-[11px] font-light text-muted-foreground">Certified Protocol</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Milestone Roadmap ── */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50/80 via-emerald-50/20 to-slate-50/50 dark:from-slate-950 dark:via-emerald-950/15 dark:to-slate-900/30 border-y border-border/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <span>TRACK RECORD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Our Journey of Rapid Growth
            </h2>
          </div>

          <div className="space-y-6">
            {MILESTONES.map((item) => (
              <div
                key={item.year}
                className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <span className="text-2xl sm:text-3xl font-light tracking-tight text-emerald-600 dark:text-emerald-400 min-w-[70px]">
                    {item.year}
                  </span>
                  <div>
                    <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-normal text-emerald-600 dark:text-emerald-400 mb-1">
                      {item.tag}
                    </span>
                    <h3 className="text-base font-normal sm:font-medium text-foreground">{item.title}</h3>
                    <p className="text-xs sm:text-sm font-light text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Corporate Presence & Contact Link ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[2.5rem] border border-slate-200/80 dark:border-white/10 bg-card p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light text-emerald-600 dark:text-emerald-400 mb-3">
                <MapPin className="h-3.5 w-3.5" />
                <span>DHAKA HEADQUARTERS</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-foreground">
                Visit Our Corporate Offices
              </h2>
              <p className="mt-3 text-sm font-light text-muted-foreground leading-relaxed">
                Located at MG SAM Center, 12 Mohakhali C/A, Dhaka-1212. Our doors are open for institutional consultations, corporate syndicates, and investor meetings.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3.5 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-normal text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5"
              >
                Schedule a Visit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-8 py-3.5 text-sm font-light text-foreground transition-all hover:border-emerald-500/50"
              >
                Browse Projects
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
