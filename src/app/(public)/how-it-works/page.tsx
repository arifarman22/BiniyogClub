import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  ArrowDown,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  FileCheck,
  Landmark,
  Lock,
  Scale,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "How It Works — Institutional Co-Investment Framework | Biniyog Club",
  description:
    "A step-by-step guide to how Biniyog Club works — from KYC verification and legal contracts to funding verified business groups and receiving milestone payouts.",
  openGraph: {
    title: "How Biniyog Club Works | Step-by-Step Investment Protocol",
    description:
      "Learn how everyday investors and corporate groups participate in direct, asset-backed commercial projects across Bangladesh.",
  },
};

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    image: "/images/digital-kyc-verify.jpg",
    tag: "Onboarding",
    title: "Create account & verify KYC",
    desc: "Register in minutes and submit your National ID (NID) or Passport. Once our team verifies your identity, your investor wallet is ready to use.",
    highlights: ["Paperless sign-up", "NID / Passport verification", "Dedicated investor wallet"],
  },
  {
    step: "02",
    image: "/images/smart-agro-farm.jpg",
    tag: "Due diligence",
    title: "Explore vetted opportunities",
    desc: "Browse reviewed agricultural, SME, trade and commercial projects. Compare collateral, financial disclosures, durations and expected returns before you commit.",
    highlights: ["Physical site checks", "Financial disclosures", "Returns shown upfront"],
  },
  {
    step: "03",
    image: "/images/contract-security.jpg",
    tag: "Legal contract",
    title: "Fund & sign your contract",
    desc: "Pay by bank transfer or mobile banking (bKash/Nagad) and upload your payment proof. Every investment is bound by a digital deed under the Bangladesh Contract Act 1872.",
    highlights: ["Contract Act 1872 compliant", "Project-specific bank accounts", "Downloadable PDF certificate"],
  },
  {
    step: "04",
    image: "/images/wallet-returns-payout.jpg",
    tag: "Returns",
    title: "Track milestones & get paid",
    desc: "Follow progress updates and financial reports from your dashboard. Scheduled returns and principal are credited to your wallet, ready to withdraw.",
    highlights: ["Live milestone updates", "Bank / MFS withdrawals", "Double-entry ledger records"],
  },
];

const INVESTOR_JOURNEY = [
  {
    step: "01",
    badge: "Registration",
    title: "Identity verification & wallet setup",
    desc: "Submit your National ID or Passport. Once your KYC is approved you get full investor access and an individual, secure wallet.",
  },
  {
    step: "02",
    badge: "Due diligence",
    title: "Portfolio review & selection",
    desc: "Access financial disclosures, collateral reports, enterprise track records and transparent revenue-sharing models for each project.",
  },
  {
    step: "03",
    badge: "Deposit",
    title: "Deposit to the project account",
    desc: "Pay directly into the project's designated bank account and upload your proof. Our finance team verifies the transaction before confirming your allocation.",
  },
  {
    step: "04",
    badge: "Legal contract",
    title: "Digital deed execution",
    desc: "Your investment is recorded against a formal, timestamped deed. You receive a PDF certificate with a verification code.",
  },
  {
    step: "05",
    badge: "Monitoring",
    title: "Milestone & operational tracking",
    desc: "Progress reports, site updates and financial statements are published straight to your investor dashboard.",
  },
  {
    step: "06",
    badge: "Payout",
    title: "Wallet payouts & withdrawal",
    desc: "Receive scheduled profit payouts and your principal at maturity, then withdraw to your Bangladeshi bank account or mobile wallet.",
  },
];

const CAPITAL_FLOW = [
  {
    icon: Wallet,
    title: "Investor deposit",
    desc: "Via bank transfer or MFS into the project's designated account",
  },
  {
    icon: Landmark,
    title: "Verified & held",
    desc: "Finance team confirms the payment; funds are tracked on the ledger",
    featured: true,
  },
  {
    icon: Building2,
    title: "Disbursed to business",
    desc: "Released to the vetted enterprise according to the project plan",
  },
];

const SAFEGUARDS = [
  {
    icon: ShieldCheck,
    title: "Multi-tier due diligence",
    desc: "Enterprises go through credit checks, physical asset inspections and balance sheet reviews before listing.",
  },
  {
    icon: Lock,
    title: "Double-entry ledger",
    desc: "Every transaction and distribution is recorded with balancing debits and credits, so accounts are fully auditable.",
  },
  {
    icon: FileCheck,
    title: "Enforceable contracts",
    desc: "Investors receive formal digital agreements under the Contract Act 1872 of Bangladesh.",
  },
  {
    icon: Scale,
    title: "Separate project accounts",
    desc: "Investor capital is paid into project-designated bank accounts rather than mixed with platform operating funds.",
  },
];

const RETURN_POINTS = [
  { title: "Pre-agreed return formulas", desc: "Fixed milestone yield or a share of operating revenue, stated on the project." },
  { title: "No hidden deductions", desc: "What you see on the project terms is what is credited to your wallet." },
  { title: "Direct withdrawals", desc: "Move funds from your wallet to any Bangladeshi bank account or mobile wallet." },
];

const FAQS = [
  {
    q: "How does my money reach the business?",
    a: "You pay into the project's designated bank account and upload your payment proof. Once our finance team verifies it, your investment is confirmed and funds are released to the enterprise according to the project plan.",
  },
  {
    q: "What happens if a project underperforms?",
    a: "Listed projects are backed by collateral and contractual covenants. If a business is delayed, the agreement signed under the Bangladesh Contract Act 1872 governs repayment and recovery.",
  },
  {
    q: "How are returns calculated and distributed?",
    a: "Each project states its return formula — a fixed yield or a profit share — upfront. On each payout date, earnings are credited to your Biniyog Club wallet, from where you can withdraw to your bank account or bKash/Nagad.",
  },
  {
    q: "Can I invest as a Non-Resident Bangladeshi (NRB)?",
    a: "Yes. NRBs can register using a valid Bangladeshi passport and fund investments via international wire transfer or a domestic account.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-[#040d09] pb-36 pt-20 text-white lg:pb-40 lg:pt-28">
        <div className="pointer-events-none absolute inset-0">
          <Image src="/images/contract-security.jpg" alt="" fill priority className="object-cover opacity-15" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040d09]/70 via-[#040d09]/85 to-[#040d09]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent)]" />
        </div>

        <AnimatedSection animation="fade-down" className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-px w-5 bg-emerald-400/70" />
            How it works
            <span className="h-px w-5 bg-emerald-400/70" />
          </div>
          <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            How direct investment works on{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
              Biniyog Club
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Investing in Bangladesh&apos;s real economy, made straightforward, transparent and legally protected — from
            KYC verification to profit distribution in four stages.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
            >
              Create free account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-white/50 hover:bg-white/10"
            >
              Explore live projects
            </Link>
          </div>
        </AnimatedSection>
      </section>

      {/* ── 2. Four-stage flow (overlaps hero) ── */}
      <section className="relative z-20 mx-auto -mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS_STEPS.map((step, idx) => (
            <AnimatedSection key={step.step} delay={idx * 100} animation="fade-up" className="h-full">
              <article className="group flex h-full flex-col border border-border bg-card shadow-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50">
                <div className="relative h-44 w-full overflow-hidden bg-muted">
                  <Image
                    src={step.image}
                    alt={step.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/10 to-transparent" />
                  <span className="absolute left-3 top-3 bg-primary px-2.5 py-1 text-xs font-bold tabular-nums text-white">
                    {step.step}
                  </span>
                  <span className="absolute bottom-3 left-3 text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                    {step.tag}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5">
                  <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                    {step.title}
                  </h3>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
                  <ul className="mt-auto space-y-1.5 border-t border-border pt-4">
                    {step.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-xs font-medium text-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ── 3. Capital flow ── */}
      <section className="bg-background py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14">
            <SectionHeading
              eyebrow="Capital protection"
              title="Where does your"
              highlight="money go?"
              description="Your capital never sits in an unmonitored account. Here's how it moves from you to the business — and back."
            />
          </AnimatedSection>

          <AnimatedSection animation="zoom-in" delay={100}>
            <div className="border border-border bg-card p-6 shadow-xl sm:p-10">
              <ol className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
                {CAPITAL_FLOW.map(({ icon: Icon, title, desc, featured }, i) => (
                  <li key={title} className="contents">
                    <div
                      className={`relative flex flex-col items-center p-6 text-center ${featured ? "border-2 border-primary bg-primary/5" : "border border-border bg-background"}`}
                    >
                      <div
                        className={`mb-4 flex h-12 w-12 items-center justify-center ${featured ? "bg-primary text-white" : "bg-primary/10 text-primary"}`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <p className="text-xs font-bold uppercase tracking-widest text-primary">Step {i + 1}</p>
                      <h3 className="mt-1 text-base font-semibold text-foreground">{title}</h3>
                      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
                    </div>
                    {i < CAPITAL_FLOW.length - 1 && (
                      <div className="flex items-center justify-center text-primary" aria-hidden="true">
                        <ArrowRight className="hidden h-6 w-6 md:block" />
                        <ArrowDown className="h-5 w-5 md:hidden" />
                      </div>
                    )}
                  </li>
                ))}
              </ol>

              <div className="mt-8 flex items-center gap-4 border-t border-border pt-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary/10 text-primary">
                  <CircleDollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Repayment &amp; profit cycle</h3>
                  <p className="text-sm text-muted-foreground">
                    Revenue generated by the enterprise flows back to investor wallets as scheduled returns.
                  </p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 4. Six-step investor journey ── */}
      <section className="bg-muted/40 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14">
            <SectionHeading
              eyebrow="For retail & corporate investors"
              title="Your complete"
              highlight="investment journey"
              description="From creating your account to collecting your final returns, every step is tracked on your investor dashboard."
            />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {INVESTOR_JOURNEY.map(({ step, title, desc, badge }, idx) => (
              <AnimatedSection key={step} delay={idx * 70} animation="fade-up" className="h-full">
                <div className="group relative h-full overflow-hidden border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/40 to-transparent transition-all group-hover:via-primary" />
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-3xl font-light tabular-nums text-primary">{step}</span>
                    <span className="bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
                      {badge}
                    </span>
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-foreground transition-colors group-hover:text-primary">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
            >
              Open investor account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 5. Return example ── */}
      <section className="bg-background py-20 lg:py-24">
        <div className="mx-auto grid grid-cols-1 max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          <AnimatedSection animation="fade-right" className="lg:col-span-6">
            <SectionHeading
              align="left"
              eyebrow="Illustrative scenario"
              title="How returns are"
              highlight="realized in practice"
              description="Every project states its return formula, duration and payout schedule before you invest."
            />
            <ul className="mt-8 space-y-4">
              {RETURN_POINTS.map((pt) => (
                <li key={pt.title} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm leading-relaxed text-muted-foreground">
                    <strong className="font-semibold text-foreground">{pt.title}:</strong> {pt.desc}
                  </span>
                </li>
              ))}
            </ul>
          </AnimatedSection>

          <AnimatedSection animation="fade-left" className="lg:col-span-6">
            <div className="overflow-hidden border border-border bg-card shadow-xl">
              <div className="flex items-center justify-between gap-4 bg-[#040d09] px-6 py-5 text-white sm:px-8">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-300">
                    Sample 6-month project
                  </span>
                  <h3 className="mt-0.5 text-base font-semibold">Commercial cold-chain agro expansion</h3>
                </div>
                <span className="shrink-0 border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-300">
                  18% p.a.
                </span>
              </div>

              <dl className="divide-y divide-border px-6 text-sm sm:px-8">
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-muted-foreground">Principal investment</dt>
                  <dd className="font-semibold tabular-nums text-foreground">৳50,000</dd>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-muted-foreground">Term</dt>
                  <dd className="tabular-nums text-foreground">6 months (180 days)</dd>
                </div>
                <div className="flex items-center justify-between py-3.5">
                  <dt className="text-muted-foreground">Projected profit (9% over 6 months)</dt>
                  <dd className="font-semibold tabular-nums text-primary">+ ৳4,500</dd>
                </div>
                <div className="flex items-center justify-between py-4">
                  <dt className="font-semibold text-foreground">Total payout at maturity</dt>
                  <dd className="text-xl font-semibold tabular-nums text-primary">৳54,500</dd>
                </div>
              </dl>

              <p className="border-t border-border bg-primary/5 px-6 py-4 text-xs leading-relaxed text-muted-foreground sm:px-8">
                <strong className="font-semibold text-foreground">Payout mechanism:</strong> ৳4,500 profit paid in
                milestone tranches; ৳50,000 principal returned at contract maturity. Illustrative only — actual terms
                are set by each project agreement.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 6. Safeguards (dark anchor) ── */}
      <section className="relative overflow-hidden bg-[#040d09] py-20 text-white lg:py-24">
        <div className="pointer-events-none absolute -top-24 right-1/4 h-96 w-96 bg-emerald-500/10 blur-[140px]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-14">
            <SectionHeading
              tone="dark"
              eyebrow="Investor protection"
              title="Built-in"
              highlight="safeguards"
              description="Structural protections at every level — capital flow, ledger accounting and legal enforceability."
            />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SAFEGUARDS.map(({ icon: Icon, title, desc }, idx) => (
              <AnimatedSection key={title} delay={idx * 80} animation="fade-up" className="h-full">
                <div className="h-full border border-white/10 bg-white/[0.04] p-7 transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/[0.07]">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mb-2 text-base font-semibold text-white">{title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. FAQ ── */}
      <section className="bg-muted/40 py-20 lg:py-24">
        <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          <AnimatedSection animation="fade-right" className="lg:col-span-5">
            <SectionHeading
              align="left"
              eyebrow="FAQ"
              title="Questions about"
              highlight="how it works?"
              description="Answers to the most common questions about funding, legal protection and withdrawals."
            />
            <Link
              href="/faq"
              className="group mt-8 inline-flex items-center gap-2 border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              See all FAQs
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </AnimatedSection>
          <AnimatedSection animation="fade-left" delay={100} className="lg:col-span-7">
            <FaqAccordion items={FAQS} />
          </AnimatedSection>
        </div>
      </section>

      {/* ── 8. Final CTA ── */}
      <section className="relative overflow-hidden bg-[#030906] py-20 text-white lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(16,185,129,0.18),transparent)]" />
        <AnimatedSection animation="zoom-in" className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-light tracking-tight text-balance sm:text-5xl">
            Start your investment{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
              journey today
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300">
            Create your account in minutes, verify your NID, and start investing in vetted projects across Bangladesh.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="group inline-flex items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
            >
              Register account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
            >
              Browse live projects
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
