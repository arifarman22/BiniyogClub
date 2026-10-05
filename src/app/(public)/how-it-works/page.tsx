import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Lock,
  FileCheck,
  Scale,
  Sparkles,
  Building2,
  TrendingUp,
  Coins,
  CheckCircle2,
  UserCheck,
  Search,
  Wallet,
  Landmark,
  FileText,
  BadgePercent,
  Clock,
  HelpCircle,
  Layers,
  CircleDollarSign,
  ArrowDownRight,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

export const metadata: Metadata = {
  title: "How It Works — Institutional Co-Investment Framework | Biniyog Club",
  description:
    "A comprehensive, step-by-step visual guide to how Biniyog Club works — from biometric KYC verification and legal contracts to funding verified business groups and receiving automated milestone payouts.",
  openGraph: {
    title: "How Biniyog Club Works | Step-by-Step Investment Protocol",
    description: "Learn how everyday investors and corporate groups participate in direct, asset-backed commercial syndicates across Bangladesh.",
  },
};

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    image: "/images/digital-kyc-verify.jpg",
    tag: "INSTANT ONBOARDING",
    title: "Digital Account & Instant KYC",
    desc: "Register in under 2 minutes. Submit your National ID (NID) or Passport for rapid cryptographic identity verification. Your individual investor wallet is provisioned instantly.",
    highlights: ["2-Minute Paperless Setup", "Automated NID/Passport Check", "Secure Dedicated Wallet"],
  },
  {
    step: "02",
    image: "/images/smart-agro-farm.jpg",
    tag: "RIGOROUS DILIGENCE",
    title: "Explore Vetted Opportunities",
    desc: "Browse audited agricultural, SME, trade finance, and commercial business groups. Review physical asset collateral, audited balance sheets, risk scores, and projected profit margins.",
    highlights: ["Physical Site Audits", "Audited Financial Statements", "14% - 26% Target Annual Yields"],
  },
  {
    step: "03",
    image: "/images/contract-security.jpg",
    tag: "CIVIL ENFORCEABILITY",
    title: "Execute Legally Bound Contract",
    desc: "Fund your allocation seamlessly via instant Bank Transfer or MFS (bKash/Nagad). Every investment is bound by an enforceable digital deed signed under Bangladesh Contract Act 1872.",
    highlights: ["Contract Act 1872 Compliant", "Segregated Bank Escrow", "Direct Digital Deed PDF"],
  },
  {
    step: "04",
    image: "/images/wallet-returns-payout.jpg",
    tag: "AUTOMATED DISTRIBUTIONS",
    title: "Track Milestones & Receive Returns",
    desc: "Monitor business operations with live milestone progress photos and financial reports. Scheduled return payouts and principal returns are automatically credited to your wallet for instant withdrawal.",
    highlights: ["100% On-Time Payout Record", "Direct Bank/MFS Withdrawals", "Double-Entry Ledger Proof"],
  },
];

const INVESTOR_DETAILS = [
  {
    step: "01",
    title: "Identity Verification & Wallet Setup",
    desc: "Submit your National ID or Passport. Our automated KYC engine confirms your credentials, granting you full co-investor access and an individual secure wallet.",
    badge: "Registration",
  },
  {
    step: "02",
    title: "Portfolio Diligence & Selection",
    desc: "Access comprehensive financial disclosure decks, asset collateral reports, enterprise track records, and transparent revenue-sharing models.",
    badge: "Due Diligence",
  },
  {
    step: "03",
    title: "Bank Escrow Allocation",
    desc: "Deposit directly into segregated project bank accounts. Capital remains in escrow until minimum milestone targets and compliance checks are certified.",
    badge: "Escrow Deposit",
  },
  {
    step: "04",
    title: "Digital Deed Execution",
    desc: "Sign a formal investment deed with cryptographic timestamping. You receive an instant PDF certificate and legally binding contract copy.",
    badge: "Legal Contract",
  },
  {
    step: "05",
    title: "Milestone & Operational Tracking",
    desc: "Receive auditable progress reports, site visit summaries, and financial statements directly in your investor dashboard.",
    badge: "Live Monitoring",
  },
  {
    step: "06",
    title: "Direct Wallet Payouts & Withdrawal",
    desc: "Receive scheduled profit payouts and principal return upon maturity. Transfer funds instantly to your Bangladesh bank account or mobile wallet.",
    badge: "Return Payout",
  },
];

const ENTERPRISE_STEPS = [
  {
    step: "01",
    title: "Enterprise Application & Pitch",
    desc: "Business groups submit commercial credentials, audited tax returns, bank solvency certificates, and proposed expansion projects.",
  },
  {
    step: "02",
    title: "Physical Due Diligence & Audit",
    desc: "Our internal finance and legal analysts perform on-site facility inspections, supplier verification, and asset collateral valuation.",
  },
  {
    step: "03",
    title: "Syndicate Structure & Listing",
    desc: "Approved enterprises are structured into transparent co-investment tiers with predetermined yield models and listed for public/private syndicate.",
  },
  {
    step: "04",
    title: "Milestone Disbursal & Repayment",
    desc: "Raised capital is disbursed in tranches aligned with verifiable KPIs. Return repayments are scheduled transparently back to investors.",
  },
];

const SAFEGUARDS = [
  {
    icon: ShieldCheck,
    title: "Multi-Tier Due Diligence",
    desc: "Every enterprise undergoes exhaustive CIB credit checks, physical asset inspections, and historical balance sheet audits before listing.",
  },
  {
    icon: Lock,
    title: "Immutable Double-Entry Ledger",
    desc: "All financial transactions and distributions are mathematically verified and permanently auditable with zero tampering possibility.",
  },
  {
    icon: FileCheck,
    title: "Enforceable Digital Contracts",
    desc: "Co-investors receive formal digital agreements backed by the Contract Act 1872 of Bangladesh, complete with director personal guarantees.",
  },
  {
    icon: Scale,
    title: "Segregated Escrow Accounts",
    desc: "Investor capital is held separately from platform operating reserves in scheduled commercial bank escrows until operational milestones are validated.",
  },
];

const FAQS = [
  {
    q: "How does my money reach the business?",
    a: "When you fund a project, your money is held in a segregated escrow account at a scheduled commercial bank in Bangladesh. The funds are disbursed to the enterprise in planned tranches only when our inspection team verifies milestone completion.",
  },
  {
    q: "What happens if a project underperforms?",
    a: "Every listed project is backed by tangible asset collateral, post-dated security cheques, and personal guarantees from enterprise directors. In the rare event of business delays, our legal recovery covenants enforce repayment under Bangladesh Contract Act 1872.",
  },
  {
    q: "How are returns calculated and distributed?",
    a: "Returns are calculated using audited profit-sharing or predetermined fixed-yield formulas detailed on the project card. When a payout date arrives, earnings are automatically credited to your Biniyog Club wallet, where you can withdraw directly to your bank account or bKash/Nagad.",
  },
  {
    q: "Can I invest as a Non-Resident Bangladeshi (NRB)?",
    a: "Yes! NRBs can register using their valid Bangladeshi passport or dual citizenship documents and fund investments via international wire transfer or domestic accounts.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 py-20 lg:py-28 text-white border-b border-border/40">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-down">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-light tracking-widest text-emerald-300 backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>TRANSPARENT CO-INVESTMENT PROTOCOL • END-TO-END</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-4xl mx-auto leading-tight">
              How Direct Investment Works on{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Biniyog Club
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg font-light text-slate-300 max-w-3xl mx-auto leading-relaxed">
              We make investing in Bangladesh&apos;s real economy straightforward, transparent, and legally protected. Explore our 4-stage co-investment lifecycle from KYC verification to automated profit distribution.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 w-full sm:w-auto"
              >
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/projects"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 w-full sm:w-auto"
              >
                Explore Live Opportunities
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 2. Primary 4-Stage Core Flow with Real Photographic Imagery ── */}
      <section className="relative z-20 -mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <AnimatedSection key={step.step} delay={idx * 100} animation="fade-up">
              <div className="group relative flex flex-col justify-between h-full overflow-hidden rounded-3xl border border-slate-200/80 bg-card dark:border-white/10 p-5 shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
                <div>
                  {/* Photo Banner with Badges */}
                  <div className="relative h-44 w-full rounded-2xl overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={step.image}
                      alt={step.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                    
                    <span className="absolute top-3 right-3 rounded-full bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-mono font-bold text-white border border-white/15">
                      STEP {step.step}
                    </span>

                    <span className="absolute bottom-3 left-3 rounded-full bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 tracking-wider">
                      {step.tag}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed mb-4">
                    {step.desc}
                  </p>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-border/50">
                  {step.highlights.map((h) => (
                    <div key={h} className="flex items-center gap-1.5 text-xs text-foreground/80">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── 3. Visual Capital Flow Architecture ("Where Does Your Money Go?") ── */}
      <section className="py-20 lg:py-28 bg-card/40 border-b border-border/50 mt-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <Landmark className="h-3.5 w-3.5" />
              <span>CAPITAL PROTECTION ARCHITECTURE</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Where Does Your Money Go?
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground">
              Unlike informal lending or speculative funds, your capital never sits in an unmonitored platform account. Here is the segregated flow:
            </p>
          </AnimatedSection>

          <div className="relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-6 sm:p-10 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center">
              {/* Box 1: Investor Deposit */}
              <div className="rounded-2xl border border-border bg-background p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 1</p>
                <h4 className="text-sm font-semibold text-foreground mt-1">Co-Investor Deposit</h4>
                <p className="text-xs font-light text-muted-foreground mt-1">Via Bank Transfer or MFS into Segregated Escrow</p>
              </div>

              {/* Arrow 1 */}
              <div className="hidden md:flex justify-center text-emerald-500">
                <ArrowRight className="h-6 w-6 animate-pulse" />
              </div>

              {/* Box 2: Scheduled Bank Escrow */}
              <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-500/5 p-5 text-center relative">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Landmark className="h-6 w-6" />
                </div>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                  Segregated Escrow
                </span>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 2</p>
                <h4 className="text-sm font-semibold text-foreground mt-1">Scheduled Bank Escrow</h4>
                <p className="text-xs font-light text-muted-foreground mt-1">Capital locked until project hits target and passes audit</p>
              </div>

              {/* Arrow 2 */}
              <div className="hidden md:flex justify-center text-emerald-500">
                <ArrowRight className="h-6 w-6 animate-pulse" />
              </div>

              {/* Box 3: Milestone Tranche Disbursal */}
              <div className="rounded-2xl border border-border bg-background p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Step 3</p>
                <h4 className="text-sm font-semibold text-foreground mt-1">Audited Disbursal</h4>
                <p className="text-xs font-light text-muted-foreground mt-1">Disbursed in tranches directly to vetted business entity</p>
              </div>
            </div>

            {/* Bottom Return Cycle Banner */}
            <div className="mt-8 pt-6 border-t border-border/60 grid sm:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Repayment & Profit Realization Cycle</h4>
                  <p className="text-xs text-muted-foreground">Revenues generated by the enterprise flow back to co-investor wallets.</p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> 100% On-Time Payout Track Record
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Detailed 6-Step Investor Journey ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <span>FOR RETAIL & CORPORATE CO-INVESTORS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Your Complete Co-Investment Journey
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
              From creating your account to collecting your final returns, every interaction is tracked on your investor dashboard.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INVESTOR_DETAILS.map(({ step, title, desc, badge }, idx) => (
              <AnimatedSection key={step} delay={idx * 80} animation="fade-up">
                <div className="group relative flex flex-col justify-between h-full rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-7 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-3xl font-light font-mono text-emerald-600 dark:text-emerald-400">
                        {step}
                      </span>
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                        {badge}
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {title}
                    </h3>
                    <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Automated Protocol</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5"
            >
              Open Investor Account Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Concrete Return Example Calculator Scenario ── */}
      <section className="py-20 lg:py-24 bg-card/60 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6">
              <AnimatedSection animation="fade-right">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light text-emerald-600 dark:text-emerald-400 mb-3">
                  <BadgePercent className="h-3.5 w-3.5" />
                  <span>ILLUSTRATIVE SCENARIO</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-foreground leading-tight">
                  How Returns are Realized in Practice
                </h2>
                <p className="mt-4 text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
                  We believe in 100% mathematical clarity. Every project explicitly outlines its return formula, cycle duration, and milestone schedule before you allocate capital.
                </p>
                <div className="mt-6 space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Pre-agreed Return Formulas:</strong> Fixed milestone yield or percentage of gross operational revenue.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>No Concealed Deductions:</strong> What you see on the project term sheet is what gets deposited to your wallet.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Direct Bank Re-direction:</strong> Withdraw from your wallet into any Bangladeshi scheduled bank with zero delay.</span>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Right: Mock Term Sheet / Return Simulation Card */}
            <div className="lg:col-span-6">
              <AnimatedSection animation="fade-left">
                <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-6 sm:p-8 shadow-xl">
                  <div className="flex items-center justify-between pb-4 border-b border-border/60">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        SAMPLE 6-MONTH SYNDICATE
                      </span>
                      <h4 className="text-base font-semibold text-foreground">Commercial Cold-Chain Agro Expansion</h4>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      18% Annualized
                    </span>
                  </div>

                  <div className="mt-5 space-y-3.5 text-sm">
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Principal Investment</span>
                      <span className="font-mono font-semibold text-foreground">৳50,000</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Syndicate Term</span>
                      <span className="font-mono text-foreground">6 Months (180 Days)</span>
                    </div>
                    <div className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">Projected Net Profit (9% in 6 mo)</span>
                      <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">+ ৳4,500</span>
                    </div>
                    <div className="flex justify-between items-center py-2.5 border-t border-b border-border/60">
                      <span className="font-semibold text-foreground">Total Payout at Maturity</span>
                      <span className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">৳54,500</span>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 p-3.5 text-xs text-slate-700 dark:text-slate-300">
                    <strong>Payout Mechanism:</strong> ৳4,500 profit disbursed in milestone tranches; ৳50,000 principal returned at contract expiration.
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Built-In Safeguards Dock ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>INSTITUTIONAL GRADE SECURITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Built-In Investor Protection Protocol
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
              Biniyog Club enforces structural safeguards at every level of capital flow, ledger math, and legal enforceability.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SAFEGUARDS.map(({ icon: Icon, title, desc }, idx) => (
              <AnimatedSection key={title} delay={idx * 80} animation="fade-up">
                <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-7 text-center transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
                  <p className="text-xs font-light text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Frequently Asked Questions ── */}
      <section className="py-20 lg:py-24 bg-card/40 border-t border-border/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <HelpCircle className="h-3.5 w-3.5" />
              <span>FREQUENT QUESTIONS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Questions About How It Works?
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground">
              Clear answers to the most common questions about funding, legal protection, and withdrawals.
            </p>
          </AnimatedSection>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-emerald-500/40"
              >
                <h4 className="text-base font-semibold text-foreground mb-2">{faq.q}</h4>
                <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Bottom Call to Action ── */}
      <section className="py-20 bg-gradient-to-b from-slate-950 to-slate-900 text-white border-t border-emerald-950">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white mb-4">
            Start Your Co-Investment Journey Today
          </h2>
          <p className="text-sm sm:text-base font-light text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Create your account in under 2 minutes, verify your NID, and join over 5,000 investors earning predictable returns in Bangladesh.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-medium text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Register Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-medium text-white backdrop-blur-sm transition-all hover:bg-white/10 w-full sm:w-auto"
            >
              Browse Live Opportunities
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
