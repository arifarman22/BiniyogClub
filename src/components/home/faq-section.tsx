"use client";

import Link from "next/link";
import { PhoneCall, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { SectionHeading } from "@/components/home/section-heading";

export function FaqSection() {
  return (
    <section className="relative bg-muted/40 py-24 lg:py-28" id="faq">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-16 lg:px-8">
        <AnimatedSection animation="fade-right" className="lg:col-span-5">
          <div className="lg:sticky lg:top-36">
            <SectionHeading
              align="left"
              eyebrow="FAQ"
              title="Everything you need to"
              highlight="know"
              description="Clear answers on security, compliance, minimum investments, and payout cycles."
            />

            <div className="mt-10 border border-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-foreground">Still have questions?</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Our investor relations team can help with contract details, bank transfers, and legal deeds.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-colors hover:bg-brand-500"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  Talk to an advisor
                </Link>
                <Link
                  href="/faq"
                  className="group inline-flex items-center gap-1.5 border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                >
                  All FAQs
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </AnimatedSection>

        <AnimatedSection animation="fade-left" delay={100} className="lg:col-span-7">
          <FaqAccordion />
        </AnimatedSection>
      </div>
    </section>
  );
}
