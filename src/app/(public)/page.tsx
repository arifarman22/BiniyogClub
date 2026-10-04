import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  ChevronRight,
  Clock,
  TrendingUp,
  Shield,
  Users,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Building2,
  Coins,
  Lock,
  FileCheck,
  PhoneCall,
  Layers,
} from "lucide-react";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { AnimatedSection } from "@/components/shared/animated-section";
import { HeroSlider } from "@/components/shared/hero-slider";
import { ProjectCard } from "@/components/shared/project-card";
import { BusinessGroupCard } from "@/components/shared/business-group-card";
import { getPlatformStats, getRecentUpdates, getFeaturedProjects } from "@/server/data/public.data";
import { getAllGroups } from "@/server/data/groups.data";
import { JsonLd, organizationSchema, websiteSchema, faqSchema } from "@/components/shared/json-ld";

export const metadata: Metadata = {
  title: "Biniyog Club — Bangladesh's Premier Direct Investment Platform",
  description:
    "Join Bangladesh's leading investment platform. Invest in vetted business groups & projects, earn competitive returns with complete legal security. Start from ৳5,000.",
};

function fmtBdt(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

function fmtLocal(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  if (v >= 10000000) return `৳${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `৳${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `৳${(v / 1000).toFixed(0)}K`;
  return `৳${v.toLocaleString()}`;
}

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Create Account & Complete KYC",
    desc: "Register in under 2 minutes. Submit your NID or Passport for rapid digital identity verification.",
    icon: "/icons/user.png",
    tag: "Fast Onboarding",
  },
  {
    step: "02",
    title: "Browse Vetted Portfolios",
    desc: "Explore institutional business groups and reviewed projects with transparent risk and return disclosures.",
    icon: "/icons/search-engine.png",
    tag: "Multi-Tier Options",
  },
  {
    step: "03",
    title: "Invest with Direct Protection",
    desc: "Fund seamlessly through Bank Transfer or MFS. Every investment is bound by a signed legal digital contract.",
    icon: "/icons/investment.png",
    tag: "Legally Protected",
  },
  {
    step: "04",
    title: "Track & Receive Returns",
    desc: "Follow progress through real-time dashboards and receive capital plus returns directly into your wallet.",
    icon: "/icons/income.png",
    tag: "Automated Payouts",
  },
];

const TRUST_POINTS = [
  {
    title: "Multi-Stage Due Diligence",
    desc: "Every project undergoes extensive financial, legal, and operational background audits before listing.",
    icon: ShieldCheck,
  },
  {
    title: "Immutable Double-Entry Ledger",
    desc: "All financial transactions and distributions are mathematically verified and permanently auditable.",
    icon: Lock,
  },
  {
    title: "Legally Enforceable Digital Contracts",
    desc: "Investors receive formal digital agreements backed by Bangladesh contract laws.",
    icon: FileCheck,
  },
  {
    title: "Zero Hidden Platform Fees",
    desc: "100% upfront fee disclosure. What you see is what you earn—no unexpected deductions.",
    icon: Coins,
  },
  {
    title: "100% KYC-Verified Ecosystem",
    desc: "Identity verification protects our community and ensures regulatory alignment.",
    icon: Users,
  },
  {
    title: "Finance Officer Payment Confirmation",
    desc: "Human finance specialists manually audit and verify incoming bank transfers before allocation.",
    icon: CheckCircle2,
  },
];

const FAQS = [
  {
    q: "What is the minimum investment amount?",
    a: "You can start investing from as little as ৳5,000. Each project sets its own entry threshold, which is prominently displayed on the project card.",
  },
  {
    q: "How are projects verified and approved?",
    a: "All projects are curated and vetted by our finance and compliance teams. They undergo rigorous financial due diligence, physical site checks, and risk analysis before public listing.",
  },
  {
    q: "What returns can I expect?",
    a: "Returns vary depending on the sector, duration, and tier. Expected returns typically range from 14% to 26% annually. All projected returns and formulas are presented upfront.",
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Returns and principal are credited to your Biniyog Club wallet upon milestone completion or maturity. You can withdraw directly to your verified Bangladeshi bank account or mobile wallet anytime.",
  },
  {
    q: "Is my investment legally protected?",
    a: "Yes. Every investment is executed with a digital agreement signed between you and the operating entity, complete with timestamps and legal enforceability under the Contract Act of Bangladesh.",
  },
  {
    q: "How does the payment and settlement process work?",
    a: "Investments can be deposited via instant bank transfer or mobile banking (bKash/Nagad). Our finance officers verify the transaction receipt before confirming your allocation.",
  },
];

export default async function HomePage() {
  const [stats, recentUpdates, groups, featuredProjects] = await Promise.all([
    getPlatformStats(),
    getRecentUpdates(3),
    getAllGroups(),
    getFeaturedProjects(6),
  ]);

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

  return (
    <>
      <JsonLd data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL), faqSchema(FAQS)]} />

      {/* ── 1. Hero Slider ── */}
      <HeroSlider />

      {/* ── 2. Live Platform Metrics & Credibility Dock ── */}
      <section className="relative z-20 -mt-10 sm:-mt-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-up" delay={50}>
          {/* Outer glowing glass dock */}
          <div className="relative rounded-[2.2rem] p-2.5 sm:p-3.5 bg-gradient-to-b from-white/95 via-emerald-50/40 to-white/80 dark:from-slate-900/95 dark:via-emerald-950/20 dark:to-slate-900/80 border border-emerald-500/25 shadow-[0_20px_60px_-15px_rgba(0,140,100,0.15)] backdrop-blur-2xl">
            {/* Top ambient highlight line */}
            <div className="absolute inset-x-16 -top-px h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Stat 1: Total Funded */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
                {/* Ambient glow in corner */}
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

                {/* Top: Flaticon + Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Image src="/icons/investment.png" alt="Capital Deployed" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-normal text-emerald-700 dark:text-emerald-400 tracking-wider">
                    DIRECT IMPACT
                  </span>
                </div>

                {/* Middle: Number */}
                <div className="my-1">
                  <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                    {stats.totalFundedBdt > 0 ? fmtBdt(stats.totalFundedBdt) : "৳2.5 Cr+"}
                  </span>
                </div>

                {/* Bottom: Label & Micro note */}
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <p className="text-sm font-medium text-foreground">Total Capital Deployed</p>
                  <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Directly invested in Bangladesh
                  </p>
                </div>
              </div>

              {/* Stat 2: Active Investors */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Image src="/icons/user.png" alt="Verified Co-Investors" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-normal text-emerald-700 dark:text-emerald-400 tracking-wider">
                    100% KYC
                  </span>
                </div>

                <div className="my-1">
                  <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                    {stats.totalInvestors > 0 ? `${stats.totalInvestors}+` : "4+"}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <p className="text-sm font-medium text-foreground">Verified Co-Investors</p>
                  <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active retail & corporate members
                  </p>
                </div>
              </div>

              {/* Stat 3: Projects Financed */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Image src="/icons/search-engine.png" alt="Vetted Business Projects" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-normal text-emerald-700 dark:text-emerald-400 tracking-wider">
                    AUDITED
                  </span>
                </div>

                <div className="my-1">
                  <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                    {stats.totalProjects > 0 ? `${stats.totalProjects}+` : "3+"}
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <p className="text-sm font-medium text-foreground">Vetted Business Projects</p>
                  <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Due diligence & asset-backed
                  </p>
                </div>
              </div>

              {/* Stat 4: Legal Protection / Return Payouts */}
              <div className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Image src="/icons/income.png" alt="On-Time Return Payouts" width={32} height={32} className="object-contain" />
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-normal text-emerald-700 dark:text-emerald-400 tracking-wider">
                    TRACK RECORD
                  </span>
                </div>

                <div className="my-1">
                  <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                    100%
                  </span>
                </div>

                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                  <p className="text-sm font-medium text-foreground">On-Time Return Payouts</p>
                  <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Consistent capital & profit disbursals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* ── 3. Featured Projects ── */}
      {featuredProjects.length > 0 && (
        <section className="relative py-20 lg:py-24 bg-gradient-to-b from-slate-50/50 via-background to-emerald-50/20 dark:from-slate-900/30 dark:via-background dark:to-emerald-950/10 border-b border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-down" className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-light tracking-widest text-primary mb-3">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>CURATED OPPORTUNITIES</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
                  Featured Investment Projects
                </h2>
                <p className="mt-3.5 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-200 max-w-2xl leading-relaxed">
                  Directly finance vetted initiatives across Real Estate, Agriculture, Export Trade, and High-Growth SMEs.
                </p>
              </div>
              <Link
                href="/projects"
                className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-6 py-2.5 text-sm font-normal text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md shrink-0"
              >
                <span>Be an Investor</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </AnimatedSection>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {featuredProjects.map((project, i) => (
                <AnimatedSection key={project.id} delay={i * 90} animation="zoom-in" className="h-full">
                  <ProjectCard
                    slug={project.slug}
                    title={project.title}
                    description={project.description}
                    category={project.category}
                    status={project.status}
                    fundingGoalBdt={Number(project.fundingGoalBdt)}
                    fundedAmountBdt={Number(project.fundedAmountBdt)}
                    minInvestmentBdt={Number(project.minInvestmentBdt)}
                    expectedReturnPct={Number(project.expectedReturnPct)}
                    returnPctMin={project.returnPctMin ? Number(project.returnPctMin) : undefined}
                    returnPctMax={project.returnPctMax ? Number(project.returnPctMax) : undefined}
                    returnType={project.returnType}
                    durationDays={project.durationDays}
                    fundingDeadline={project.fundingDeadline}
                    coverImageUrl={project.coverImageUrl}
                    imageUrls={project.imageUrls}
                    location={project.location}
                    group={project.group}
                    priority={i < 2}
                  />
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-12 text-center sm:hidden">
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-8 py-3 text-sm font-semibold shadow-sm transition-all hover:border-primary hover:text-primary w-full"
              >
                Be an Investor <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Business Groups ── */}
      {groups.length > 0 && (
        <section className="relative py-20 lg:py-24 bg-gradient-to-b from-slate-50/80 via-emerald-50/25 to-slate-50/50 dark:from-slate-950 dark:via-emerald-950/15 dark:to-slate-900/30 fintech-grid-pattern border-b border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-down" className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-light tracking-widest text-primary mb-3">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>PREMIER CORPORATE ENTITIES</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
                  Institutional Business Groups
                </h2>
                <p className="mt-3.5 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-200 max-w-2xl leading-relaxed">
                  Join established conglomerates and commercial ventures as a verified Investor, Shareholder, or Strategic Partner.
                </p>
              </div>
              <Link
                href="/groups"
                className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-6 py-2.5 text-sm font-normal text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md shrink-0"
              >
                <span>View All Groups</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </AnimatedSection>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {groups.map((group, i) => (
                <AnimatedSection key={group.id} delay={i * 120} animation="zoom-in" className="h-full">
                  <BusinessGroupCard group={group} priority={i === 0} />
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link
                href="/groups"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-border/80 bg-card px-8 py-3 text-sm font-normal shadow-sm transition-all hover:border-primary hover:text-primary w-full"
              >
                View All Groups <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. How It Works ── */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-slate-50/80 via-background to-slate-50/60 dark:from-slate-900/30 dark:via-background dark:to-slate-900/20 border-b border-border/50" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-light tracking-widest text-primary mb-3">
              <Layers className="h-3.5 w-3.5" />
              <span>SIMPLE & TRANSPARENT PROCESS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
              How Biniyog Club Works
            </h2>
            <p className="mt-4 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-200 leading-relaxed">
              Start building wealth with institutional-grade investments through four straightforward steps.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 relative">
            {HOW_IT_WORKS.map(({ step, title, desc, icon, tag }, i) => (
              <AnimatedSection key={step} delay={i * 120} animation="fade-up">
                <div className="group relative flex flex-col h-full rounded-3xl border border-border/80 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5">
                  {/* Step Watermark Pill */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 p-2.5 transition-transform duration-300 group-hover:scale-110">
                      <Image src={icon} alt={title} width={38} height={38} className="object-contain" />
                    </div>
                    <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-foreground tracking-wider">
                      STEP {step}
                    </span>
                  </div>

                  <span className="text-[11px] font-normal uppercase tracking-wider text-primary mb-1">
                    {tag}
                  </span>
                  <h3 className="mb-2.5 text-lg font-normal sm:font-medium text-foreground leading-snug">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 leading-relaxed">
                    {desc}
                  </p>

                  {/* Desktop connector arrow */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-10">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="mt-14 text-center">
            <Link
              href="/how-it-works"
              className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-8 py-3 text-sm font-normal text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md"
            >
              <span>Explore Detailed Investment Guide</span>
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Trust, Security & Radical Transparency ── */}
      <section className="relative py-20 lg:py-28 bg-gradient-to-b from-background via-emerald-50/20 to-slate-50/50 dark:from-slate-950 dark:via-emerald-950/15 dark:to-slate-900/30 border-b border-border/50 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Content */}
            <AnimatedSection animation="fade-right" delay={0} className="lg:col-span-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-light tracking-widest text-primary mb-4">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>BANK-GRADE GOVERNANCE</span>
              </div>
              <h2 className="mb-5 text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.15]">
                Radical Transparency, <br />
                <span className="font-normal bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Every Single Step
                </span>
              </h2>
              <p className="mb-8 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-200 leading-relaxed">
                We believe Bangladeshi investors deserve institutional rigor. Biniyog Club pairs mathematical
                ledger immutability with verified legal contracts to safeguard your capital.
              </p>

              {/* Grid of Trust Pillars */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {TRUST_POINTS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-2xl border border-border/70 bg-card p-4 transition-all duration-200 hover:border-primary/40 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-foreground">{item.title}</h4>
                      </div>
                      <p className="text-xs font-normal text-slate-600 dark:text-slate-300 pl-9 leading-relaxed">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/about"
                  className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-brand-400 hover:shadow-primary/30 hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  Our Due Diligence Approach
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary w-full sm:w-auto"
                >
                  Security FAQ
                </Link>
              </div>
            </AnimatedSection>

            {/* Right Visual Dashboard Mockup */}
            <AnimatedSection animation="fade-left" delay={150} className="lg:col-span-6">
              <div className="relative rounded-3xl border border-border/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
                {/* Background glow highlights */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

                {/* Dashboard Header Bar */}
                <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Trust & Security Protocol</h4>
                      <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Double-Entry Ledger Verified
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 border border-white/10">
                    System Live
                  </span>
                </div>

                {/* Security Feature Grid */}
                <div className="grid grid-cols-2 gap-3.5 mb-6">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 mb-2.5">
                      <Lock className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold text-white">Zero Tampering</p>
                    <p className="text-[11px] text-slate-200 mt-1">Immutable ledger guarantees balance accuracy</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-300 mb-2.5">
                      <FileCheck className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold text-white">Enforceable Contracts</p>
                    <p className="text-[11px] text-slate-200 mt-1">Signed digital deeds binding under BD law</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 mb-2.5">
                      <BarChart3 className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold text-white">Live Disclosures</p>
                    <p className="text-[11px] text-slate-200 mt-1">Direct project milestone and harvest reports</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/20 text-purple-300 mb-2.5">
                      <Coins className="h-4 w-4" />
                    </div>
                    <p className="text-xs font-bold text-white">Direct Wallet Payouts</p>
                    <p className="text-[11px] text-slate-200 mt-1">Withdraw to bank or mobile banking</p>
                  </div>
                </div>

                {/* Bottom Assurance Card */}
                <div className="rounded-2xl bg-emerald-950/50 border border-emerald-500/30 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200">
                      Multi-party escrow segregation for all active investment pools
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 whitespace-nowrap ml-2">Verified</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 7. Project Updates ── */}
      {recentUpdates.length > 0 && (
        <section className="relative py-20 lg:py-24 bg-gradient-to-b from-background via-slate-50/60 to-background dark:via-slate-900/20 border-b border-border/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-down" className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-light tracking-widest text-primary mb-3">
                  <Clock className="h-3.5 w-3.5" />
                  <span>TRANSPARENCY IN ACTION</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
                  Live Project Disclosures
                </h2>
                <p className="mt-3.5 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-200 leading-relaxed">
                  Real-time milestone completions, harvest results, and operational reports directly from active ventures.
                </p>
              </div>
              <Link
                href="/updates"
                className="group inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-6 py-2.5 text-sm font-normal text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md shrink-0"
              >
                <span>All Updates</span>
                <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </AnimatedSection>

            <div className="grid gap-8 sm:grid-cols-3">
              {recentUpdates.map((update, i) => (
                <AnimatedSection key={update.id} delay={i * 120} animation="fade-up">
                  <Link
                    href={`/projects/${update.project.slug}`}
                    className="group flex flex-col h-full rounded-3xl border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300"
                  >
                    {update.project.coverImageUrl && (
                      <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
                        <Image
                          src={update.project.coverImageUrl}
                          alt={update.project.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-light text-white">
                          {update.project.title}
                        </span>
                      </div>
                    )}
                    <div className="p-6 flex flex-col flex-1">
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-normal text-primary">
                          {update.type.replace("_", " ")}
                        </span>
                        {update.publishedAt && (
                          <span className="flex items-center gap-1 text-xs font-light text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(update.publishedAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                      <h3 className="mb-2 text-base font-normal sm:font-medium group-hover:text-primary line-clamp-2 transition-colors leading-snug">
                        {update.title}
                      </h3>
                      <p className="mb-4 text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {update.content}
                      </p>
                      <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between text-xs font-normal sm:font-medium text-primary">
                        <span>Read full report</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. FAQ ── */}
      <section className="relative py-20 lg:py-24 bg-gradient-to-b from-emerald-50/20 via-slate-50/40 to-background dark:from-emerald-950/10 dark:via-slate-900/30 dark:to-background border-b border-border/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1 text-xs font-light tracking-widest text-primary mb-3">
              <Shield className="h-3.5 w-3.5" />
              <span>FREQUENTLY ASKED QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground">
              Everything You Need to Know
            </h2>
            <p className="mt-3.5 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-200">
              Clear answers regarding security, compliance, minimum investments, and payout cycles.
            </p>
          </AnimatedSection>

          <FaqAccordion />

          {/* Quick Support Card */}
          <div className="mt-12 rounded-3xl border border-border/80 bg-slate-50 dark:bg-slate-900/50 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h4 className="text-base font-normal sm:font-medium text-foreground">Still have questions about investing?</h4>
              <p className="text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 mt-1">
                Our investor relations team is ready to guide you on contract security and returns.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-normal text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                All FAQs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2.5 text-xs sm:text-sm font-normal text-white hover:bg-brand-400 transition-all shadow-md shadow-primary/20"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Talk to Advisor</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA ── */}
      <section className="relative overflow-hidden py-24 lg:py-28 text-white bg-slate-950">
        {/* Background Visual and Overlays */}
        <div className="absolute inset-0">
          <Image src="/4.png" alt="" fill className="object-cover object-center opacity-30" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-slate-950/80" />
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/20 via-transparent to-transparent pointer-events-none" />
        </div>

        <AnimatedSection animation="zoom-in" className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/70 px-4 py-1.5 text-xs sm:text-sm font-light tracking-wide text-emerald-300 backdrop-blur-md shadow-lg shadow-black/40">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Join {stats.totalInvestors.toLocaleString()}+ verified investors earning scheduled returns
          </div>

          <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.15]">
            Ready to Invest in <br />
            <span className="font-normal bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
              Bangladesh&apos;s Real Economy?
            </span>
          </h2>

          <p className="mb-10 text-slate-100 font-normal text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
            Create your account in 2 minutes. Gain direct access to admin-vetted business groups, institutional transparency, and legally protected contracts.
          </p>

          {/* Key Value Assurances */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300/80 mb-10">
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Start from ৳5,000
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" /> Legally Enforceable Contracts
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Direct Bank & MFS Payouts
            </span>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-9 py-4 text-base font-semibold text-white shadow-xl shadow-primary/30 transition-all duration-300 hover:bg-brand-400 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              Create Free Investor Account
              <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-9 py-4 text-base font-medium text-white transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
            >
              Talk to Our Advisory Team
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
