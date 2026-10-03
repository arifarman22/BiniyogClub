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
} from "lucide-react";
import { ButtonLink } from "@/components/shared/button-link";

export const metadata: Metadata = {
  title: "How It Works — Institutional Co-Investment Framework | Biniyog Club",
  description:
    "Learn how Biniyog Club works — from biometric KYC verification and legal contracts to funding verified business groups and receiving automated milestone payouts.",
  openGraph: {
    title: "How Biniyog Club Works",
    description: "A step-by-step institutional guide to direct investing in Bangladesh's real economy.",
  },
};

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    icon: "/icons/user.png",
    tag: "ONBOARDING",
    title: "Digital Account & Rapid KYC",
    desc: "Register in under 2 minutes. Submit your NID or Passport for automated digital identity verification, ensuring a 100% compliant community.",
  },
  {
    step: "02",
    icon: "/icons/search-engine.png",
    tag: "DISCOVERY",
    title: "Explore Vetted Business Groups",
    desc: "Browse institutional portfolios and audited projects. Review full balance sheets, collateral security, and projected profit margins with zero hidden fees.",
  },
  {
    step: "03",
    icon: "/icons/investment.png",
    tag: "DEPLOYMENT",
    title: "Execute Legally Bound Investment",
    desc: "Fund your allocation seamlessly via instant Bank Transfer or MFS. Every investment is bound by an enforceable digital deed under Bangladesh Contract Act.",
  },
  {
    step: "04",
    icon: "/icons/income.png",
    tag: "REALIZATION",
    title: "Track & Receive On-Time Returns",
    desc: "Monitor operational progress through real-time milestone updates. Payouts and principal returns are automatically disbursed into your Biniyog Club wallet.",
  },
];

const INVESTOR_DETAILS = [
  {
    step: "01",
    title: "Identity Verification & Wallet Setup",
    desc: "Submit your National ID or Passport. Our automated KYC engine confirms your credentials, granting you full co-investor access and an individual secure wallet.",
  },
  {
    step: "02",
    title: "Portfolio Diligence & Selection",
    desc: "Access comprehensive financial disclosure decks, asset collateral reports, enterprise track records, and transparent revenue-sharing models.",
  },
  {
    step: "03",
    title: "Bank Escrow Allocation",
    desc: "Deposit directly into segregated project bank accounts. Capital remains in escrow until minimum milestone targets and compliance checks are certified.",
  },
  {
    step: "04",
    title: "Digital Deed Execution",
    desc: "Sign a formal investment deed with cryptographic timestamping. You receive an instant PDF certificate and legally binding contract copy.",
  },
  {
    step: "05",
    title: "Milestone & Operational Tracking",
    desc: "Receive auditable progress reports, site visit summaries, and financial statements directly in your investor dashboard.",
  },
  {
    step: "06",
    title: "Direct Wallet Payouts & Withdrawal",
    desc: "Receive scheduled profit payouts and principal return upon maturity. Transfer funds instantly to your Bangladesh bank account or mobile wallet.",
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
    desc: "Every project undergoes extensive financial, legal, and operational background audits before listing.",
  },
  {
    icon: Lock,
    title: "Immutable Double-Entry Ledger",
    desc: "All financial transactions and distributions are mathematically verified and permanently auditable.",
  },
  {
    icon: FileCheck,
    title: "Enforceable Digital Contracts",
    desc: "Investors receive formal digital agreements backed by the Contract Act of Bangladesh.",
  },
  {
    icon: Scale,
    title: "Segregated Escrow Accounts",
    desc: "Investor capital is held separately from platform operating reserves in scheduled commercial bank escrows.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/70 to-slate-950 py-20 lg:py-24 text-white">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-light tracking-widest text-emerald-300 backdrop-blur-md mb-6">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>TRANSPARENT CO-INVESTMENT FRAMEWORK</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-3xl mx-auto leading-tight">
            How Biniyog Club{" "}
            <span className="font-normal bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Empowers Co-Investors
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Discover our institutional framework connecting verified retail and corporate investors directly with vetted business enterprises across Bangladesh.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-normal text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Start Investing Today <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-light text-white backdrop-blur-sm transition-all hover:bg-white/10 w-full sm:w-auto"
            >
              Browse Live Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. Primary 4-Pillar Process (Unified Emerald Cards with Flaticons) ── */}
      <section className="relative z-20 -mt-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HOW_IT_WORKS_STEPS.map((step) => (
            <div
              key={step.step}
              className="group relative flex flex-col justify-between overflow-hidden rounded-[1.6rem] border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10"
            >
              {/* Corner Ambient Glow */}
              <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <Image src={step.icon} alt={step.title} width={32} height={32} className="object-contain" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-normal text-emerald-700 dark:text-emerald-400 tracking-wider">
                    STEP {step.step}
                  </span>
                </div>

                <p className="text-[10px] font-normal uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
                  {step.tag}
                </p>
                <h3 className="text-base font-normal sm:font-medium text-foreground leading-snug">
                  {step.title}
                </h3>
                <p className="text-xs font-light text-muted-foreground mt-2 leading-relaxed">
                  {step.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[11px] font-light text-muted-foreground">Standardized & Secure</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3. Step-by-Step Investor Experience ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <span>FOR RETAIL & CORPORATE CO-INVESTORS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Your End-to-End Investment Journey
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
              Every step on Biniyog Club is engineered for transparency, regulatory compliance, and peace of mind.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INVESTOR_DETAILS.map(({ step, title, desc }) => (
              <div
                key={step}
                className="group relative rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-7 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-1"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="text-3xl font-light tracking-tight text-emerald-600/30 dark:text-emerald-400/30">
                    {step}
                  </span>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-normal text-emerald-600 dark:text-emerald-400">
                    Verified Phase
                  </span>
                </div>
                <h3 className="mb-2 text-base font-normal sm:font-medium text-foreground">{title}</h3>
                <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-normal text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5"
            >
              Open Investor Account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. For Business Groups & Enterprises ── */}
      <section className="py-20 lg:py-24 bg-gradient-to-b from-slate-50/80 via-emerald-50/20 to-slate-50/50 dark:from-slate-950 dark:via-emerald-950/15 dark:to-slate-900/30 border-y border-border/50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <Building2 className="h-3.5 w-3.5" />
              <span>FOR ENTERPRISES & PROJECT SPONSORS</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Securing Syndicate Capital for Your Business
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
              We help high-performing Bangladeshi enterprises raise direct co-investment without burdensome bank bureaucracy.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ENTERPRISE_STEPS.map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-normal text-emerald-600 dark:text-emerald-400">
                    STAGE {step}
                  </span>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
                <h3 className="mb-2 text-base font-normal text-foreground">{title}</h3>
                <p className="text-xs font-light text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/30 bg-background px-8 py-3 text-sm font-normal text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Apply as a Business Group Partner <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Built-In Safeguards Dock ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-14 text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-light tracking-widest text-emerald-600 dark:text-emerald-400 mb-3">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>INSTITUTIONAL GRADE SECURITY</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-foreground">
              Built-In Investor Protection Protocol
            </h2>
            <p className="mt-3 text-sm sm:text-base font-light text-muted-foreground leading-relaxed">
              Biniyog Club enforces structural safeguards at every level of capital flow and legal execution.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SAFEGUARDS.map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-card p-7 text-center transition-all duration-300 hover:border-emerald-500/40"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-sm font-normal sm:font-medium text-foreground">{title}</h3>
                <p className="text-xs font-light text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Bottom Call to Action ── */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950 text-white border-t border-emerald-950">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl sm:text-4xl font-light tracking-tight text-white mb-4">
            Ready to Begin Direct Investing?
          </h2>
          <p className="text-sm sm:text-base font-light text-slate-300 max-w-xl mx-auto mb-8 leading-relaxed">
            Create your account today, complete digital KYC in minutes, and explore verified business group opportunities.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-normal text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Register Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/faq"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-light text-white backdrop-blur-sm transition-all hover:bg-white/10 w-full sm:w-auto"
            >
              Read Investor FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
