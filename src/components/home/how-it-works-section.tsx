"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Create Your Account",
    desc: "Register in under 2 minutes. Instant digital identity checks with NID/Passport verification.",
    image: "/images/digital-kyc-verify.jpg",
    tag: "Fast Onboarding",
  },
  {
    step: "02",
    title: "Explore Vetted Portfolios",
    desc: "Compare reviewed agricultural and commercial ventures with audited returns and transparent disclosures.",
    image: "/images/smart-agro-farm.jpg",
    tag: "Vetted Portfolios",
  },
  {
    step: "03",
    title: "Direct Legal Contract",
    desc: "Fund seamlessly via Bank or MFS. Every investment is bound by an enforceable digital deed.",
    image: "/images/contract-security.jpg",
    tag: "Legally Protected",
  },
  {
    step: "04",
    title: "Receive Return Payouts",
    desc: "Track milestone progress in real time and receive scheduled return payouts directly to your wallet.",
    image: "/images/wallet-returns-payout.jpg",
    tag: "Automated Returns",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-24 lg:py-28 bg-muted/40" id="how-it-works">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="mb-16">
          <SectionHeading
            eyebrow="Four simple steps"
            title="How Biniyog Club"
            highlight="Works"
            description="From registration to scheduled profit payouts directly into your bank or mobile wallet."
          />
        </AnimatedSection>

        {/* 4-Step Flow */}
        <div className="relative">
          {/* Desktop Horizontal Connecting Line */}
          <div className="hidden lg:block absolute top-1/2 left-[12%] right-[12%] h-[2px] -translate-y-12 bg-gradient-to-r from-emerald-500/20 via-primary to-emerald-500/20 z-0" />

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 relative z-10">
            {HOW_IT_WORKS_STEPS.map((stepItem, i) => (
              <AnimatedSection key={stepItem.step} delay={i * 100} animation="fade-up">
                <div className="group relative flex flex-col h-full rounded-none border border-border/80 bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
                  {/* Real Generated Image Preview */}
                  <div className="relative h-36 w-full rounded-none overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={stepItem.image}
                      alt={stepItem.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                    <span className="absolute top-2.5 right-2.5 rounded-none bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-white font-mono border border-white/10">
                      STEP {stepItem.step}
                    </span>
                    <span className="absolute bottom-2 left-2.5 rounded-none bg-emerald-950/80 backdrop-blur-md border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
                      {stepItem.tag}
                    </span>
                  </div>

                  <h3 className="mb-2 text-base sm:text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
                    {stepItem.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-normal text-muted-foreground leading-relaxed">
                    {stepItem.desc}
                  </p>

                  {/* Desktop connector arrow badge */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute -right-3.5 top-1/2 -translate-y-1/2 z-20">
                      <div className="flex h-7 w-7 items-center justify-center rounded-none border border-border bg-card shadow-md text-primary">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-2 rounded-none border border-border/80 bg-card px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md"
          >
            <span>Explore Detailed Investment Guide</span>
            <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
