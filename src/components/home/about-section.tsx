"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

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
    <section className="relative py-24 lg:py-28 bg-gradient-to-b from-background via-emerald-50/20 to-background dark:via-emerald-950/10 border-b border-border/50 overflow-hidden" id="about">
      {/* Background ambient orbs */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* ── Left: Real Due Diligence Image & Governance Card ── */}
          <AnimatedSection animation="fade-right" delay={100} className="lg:col-span-5">
            <div className="relative rounded-none border border-border/80 bg-card overflow-hidden shadow-2xl group">
              {/* Photorealistic Real Due Diligence Photo */}
              <div className="relative h-72 sm:h-80 w-full overflow-hidden">
                <Image
                  src="/images/about-due-diligence.jpg"
                  alt="Biniyog Club Financial Analysts and Legal Auditors in Dhaka"
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                
                {/* Floating Top Badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-none bg-slate-900/80 backdrop-blur-md border border-white/15 px-3.5 py-1 text-xs text-white">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>On-Site Due Diligence Team</span>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase">Dhaka Headquarters</span>
                  <p className="text-sm font-semibold text-white mt-0.5">Physical Site & Financial Audits</p>
                </div>
              </div>

              {/* Bottom Card Summary */}
              <div className="p-6 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white">
                <div className="grid grid-cols-2 gap-3 text-xs mb-4">
                  <div className="rounded-none border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Governance</p>
                    <p className="text-sm font-bold text-white mt-0.5">Bangladesh Law</p>
                    <p className="text-[10px] text-emerald-400 mt-1">Contract Act 1872</p>
                  </div>
                  <div className="rounded-none border border-white/10 bg-white/5 p-3">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Ledger Audit</p>
                    <p className="text-sm font-bold text-white mt-0.5">Double-Entry</p>
                    <p className="text-[10px] text-emerald-400 mt-1">Zero Tampering</p>
                  </div>
                </div>

                <div className="rounded-none bg-emerald-950/50 border border-emerald-500/30 p-3 flex items-center justify-between text-xs text-slate-200">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    Multi-tier physical checks on every asset
                  </span>
                  <span className="font-bold text-emerald-400">Verified</span>
                </div>
              </div>
            </div>
          </AnimatedSection>

          {/* ── Right: About Copy & 4 Feature Pillars ── */}
          <div className="lg:col-span-7">
            <AnimatedSection animation="fade-left" delay={150}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.15] mb-5">
                Democratizing Direct Institutional Investments in{" "}
                <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Bangladesh
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-normal leading-relaxed mb-4">
                Biniyog Club was established with a clear mandate: to bridge the gap between conscientious co-investors and high-potential, vetted commercial opportunities in Bangladesh.
              </p>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed mb-8">
                By combining institutional-grade financial analysis, direct legal enforceability, and an immutable double-entry ledger, we give everyday investors and institutions access to structured wealth creation previously reserved for private equity firms.
              </p>

              {/* 4 Feature Cards Grid */}
              <div className="grid sm:grid-cols-2 gap-4 mb-8">
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
                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-14 leading-relaxed">
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
