"use client";

import Link from "next/link";
import { PhoneCall } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { FaqAccordion } from "@/components/shared/faq-accordion";

export function FaqSection() {
  return (
    <section className="relative py-24 lg:py-28 bg-gradient-to-b from-emerald-50/20 via-slate-50/40 to-background dark:from-emerald-950/10 dark:via-slate-900/30 dark:to-background border-b border-border/50" id="faq">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="mb-14 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.15]">
            Everything You Need to{" "}
            <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Know
            </span>
          </h2>
          <p className="mt-3.5 text-base sm:text-lg font-normal text-slate-900 dark:text-slate-100">
            Clear answers regarding security, compliance, minimum investments, and payout cycles.
          </p>
        </AnimatedSection>

        {/* Reusable FaqAccordion component */}
        <FaqAccordion />

        {/* Quick Support Card */}
        <AnimatedSection animation="fade-up" delay={150}>
          <div className="mt-12 rounded-none border border-border/80 bg-slate-50 dark:bg-slate-900/60 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left shadow-sm">
            <div>
              <h4 className="text-base font-semibold text-foreground">Still have questions about investing?</h4>
              <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 mt-1 max-w-lg">
                Our investor relations team is ready to assist you with contract details, bank wires, and legal deeds.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/faq"
                className="inline-flex items-center gap-1.5 rounded-none border border-border bg-card px-5 py-2.5 text-xs sm:text-sm font-semibold text-foreground hover:border-primary hover:text-primary transition-all shadow-sm"
              >
                All FAQs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 rounded-none bg-primary px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-brand-400 transition-all shadow-md shadow-primary/20"
              >
                <PhoneCall className="h-3.5 w-3.5" />
                <span>Talk to Advisor</span>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
