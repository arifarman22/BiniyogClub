import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, HelpCircle, ArrowRight, MessageSquare, Phone, Mail } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

export const metadata: Metadata = {
  title: "Frequently Asked Questions — Investor Knowledge Base | Biniyog Club",
  description:
    "Everything you need to know about investing on Biniyog Club: KYC verification, legal deeds, bank escrow, returns, withdrawals, and risk management in Bangladesh.",
  openGraph: {
    title: "FAQ | Biniyog Club Co-Investment Platform",
    description: "Answers to common questions about direct commercial co-investment, legal security, and return distribution.",
  },
};

const FAQ_SECTIONS = [
  {
    heading: "Getting Started & Identity Verification",
    items: [
      {
        q: "Who is eligible to invest on Biniyog Club?",
        a: "Any Bangladeshi citizen aged 18 or above with a valid National ID (NID) or Passport can register and invest. Non-Resident Bangladeshis (NRBs) can also participate using their valid passport or dual citizenship documents.",
      },
      {
        q: "What is KYC and why is it mandatory?",
        a: "KYC (Know Your Customer) is an identity verification protocol required under Bangladesh financial laws and anti-money laundering (AML) regulations. It verifies each investor to maintain a 100% compliant, secure co-investment community.",
      },
      {
        q: "How fast is the verification process?",
        a: "Our automated verification engine processes most NID submissions in under 2 minutes. In cases requiring manual document cross-checking, our compliance team reviews submissions within 2 to 4 business hours.",
      },
    ],
  },
  {
    heading: "Investing & Co-Investment Mechanics",
    items: [
      {
        q: "What is the minimum investment amount?",
        a: "The minimum entry threshold across project syndicates starts at just ৳5,000. Institutional Business Groups and higher-tier directorships have specific tier allocations clearly marked on their dossier cards.",
      },
      {
        q: "Can I diversify across multiple projects and groups?",
        a: "Yes! In fact, we actively recommend spreading allocations across various sectors (such as Agro, SME trade finance, cold storage, and Business Groups) to optimize risk-adjusted returns.",
      },
      {
        q: "What payment methods are supported for funding?",
        a: "You can fund your allocation via instant Bangladeshi Bank Transfer (BEFTN/NPSB/RTGS) directly into the project's segregated escrow account, or via approved Mobile Financial Services (bKash/Nagad).",
      },
      {
        q: "What happens if a project does not meet its target goal?",
        a: "If a project fails to achieve its designated minimum syndication threshold before its funding deadline, 100% of co-investor funds are released from escrow and returned directly to investor wallets with zero deduction.",
      },
    ],
  },
  {
    heading: "Returns, Wallet & Withdrawals",
    items: [
      {
        q: "What returns can I realistically expect?",
        a: "Annualized projected returns typically range from 14% to 26% depending on the sector, duration, and collateral tier. All formulas, historical benchmarks, and milestone schedules are published transparently on each opportunity page.",
      },
      {
        q: "How do I withdraw my profits and capital?",
        a: "Whenever a scheduled payout occurs or a project reaches maturity, the funds are credited instantly to your Biniyog Club wallet. You can submit a withdrawal request anytime to transfer funds directly into your verified Bangladeshi bank account or MFS wallet.",
      },
      {
        q: "Are there any hidden fees or deduction charges?",
        a: "Zero hidden charges. Biniyog Club operates on complete transparency. Any platform structuring fee is charged to the borrowing enterprise upfront and never deducted from investor yields.",
      },
    ],
  },
  {
    heading: "Legal Enforceability & Capital Protection",
    items: [
      {
        q: "Is my investment legally binding and enforceable?",
        a: "Yes. Every co-investment generates an individualized digital agreement executed and countersigned under the Bangladesh Contract Act 1872. Each contract carries cryptographic timestamps and is legally binding in Bangladeshi courts.",
      },
      {
        q: "Where is my money kept before disbursal?",
        a: "Investor funds are held strictly in segregated bank escrow accounts at scheduled commercial banks in Bangladesh. Capital is released to the business only in tranches when our on-site team verifies milestone progress.",
      },
      {
        q: "What collateral secures these investments?",
        a: "Enterprises pledge tangible physical assets (machinery, inventory, real property), director personal guarantees, and post-dated security cheques as legal covenants before listing.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 py-20 lg:py-24 text-white border-b border-border/40">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-down">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-emerald-300 backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>INVESTOR KNOWLEDGE BASE & SUPPORT</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-3xl mx-auto leading-tight">
              Frequently Asked{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Questions
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg font-normal text-slate-100 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about investing on Biniyog Club—from account setup and legal deeds to returns and bank withdrawals.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 2. FAQ Accordion Grid ── */}
      <section className="py-20 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {FAQ_SECTIONS.map(({ heading, items }, sIdx) => (
              <AnimatedSection key={heading} delay={sIdx * 80} animation="fade-up">
                <div className="border-b border-border/70 pb-3 mb-6">
                  <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    {heading}
                  </h2>
                </div>

                <div className="space-y-4">
                  {items.map(({ q, a }) => (
                    <div
                      key={q}
                      className="rounded-3xl border border-slate-200/90 dark:border-white/10 bg-card p-6 shadow-sm transition-all duration-300 hover:border-emerald-500/40 hover:shadow-md"
                    >
                      <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-start gap-2.5">
                        <HelpCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{q}</span>
                      </h3>
                      <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed pl-6.5">
                        {a}
                      </p>
                    </div>
                  ))}
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Contact Support Box */}
          <AnimatedSection animation="fade-up" delay={200}>
            <div className="mt-16 rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <MessageSquare className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Have a Question Not Answered Here?</h3>
              <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 max-w-md mx-auto mb-6">
                Our investor relations desk in Mohakhali C/A, Dhaka is available Sunday through Thursday, 9:00 AM – 6:00 PM BST.
              </p>
              <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
                >
                  Contact Investor Desk <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="tel:+8801335149033"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 bg-card px-6 py-3 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white hover:border-emerald-500/50 transition-all"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> +880 1335-149033
                </a>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
