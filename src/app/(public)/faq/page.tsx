import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessageSquare, Phone } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { JsonLd, faqSchema } from "@/components/shared/json-ld";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Investor Knowledge Base | Biniyog Club",
  description:
    "Everything you need to know about investing on Biniyog Club: KYC verification, legal deeds, payments, returns, withdrawals, and risk management in Bangladesh.",
  openGraph: {
    title: "FAQ | Biniyog Club Co-Investment Platform",
    description: "Answers to common questions about direct commercial co-investment, legal security, and return distribution.",
  },
};

const FAQ_SECTIONS = [
  {
    id: "getting-started",
    heading: "Getting started & verification",
    items: [
      {
        q: "Who is eligible to invest on Biniyog Club?",
        a: "Any Bangladeshi citizen aged 18 or above with a valid National ID (NID) or Passport can register and invest. Non-Resident Bangladeshis (NRBs) can also participate using a valid Bangladeshi passport.",
      },
      {
        q: "What is KYC and why is it mandatory?",
        a: "KYC (Know Your Customer) is identity verification required under Bangladesh financial and anti-money-laundering (AML) rules. It confirms every investor's identity and keeps the community secure.",
      },
      {
        q: "How long does verification take?",
        a: "Our compliance team reviews each KYC submission and you'll be notified as soon as it's approved. Clear, complete documents are processed fastest.",
      },
    ],
  },
  {
    id: "investing",
    heading: "Investing & how it works",
    items: [
      {
        q: "What is the minimum investment amount?",
        a: "Project investments start from ৳5,000. Business group tiers have their own minimums, clearly shown on each group and tier page.",
      },
      {
        q: "Can I diversify across multiple projects and groups?",
        a: "Yes. You can invest in several projects and business groups at once — spreading across sectors such as agro, SME trade and business groups helps manage risk.",
      },
      {
        q: "What payment methods are supported?",
        a: "Pay by bank transfer (BEFTN/NPSB/RTGS) into the project's designated bank account, or via mobile banking (bKash/Nagad). Upload your payment proof and our finance team verifies it before confirming your investment.",
      },
      {
        q: "What happens if a project does not reach its funding goal?",
        a: "If a project doesn't reach its funding goal by the deadline, investor funds are handled as set out in the project agreement, which you can review before investing.",
      },
    ],
  },
  {
    id: "returns",
    heading: "Returns, wallet & withdrawals",
    items: [
      {
        q: "What returns can I expect?",
        a: "Returns vary by sector, duration and tier. Each project shows its expected return, formula and payout schedule upfront, before you invest.",
      },
      {
        q: "How do I withdraw my profits and capital?",
        a: "Scheduled payouts and matured principal are credited to your Biniyog Club wallet. Submit a withdrawal request anytime to transfer funds to your verified Bangladeshi bank account or mobile wallet.",
      },
      {
        q: "Are there any hidden fees?",
        a: "No. Any charges that apply are disclosed in the project terms before you invest — what you see is what is credited to your wallet.",
      },
    ],
  },
  {
    id: "legal",
    heading: "Legal protection & capital safety",
    items: [
      {
        q: "Is my investment legally binding?",
        a: "Yes. Every investment is recorded against an individual digital agreement under the Bangladesh Contract Act 1872, and you receive a PDF certificate with a verification code.",
      },
      {
        q: "Where is my money kept?",
        a: "You pay directly into the project's designated bank account, not into a general platform account. Funds are released to the business according to the project plan, and every movement is recorded on our double-entry ledger.",
      },
      {
        q: "What secures these investments?",
        a: "Collateral and covenants vary by project — such as physical assets and contractual guarantees — and are described in each project's documents before listing.",
      },
    ],
  },
];

export default function FaqPage() {
  const allFaqs = FAQ_SECTIONS.flatMap((s) => s.items);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <JsonLd data={faqSchema(allFaqs)} />

      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-[#040d09] py-20 text-white lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_50%_0%,rgba(16,185,129,0.2),transparent)]" />
        <AnimatedSection animation="fade-down" className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
            <span className="h-px w-5 bg-emerald-400/70" />
            Knowledge base
            <span className="h-px w-5 bg-emerald-400/70" />
          </div>
          <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Frequently asked{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
              questions
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Everything you need to know about investing on Biniyog Club — from account setup and legal deeds to returns
            and withdrawals.
          </p>

          <nav aria-label="FAQ categories" className="mt-9 flex flex-wrap justify-center gap-2">
            {FAQ_SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="border border-white/20 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:border-emerald-400/60 hover:text-white"
              >
                {s.heading}
              </a>
            ))}
          </nav>
        </AnimatedSection>
      </section>

      {/* ── 2. FAQ sections ── */}
      <section className="bg-background py-20 lg:py-24">
        <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
          {/* Sticky category index (desktop) */}
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-36">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-primary">Categories</p>
              <ol className="border-l border-border">
                {FAQ_SECTIONS.map((s, i) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="-ml-px flex items-baseline gap-3 border-l-2 border-transparent py-2.5 pl-5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
                    >
                      <span className="tabular-nums text-primary/60">0{i + 1}</span>
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ol>

              <div className="mt-10 border border-border bg-muted/40 p-6">
                <MessageSquare className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">Can&apos;t find your answer?</p>
                <p className="mt-1 text-sm text-muted-foreground">Our investor desk is happy to help.</p>
                <Link
                  href="/contact"
                  className="group mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  Contact us
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </aside>

          <div className="space-y-16 lg:col-span-8">
            {FAQ_SECTIONS.map(({ id, heading, items }, i) => (
              <AnimatedSection key={id} animation="fade-up">
                <div id={id} className="scroll-mt-32">
                  <div className="mb-4 flex items-baseline gap-3">
                    <span className="text-sm font-semibold tabular-nums text-primary">0{i + 1}</span>
                    <h2 className="text-2xl font-light tracking-tight text-foreground sm:text-3xl">{heading}</h2>
                  </div>
                  <FaqAccordion items={items} />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Support CTA ── */}
      <section className="relative overflow-hidden bg-[#030906] py-20 text-white lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(16,185,129,0.18),transparent)]" />
        <AnimatedSection animation="zoom-in" className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-light tracking-tight text-balance sm:text-5xl">
            Have a question{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
              not answered here?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300">
            Our investor relations desk in Mohakhali, Dhaka is available Saturday to Thursday, 9:00 AM – 6:00 PM (closed Friday).
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
            >
              Contact investor desk
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="tel:+8801335149033"
              className="inline-flex items-center justify-center gap-2 border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
            >
              <Phone className="h-4 w-4 text-emerald-300" />
              +880 1335-149033
            </a>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
