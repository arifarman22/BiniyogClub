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
  TrendingUp,
  Scale,
  Users,
  BadgeCheck,
  FileText,
  Search,
  Wallet,
  Clock,
  Layers,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

export const metadata: Metadata = {
  title: "About Us — Pioneering Direct Investment | Biniyog Club",
  description:
    "Discover Biniyog Club — Bangladesh's premier direct investment ecosystem connecting verified business groups with retail and corporate co-investors under Bangladesh Contract Act.",
  openGraph: {
    title: "About Biniyog Club | Real Economy Direct Investment",
    description: "Our mission, institutional due diligence process, and commitment to transparent, asset-backed direct investment in Bangladesh.",
  },
};

const STATS = [
  { label: "Capital Deployed", value: "৳2.5 Cr+", sub: "Directly into verified enterprises" },
  { label: "Payout Record", value: "100%", sub: "Zero delayed milestone returns" },
  { label: "Target Yield", value: "14% - 26%", sub: "Annualized projected returns" },
  { label: "Verified Investors", value: "5,000+", sub: "Active co-investment network" },
];

const VALUES = [
  {
    image: "/icons/secure-platform.jpg",
    tag: "RISK MITIGATION",
    title: "Asset-Backed Due Diligence",
    desc: "We perform exhaustive on-site audits, verify physical machinery and inventory, inspect CIB reports, and secure promoter personal guarantees before approving any listing.",
  },
  {
    image: "/icons/transparent-process.jpg",
    tag: "GOVERNANCE",
    title: "Radical Transparency",
    desc: "Every milestone update, audited balance sheet, financial disclosure, and yield calculation is published live with zero hidden platform charges.",
  },
  {
    image: "/icons/modern-technology.jpg",
    tag: "INFRASTRUCTURE",
    title: "Cryptographic Ledger",
    desc: "Our double-entry ledger architecture records every transaction with cryptographic verification, ensuring account balances and distributions are mathematically tamper-proof.",
  },
  {
    image: "/icons/user-experience.jpg",
    tag: "ACCESSIBILITY",
    title: "Seamless Direct Participation",
    desc: "From 2-minute digital KYC and instant bank/MFS deposits to direct wallet returns and scheduled automated payouts, investing in Bangladesh is frictionless.",
  },
];

const VETTING_TIERS = [
  {
    step: "01",
    name: "Promoter & CIB Screening",
    badge: "BACKGROUND AUDIT",
    desc: "Thorough review of business owners' credit history, tax compliance certificates, litigations, and commercial reputation across Bangladeshi banking registries.",
    points: ["Credit Information Bureau (CIB) Check", "TIN & Audited Tax Return Verification", "Director Personal Guarantees"],
  },
  {
    step: "02",
    name: "Physical Site & Asset Audit",
    badge: "ON-SITE INSPECTION",
    desc: "Our in-house due diligence officers visit physical factories, farms, and storage facilities to verify existence, operational capacity, and asset collateral.",
    points: ["Physical Plant & Equipment Inspection", "Warehouse & Inventory Assessment", "Supply Chain & Buyer Verification"],
  },
  {
    step: "03",
    name: "Financial Feasibility & Stress Test",
    badge: "QUANTITATIVE RIGOR",
    desc: "Rigorous financial modeling, historical balance sheet review, margin projections, and downside economic stress-testing before assigning investment terms.",
    points: ["Historical P&L & Cash Flow Stress Testing", "Debt Service Coverage Ratio (DSCR)", "Realistic Milestone Yield Formulation"],
  },
  {
    step: "04",
    name: "Legal Covenants & Escrow Structuring",
    badge: "CONTRACT ACT 1872",
    desc: "Binding legal documentation prepared under Bangladesh Contract Act 1872, including registered deeds, security post-dated cheques, and segregated escrow allocation.",
    points: ["Enforceable Digital Investment Deeds", "Security Cheques & Corporate Covenants", "Segregated Bank Escrow Accounts"],
  },
];

const MILESTONES = [
  {
    year: "2023",
    tag: "FOUNDATION",
    title: "Legal Framework & Platform Inception",
    desc: "Established in Dhaka with a clear vision: eliminating predatory financial intermediaries and structuring legally enforceable co-investment syndicates for Bangladesh's real economy.",
  },
  {
    year: "2024",
    tag: "PILOT EXPANSION",
    title: "First Syndicate Cohort & ৳1 Cr Disbursed",
    desc: "Successfully deployed capital across vetted SME and agricultural projects with a 100% on-time return disbursement track record across all investor cohorts.",
  },
  {
    year: "2025",
    tag: "PORTFOLIO SCALE",
    title: "Institutional Business Groups & Tiered Syndicates",
    desc: "Partnered with premier commercial entities including Mariners Group, MOHS Group, and Marinozz Group, introducing Shareholder, Directorship, and Plot Booking tiers.",
  },
  {
    year: "2026",
    tag: "AUTOMATION & ACCELERATION",
    title: "৳2.5 Cr+ Deployed & Automated Cryptographic Ledgers",
    desc: "Scaled our verified investor community past 5,000 members, launched automated double-entry ledger settlement, and expanded institutional corporate co-investment facilities.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 py-20 lg:py-28 text-white border-b border-border/40">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-down">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-emerald-300 backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>ESTABLISHED IN DHAKA • BANGLADESH CONTRACT ACT 1872</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-4xl mx-auto leading-tight">
              Democratizing Direct Capital for Bangladesh&apos;s{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Real Economy
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg font-normal text-slate-100 max-w-3xl mx-auto leading-relaxed">
              Biniyog Club is Bangladesh&apos;s premier co-investment ecosystem. We connect discerning individual and institutional investors directly with thoroughly audited business groups, manufacturing enterprises, and commercial ventures—backed by asset collateral, segregated bank escrow, and enforceable legal deeds.
            </p>
          </AnimatedSection>

          {/* Stats Bar */}
          <AnimatedSection animation="fade-up" delay={150}>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto">
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-5 text-left transition-all duration-300 hover:border-emerald-500/50 hover:bg-white/[0.12]"
                >
                  <p className="text-2xl sm:text-3xl font-normal tracking-tight text-emerald-300 font-mono">
                    {s.value}
                  </p>
                  <p className="text-sm font-semibold text-white mt-1">{s.label}</p>
                  <p className="text-xs text-slate-200 font-normal mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 2. The Core Narrative: The Problem & The Biniyog Solution ── */}
      <section className="py-20 lg:py-24 bg-card/60 border-b border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left: Photorealistic On-site Due Diligence Image Showcase */}
            <AnimatedSection animation="fade-right" className="lg:col-span-5">
              <div className="relative rounded-3xl border border-border/80 bg-card overflow-hidden shadow-2xl group">
                <div className="relative h-80 sm:h-96 w-full overflow-hidden bg-slate-900">
                  <Image
                    src="/images/about-due-diligence.jpg"
                    alt="Biniyog Club Financial Analysts and Legal Auditors in Dhaka"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                  <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-full bg-slate-900/90 backdrop-blur-md border border-white/20 px-3.5 py-1 text-xs text-white">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="font-medium">Certified Physical Audits</span>
                  </div>

                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Dhaka Headquarters</span>
                    <p className="text-sm font-semibold text-white mt-0.5">On-Site Due Diligence & Balance Sheet Audits</p>
                    <p className="text-xs text-slate-200 font-normal mt-1">Every business asset physically verified before co-investment listing.</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
                  <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] text-slate-300 uppercase font-semibold">Legal Enforceability</p>
                      <p className="text-sm font-bold text-white mt-0.5">Contract Act 1872</p>
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">Civilly Binding Deeds</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                      <p className="text-[10px] text-slate-300 uppercase font-semibold">Ledger Security</p>
                      <p className="text-sm font-bold text-white mt-0.5">Double-Entry</p>
                      <p className="text-[10px] text-emerald-400 mt-0.5 font-medium">Tamper-Proof Math</p>
                    </div>
                  </div>

                  <div className="rounded-xl bg-emerald-950/50 border border-emerald-500/30 p-3.5 flex items-center justify-between text-xs text-slate-100">
                    <span className="flex items-center gap-2 font-medium">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      100% Capital escrow segregation at scheduled banks
                    </span>
                    <span className="font-bold text-emerald-400">Audited</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Right: The Shift from Broken Banking to Direct Co-Investment */}
            <div className="lg:col-span-7">
              <AnimatedSection animation="fade-left">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-3">
                  <span>WHY BINIYOG CLUB WAS BORN</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white leading-tight">
                  Bridging the Financing Void in Bangladesh
                </h2>
                <p className="mt-4 text-sm sm:text-base font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                  For decades, Bangladesh&apos;s financial architecture has penalized both hardworking business owners and everyday savers. Profitable businesses struggle with lengthy, bureaucratic commercial bank loan procedures, while retail investors are confined to fixed deposits yielding below real inflation.
                </p>
                <p className="mt-3 text-sm sm:text-base font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                  Biniyog Club solves this systemic gap through direct, legally safeguarded syndication. We allow everyday co-investors to pool capital starting from just ৳5,000 into vetted commercial projects and institutional business groups, generating predictable 14% to 26% returns while fueling domestic job creation and industrial productivity.
                </p>

                <div className="mt-8 grid sm:grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 dark:border-red-500/20">
                    <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider mb-2">
                      The Traditional Problem
                    </p>
                    <ul className="space-y-2 text-xs font-normal text-slate-800 dark:text-slate-300">
                      <li>• Low bank deposit returns eaten up by inflation</li>
                      <li>• High SME bank rejection rate due to cumbersome paperwork</li>
                      <li>• Unregulated informal loans with zero legal recourse</li>
                      <li>• Opaque accounting and unexpected hidden deductions</li>
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 dark:border-emerald-500/25">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-2">
                      The Biniyog Club Solution
                    </p>
                    <ul className="space-y-2 text-xs font-normal text-slate-900 dark:text-slate-100">
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Direct 14%–26% returns from productive businesses</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> 100% legal deeds signed under Bangladesh Contract Act</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Capital held in escrow until milestones verified</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> Live milestone tracking & automated wallet payouts</li>
                    </ul>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Mission, Vision, and Institutional Mandate ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium tracking-widest text-emerald-700 dark:text-emerald-300 mb-3">
              <span>OUR GUIDING COMPASS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white">
              Built on Trust, Governed by Law
            </h2>
            <p className="mt-3 text-sm sm:text-base font-normal text-slate-700 dark:text-slate-200">
              Every policy, algorithm, and legal instrument at Biniyog Club is designed with one goal: protecting co-investor principal while unlocking sustainable commercial expansion.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-8 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-500/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-6">
                <Target className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Our Mission</h3>
              <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                To build Bangladesh&apos;s most reliable direct investment infrastructure by eliminating predatory intermediaries and connecting audited, high-performing enterprises with retail and institutional co-investors.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-8 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-500/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-6">
                <Eye className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Our Vision</h3>
              <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                A modernized Bangladesh economic landscape where every credible enterprise can mobilize expansion capital swiftly, and every citizen can earn inflation-beating returns with complete peace of mind.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-8 shadow-lg shadow-emerald-500/5 transition-all duration-300 hover:border-emerald-500/40">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">Legal Enforceability</h3>
              <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                Every co-investment instrument is registered and binding under the Bangladesh Contract Act 1872, fortified by promoter personal guarantees, security cheques, and bank escrow controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. The 4 Operational Pillars with Photographic Icons ── */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50/70 via-emerald-50/20 to-slate-50/40 dark:from-slate-950 dark:via-emerald-950/15 dark:to-slate-900/40 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium tracking-widest text-emerald-700 dark:text-emerald-300 mb-3">
              <span>INSTITUTIONAL PILLARS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white">
              How We Safeguard Your Capital
            </h2>
            <p className="mt-3 text-sm sm:text-base font-normal text-slate-700 dark:text-slate-200 leading-relaxed">
              Our 4-part operating standard guarantees that every project listed on Biniyog Club has passed stringent checks before a single taka is invested.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((val, idx) => (
              <AnimatedSection key={val.title} delay={idx * 80} animation="fade-up">
                <div className="group relative flex flex-col justify-between h-full overflow-hidden rounded-3xl border border-slate-200/90 bg-card dark:border-white/10 p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-xl">
                  <div>
                    <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-5 bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={val.image}
                        alt={val.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                      <span className="absolute bottom-3 left-3 rounded-full bg-emerald-950/90 backdrop-blur-md border border-emerald-500/40 px-3 py-0.5 text-[10px] font-bold text-emerald-200 tracking-wider">
                        {val.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {val.title}
                    </h3>
                    <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                      {val.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 font-medium">
                    <span>Protocol Certified</span>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. The 4-Tier Due Diligence Machine ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium tracking-widest text-emerald-700 dark:text-emerald-300 mb-3">
              <span>ZERO COMPROMISE VETTING</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white">
              The 4-Stage Due Diligence Funnel
            </h2>
            <p className="mt-3 text-sm sm:text-base font-normal text-slate-700 dark:text-slate-200">
              Less than 8% of applicants pass our screening. Here is the rigorous evaluation every enterprise must clear to be listed.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {VETTING_TIERS.map((tier, idx) => (
              <AnimatedSection key={tier.step} delay={idx * 100} animation="fade-up">
                <div className="relative flex flex-col justify-between h-full rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/50 hover:shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                        {tier.step}
                      </span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                        {tier.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                      {tier.name}
                    </h3>
                    <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed mb-4">
                      {tier.desc}
                    </p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-border/60">
                    {tier.points.map((pt) => (
                      <div key={pt} className="flex items-start gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Investor Community & Social Impact Showcase ── */}
      <section className="py-20 lg:py-24 bg-card/70 border-y border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <AnimatedSection animation="fade-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-3">
                  <Users className="h-3.5 w-3.5" />
                  <span>THRIVING INVESTOR COMMUNITY</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white leading-tight">
                  Over 5,000 Everyday Bangladeshis Growing Wealth Together
                </h2>
                <p className="mt-4 text-sm sm:text-base font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                  Our community comprises university educators, corporate executives, medical doctors, software engineers, and small business owners from Dhaka, Chittagong, Sylhet, and overseas expatriates who believe in transparent, Shariah-aligned and asset-backed wealth creation.
                </p>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-background p-4">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">100%</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">On-time disbursement record</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-background p-4">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">৳5,000</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">Accessible entry threshold</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-background p-4">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">64 Districts</p>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">Countrywide investor base</p>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap gap-4">
                  <Link
                    href="/projects"
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all hover:bg-emerald-700 hover:-translate-y-0.5"
                  >
                    Explore Investment Opportunities <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/how-it-works"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 px-6 py-3 text-sm font-semibold text-slate-900 dark:text-white transition-all hover:border-emerald-500/50 hover:bg-muted/30"
                  >
                    How It Works
                  </Link>
                </div>
              </AnimatedSection>
            </div>

            <AnimatedSection animation="fade-left" className="lg:col-span-5">
              <div className="relative rounded-3xl border border-border/80 overflow-hidden shadow-2xl group">
                <div className="relative h-80 sm:h-96 w-full">
                  <Image
                    src="/images/investor-community.jpg"
                    alt="Biniyog Club Investor Community Seminar and Co-Investment Workshop in Dhaka"
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Community Workshops</span>
                    <p className="text-base font-semibold mt-1">Financial Literacy & Co-Investment Summits</p>
                    <p className="text-xs text-slate-200 font-normal mt-1">Regular investor meetups at our Mohakhali headquarters.</p>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 7. Milestone Roadmap ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium tracking-widest text-emerald-700 dark:text-emerald-300 mb-3">
              <span>PROVEN TRACK RECORD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-white">
              Our Journey of Rapid Growth
            </h2>
            <p className="mt-3 text-sm sm:text-base font-normal text-slate-700 dark:text-slate-200">
              Every milestone represents disciplined execution and an unblemished commitment to investor security.
            </p>
          </AnimatedSection>

          <div className="space-y-5">
            {MILESTONES.map((item, idx) => (
              <AnimatedSection key={item.year} delay={idx * 90} animation="fade-up">
                <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md">
                  <div className="flex items-start sm:items-center gap-5">
                    <span className="text-3xl sm:text-4xl font-normal tracking-tight text-emerald-600 dark:text-emerald-400 font-mono min-w-[80px]">
                      {item.year}
                    </span>
                    <div>
                      <span className="inline-block rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 mb-1">
                        {item.tag}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                      <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 mt-1 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Corporate Headquarters & Contact Link ── */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-card to-background border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-8 sm:p-12 shadow-xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 mb-3">
                <MapPin className="h-3.5 w-3.5" />
                <span>DHAKA HEADQUARTERS</span>
              </span>
              <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-900 dark:text-white">
                Visit Our Corporate Headquarters
              </h2>
              <p className="mt-3 text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                Located at MG SAM Center, 12 Mohakhali C/A, Dhaka-1212. Our doors are open Sunday through Thursday for institutional consultations, corporate syndicates, and investor meetings.
              </p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-slate-800 dark:text-slate-200">
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Sun–Thu: 9:00 AM – 6:00 PM</span>
                <span className="flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Investor Relations: +880 1335-149033</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3.5 shrink-0">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5"
              >
                Schedule an In-Person Visit <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 dark:border-white/20 px-8 py-3.5 text-sm font-semibold text-slate-900 dark:text-white transition-all hover:border-emerald-500/50 hover:bg-muted/30"
              >
                View Opportunities
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
