"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

const PLATFORM_FEATURES = [
  {
    id: "portfolio",
    title: "Portfolio Overview & Growth",
    desc: "Real-time metrics on capital deployed, annualized expected yields, active ventures, and scheduled distributions.",
    iconImg: "/icons/wired-outline-1827-growing-plant-hover-pinch.gif",
    badge: "Real-time Analytics",
    statsPreview: {
      headline: "Portfolio Yield: 18.5% Projected",
      subline: "3 Active Ventures • 100% On-Time Disbursals",
    },
  },
  {
    id: "transactions",
    title: "Double-Entry Transaction Tracking",
    desc: "Every bank deposit, wallet allocation, and profit return is logged onto an immutable double-entry ledger with instant verification.",
    iconImg: "/icons/wired-outline-1121-internet-of-things-hover-pinch.gif",
    badge: "Permanent Audit Trail",
    statsPreview: {
      headline: "Immutable Ledger Verification",
      subline: "Mathematical debit-credit validation per transaction",
    },
  },
  {
    id: "investments",
    title: "Project & Group Allocation",
    desc: "Direct investment options into audited agricultural farms, commercial trade, real estate developments, and SME business groups.",
    iconImg: "/icons/wired-lineal-37-check-hover-pinch.gif",
    badge: "Direct Allocation",
    statsPreview: {
      headline: "Direct Legal Contracts",
      subline: "Formal digital deeds signed per investment tier",
    },
  },
  {
    id: "kyc",
    title: "Rapid KYC & NID Verification",
    desc: "Digital identity checks protecting community compliance, ensuring only verified citizens and businesses participate.",
    iconImg: "/icons/wired-outline-981-avatars-chatting-hover-conversation.gif",
    badge: "Regulatory Alignment",
    statsPreview: {
      headline: "100% KYC-Verified Members",
      subline: "NID, Smart Card, & Passport Verification Engine",
    },
  },
  {
    id: "wallet",
    title: "Wallet & Instant Disbursals",
    desc: "Receive returns directly into your Biniyog Club wallet. Seamlessly withdraw to Bangladeshi bank accounts or bKash/Nagad.",
    iconImg: "/icons/system-outline-392-credit-card-back-hover-pinch.gif",
    badge: "Direct Payouts",
    statsPreview: {
      headline: "Bank & MFS Integration",
      subline: "Direct withdraw to BEFTN/NPSB & Mobile Wallets",
    },
  },
];

export function PlatformFeaturesSection() {
  const [selectedFeature, setSelectedFeature] = useState(0);
  const current = PLATFORM_FEATURES[selectedFeature];

  return (
    <section className="relative py-24 lg:py-28 bg-background" id="features">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="mb-16">
          <SectionHeading
            eyebrow="Platform features"
            title="Engineered for"
            highlight="precision & scale"
            description="Every feature on Biniyog Club is purpose-built to deliver institutional clarity, regulatory compliance, and total control over your investments."
          />
        </AnimatedSection>

        {/* Split Layout */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          {/* Left: Interactive Feature List */}
          <div className="lg:col-span-6 space-y-3">
            {PLATFORM_FEATURES.map((feature, idx) => {
              const isSelected = selectedFeature === idx;
              return (
                <div
                  key={feature.id}
                  onClick={() => setSelectedFeature(idx)}
                  className={`group cursor-pointer rounded-none border p-5 transition-all duration-300 ${
                    isSelected
                      ? "border-primary/50 bg-primary/5 shadow-md shadow-primary/5 dark:bg-emerald-950/20"
                      : "border-border/70 bg-card hover:border-primary/30 hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-none p-1 bg-transparent transition-transform duration-300 group-hover:scale-105"
                    >
                      <Image
                        src={feature.iconImg}
                        alt={feature.title}
                        width={40}
                        height={40}
                        unoptimized
                        className="object-contain"
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3
                          className={`text-base font-semibold transition-colors ${
                            isSelected ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {feature.title}
                        </h3>
                        <span className="rounded-none bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                          {feature.badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm font-normal text-muted-foreground leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Large Dashboard Interactive Preview */}
          <div className="lg:col-span-6">
            <AnimatedSection animation="fade-left" delay={150}>
              <div className="relative rounded-none border border-border/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
                {/* Background Ambient Glow */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 h-64 w-64 bg-emerald-500/15 blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 h-64 w-64 bg-teal-500/15 blur-3xl pointer-events-none" />

                {/* Header Mockup */}
                <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-none p-1 bg-transparent">
                      <Image
                        src={current.iconImg}
                        alt={current.title}
                        width={40}
                        height={40}
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">{current.title}</h4>
                      <p className="text-[11px] text-emerald-400 font-medium">{current.badge}</p>
                    </div>
                  </div>
                  <span className="rounded-none bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-300 border border-emerald-500/30">
                    Live Demo
                  </span>
                </div>

                {/* Dynamic Content Panel */}
                <div className="rounded-none border border-white/10 bg-white/5 p-5 mb-6 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Status Overview</p>
                  <h4 className="text-lg font-bold text-white mb-2">{current.statsPreview.headline}</h4>
                  <p className="text-xs text-slate-300">{current.statsPreview.subline}</p>

                  <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-none bg-white/5 border border-white/5">
                      <span className="text-slate-400 text-[11px]">System Status</span>
                      <p className="text-emerald-400 font-semibold mt-0.5 flex items-center gap-1">
                        <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse" /> Operational
                      </p>
                    </div>
                    <div className="p-3 rounded-none bg-white/5 border border-white/5">
                      <span className="text-slate-400 text-[11px]">Audit Protocol</span>
                      <p className="text-slate-200 font-semibold mt-0.5">Automated Double-Entry</p>
                    </div>
                  </div>
                </div>

                {/* Additional Feature Checkpoints */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Real-time reconciliation of investor wallet balances</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Instant access to signed digital deed contracts (PDF)</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs text-slate-300">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    <span>Dedicated finance officer audit on bank wire deposits</span>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
