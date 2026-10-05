"use client";

import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ShieldCheck, ChevronRight, ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

interface FinalCtaSectionProps {
  totalInvestors: number;
}

export function FinalCtaSection({ totalInvestors }: FinalCtaSectionProps) {
  return (
    <section className="relative overflow-hidden py-24 lg:py-28 text-white bg-[#030906] border-t border-emerald-950/60">
      {/* Background Visual and Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        <Image src="/images/smart-agro-farm.jpg" alt="Biniyog Club Investment In Bangladesh Real Economy" fill className="object-cover object-center opacity-25" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030906] via-[#030906]/90 to-[#030906]/80" />
        <div className="absolute inset-0 bg-radial-gradient from-emerald-500/15 via-transparent to-transparent pointer-events-none" />
      </div>

      <AnimatedSection animation="zoom-in" className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-none border border-emerald-500/30 bg-emerald-950/80 px-4 py-1.5 text-xs sm:text-sm font-medium text-emerald-300 backdrop-blur-md shadow-lg shadow-black/40">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-400" />
          </span>
          <span>Join {totalInvestors > 0 ? totalInvestors.toLocaleString() : "4"}+ verified investors earning scheduled returns</span>
        </div>

        <h2 className="mb-6 text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-[1.15]">
          Ready to Invest in <br />
          <span className="font-semibold bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text text-transparent">
            Bangladesh&apos;s Real Economy?
          </span>
        </h2>

        <p className="mb-10 text-slate-300 font-normal text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
          Create your investor account in under 2 minutes. Gain direct access to admin-vetted business groups, institutional transparency, and legally protected digital contracts.
        </p>

        {/* Key Value Assurances */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm text-slate-300/90 mb-10">
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Start from ৳5,000
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> Legally Enforceable Contracts
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Direct Bank & MFS Payouts
          </span>
        </div>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/auth/register"
            className="group relative inline-flex items-center justify-center gap-2 rounded-none bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 px-9 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-600/30 transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto overflow-hidden"
          >
            <span>Create Free Investor Account</span>
            <ChevronRight className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-none border border-white/25 bg-white/10 backdrop-blur-md px-9 py-4 text-base font-medium text-white transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:-translate-y-0.5 active:translate-y-0 w-full sm:w-auto"
          >
            Talk to Our Advisory Team
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}
