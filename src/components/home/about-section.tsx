"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

const ABOUT_PILLARS = [
  {
    title: "Secure Platform",
    desc: "Rigorous due diligence, multi-tier audits, and segregated escrow management for all allocations.",
    iconImg: "/icons/secure-platform.jpg",
  },
  {
    title: "Transparent Process",
    desc: "Full milestone transparency, audited yield formulas, and zero hidden deductions.",
    iconImg: "/icons/transparent-process.jpg",
  },
  {
    title: "Modern Technology",
    desc: "Double-entry cryptographic ledger architecture ensuring balance immutability and instant reconciliation.",
    iconImg: "/icons/modern-technology.jpg",
  },
  {
    title: "User-Focused Experience",
    desc: "Seamless NID onboarding, real-time dashboard analytics, and direct payouts to bank or MFS accounts.",
    iconImg: "/icons/user-experience.jpg",
  },
];

export function AboutSection() {
  return (
    <section className="relative py-24 lg:py-28 bg-background overflow-hidden" id="about">
      {/* Background ambient orbs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* ── Left: Biniyog Club image ── */}
          <AnimatedSection animation="fade-right" delay={100} className="lg:col-span-5">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden border border-border/80 shadow-2xl">
              <Image
                src="/images/biniyog.png"
                alt="Invest today, reap tomorrow — Biniyog Club"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 28rem, 40vw"
              />
            </div>
          </AnimatedSection>

          {/* ── Right: About Copy & 4 Feature Pillars ── */}
          <div className="lg:col-span-7">
            <AnimatedSection animation="fade-left" delay={150}>
              <SectionHeading
                align="left"
                eyebrow="About Biniyog Club"
                title="Discover the Power of"
                highlight="Collective Opportunities"
                description="Biniyog Club was established with a clear mandate: to bridge the gap between conscientious co-investors and high-potential, vetted commercial opportunities in Bangladesh."
                className="mb-4 max-w-none"
              />

              <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed mb-8">
                By combining institutional-grade financial analysis, direct legal enforceability, and an immutable double-entry ledger, we give everyday investors and institutions access to structured wealth creation previously reserved for private equity firms.
              </p>

              {/* 4 Feature Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {ABOUT_PILLARS.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="group rounded-none border border-border/80 bg-card p-4 transition-all duration-300 hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <div className="relative h-11 w-11 shrink-0 rounded-none overflow-hidden shadow-sm border border-emerald-500/25 bg-slate-950 transition-transform duration-300 group-hover:scale-110">
                        <Image
                          src={pillar.iconImg}
                          alt={pillar.title}
                          fill
                          className="object-cover"
                          sizes="44px"
                        />
                      </div>
                      <h4 className="text-sm font-semibold text-foreground">{pillar.title}</h4>
                    </div>
                    <p className="text-xs font-normal text-muted-foreground pl-14 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Action Link */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/about"
                  className="group inline-flex items-center justify-center gap-2 rounded-none bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-brand-400 hover:shadow-primary/30 hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <span>Our Methodology & Team</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/how-it-works"
                  className="inline-flex items-center justify-center gap-2 rounded-none border border-border bg-card px-7 py-3.5 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary w-full sm:w-auto"
                >
                  How The Platform Works
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
