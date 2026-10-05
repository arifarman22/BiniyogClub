"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Network,
  Share2,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

const COMMUNITY_PILLARS = [
  {
    title: "Syndicated Co-Investing",
    desc: "Pool capital with high-net-worth and retail investors to finance large-scale agricultural and commercial projects across Bangladesh.",
    icon: Network,
  },
  {
    title: "Transparent Referral Program",
    desc: "Invite colleagues and friends to invest. Receive automated affiliate credits logged clearly on the double-entry ledger.",
    icon: Share2,
  },
  {
    title: "Verified Community Due Diligence",
    desc: "Every member in our community has completed KYC identity verification, ensuring a trustworthy, compliant network.",
    icon: ShieldCheck,
  },
];

export function CommunitySection() {
  return (
    <section className="relative py-24 lg:py-28 bg-gradient-to-b from-background via-slate-50/50 to-background dark:via-slate-900/30 border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.15]">
            Invest Together.{" "}
            <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg font-normal text-slate-900 dark:text-slate-100 leading-relaxed">
            By aggregating collective purchasing power, Biniyog Club enables everyday investors to participate in high-yield commercial ventures previously accessible only to major conglomerates.
          </p>
        </AnimatedSection>

        {/* Real Community Showcase Banner */}
        <AnimatedSection animation="fade-up" delay={100} className="mb-14">
          <div className="relative rounded-none overflow-hidden border border-border/80 shadow-2xl h-72 sm:h-96 w-full group">
            <Image
              src="/images/investor-community.jpg"
              alt="Biniyog Club Co-Investor Syndicate and Entrepreneurs in Dhaka"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 1200px) 100vw, 1200px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            <div className="absolute top-4 left-4 inline-flex items-center gap-2 rounded-none bg-slate-900/80 backdrop-blur-md border border-white/15 px-3.5 py-1 text-xs text-white">
              <span className="h-2 w-2 rounded-none bg-emerald-400 animate-pulse" />
              <span>Syndicated Co-Investment Network • Dhaka</span>
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">Collaborative Finance</span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">Pooling Capital to Fuel Bangladesh&apos;s Real Economy</h3>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
                  Verified members collaborating with audited commercial ventures across agriculture, cold chain, and SME manufacturing.
                </p>
              </div>
              <Link
                href="/auth/register"
                className="inline-flex items-center gap-2 rounded-none bg-primary px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-lg hover:bg-brand-400 transition-colors shrink-0"
              >
                <span>Join Co-Investors</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </AnimatedSection>

        {/* 3 Pillars Grid */}
        <div className="grid gap-6 sm:grid-cols-3 mb-14">
          {COMMUNITY_PILLARS.map((pillar, i) => {
            const Icon = pillar.icon;
            return (
              <AnimatedSection key={pillar.title} delay={i * 90} animation="fade-up">
                <div className="group rounded-none border border-border/80 bg-card p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 h-full flex flex-col justify-between">
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-none bg-primary/10 text-primary border border-primary/20 mb-5 transition-transform duration-300 group-hover:scale-110">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                      {pillar.title}
                    </h3>
                    <p className="text-sm font-normal text-slate-800 dark:text-slate-200 leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Institutional Standard</span>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Referral Callout Banner */}
        <AnimatedSection animation="fade-up" delay={200}>
          <div className="rounded-none border border-primary/25 bg-gradient-to-r from-emerald-500/10 via-primary/5 to-teal-500/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <span className="rounded-none bg-primary/20 text-primary text-[11px] font-semibold px-3 py-1 uppercase tracking-wider mb-2 inline-block">
                Referral Network
              </span>
              <h4 className="text-xl font-semibold text-foreground">Introduce Friends & Earn Legally Verified Rewards</h4>
              <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 mt-1 max-w-xl">
                Every verified referral who funds a vetted project earns you referral allocations credited directly to your platform wallet.
              </p>
            </div>
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-none bg-primary px-7 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25 hover:bg-brand-400 transition-all shrink-0"
            >
              <span>Join Investor Network</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
