"use client";

import Image from "next/image";
import {
  ShieldCheck,
  Eye,
  Cpu,
  Coins,
  LayoutDashboard,
  Headphones,
  CheckCircle2,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

const WHY_CHOOSE_CARDS = [
  {
    title: "Secure Infrastructure",
    desc: "Rigorous due diligence, asset-backed structures, and bank-verified custody ensure capital is segregated and legally safeguarded.",
    icon: ShieldCheck,
    tag: "Bank-Grade Custody",
    image: "/images/contract-security.jpg",
  },
  {
    title: "Transparent Experience",
    desc: "100% upfront fee disclosures, detailed financial statements, and milestone disclosures without hidden costs or penalties.",
    icon: Eye,
    tag: "Zero Hidden Fees",
    image: "/images/about-due-diligence.jpg",
  },
  {
    title: "Modern Technology",
    desc: "Built on an immutable double-entry ledger architecture with instant digital contracts and automated accounting balance checks.",
    icon: Cpu,
    tag: "Double-Entry Ledger",
    image: "/images/digital-kyc-verify.jpg",
  },
  {
    title: "Easy Access",
    desc: "Democratized threshold starting from ৳5,000, enabling both retail and corporate co-investors to participate in premier commercial ventures.",
    icon: Coins,
    tag: "Start from ৳5,000",
    image: "/images/smart-agro-farm.jpg",
  },
  {
    title: "User-Centered Platform",
    desc: "Intuitive dashboard for tracking yields, analyzing portfolio growth, downloading legal deeds, and receiving direct notifications.",
    icon: LayoutDashboard,
    tag: "Real-Time Tracking",
    image: "/images/wallet-returns-payout.jpg",
  },
  {
    title: "Professional Support",
    desc: "Dedicated relationship managers and finance officers available to assist with contract verification, bank transfers, and payouts.",
    icon: Headphones,
    tag: "Institutional Care",
    image: "/images/cold-chain-sme.jpg",
  },
];

export function WhyChooseSection() {
  return (
    <section className="relative py-24 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="mb-16">
          <SectionHeading
            eyebrow="Why investors choose us"
            title="Why Choose"
            highlight="Biniyog Club?"
            description="Engineered with private equity discipline, institutional governance, and radical transparency for Bangladeshi investors."
          />
        </AnimatedSection>

        {/* 6 Feature Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {WHY_CHOOSE_CARDS.map((card, i) => {
            const Icon = card.icon;
            return (
              <AnimatedSection key={card.title} delay={i * 80} animation="fade-up">
                <div className="group relative flex flex-col justify-between h-full rounded-none border border-border/80 bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 overflow-hidden">
                  {/* Subtle top gradient accent line */}
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent group-hover:via-primary transition-all duration-500" />

                  {/* Corner ambient glow */}
                  <div className="absolute -right-8 -top-8 h-24 w-24 bg-primary/5 blur-xl group-hover:scale-150 group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />

                  <div>
                    {/* Real Image Header */}
                    <div className="relative h-32 w-full rounded-none overflow-hidden mb-4 bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={card.image}
                        alt={card.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-slate-950/20 to-transparent" />
                      <div className="absolute top-2.5 left-2.5 flex h-8 w-8 items-center justify-center rounded-none bg-slate-900/80 backdrop-blur-md text-emerald-400 border border-white/10 shadow-sm">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="absolute top-2.5 right-2.5 rounded-none bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-semibold text-white border border-white/10">
                        {card.tag}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2.5 group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>

                    <p className="text-sm font-normal text-muted-foreground leading-relaxed">
                      {card.desc}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-border/60 flex items-center gap-1.5 text-xs font-semibold text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Verified Feature Standard</span>
                  </div>
                </div>
              </AnimatedSection>
            );
          })}
        </div>
      </div>
    </section>
  );
}
