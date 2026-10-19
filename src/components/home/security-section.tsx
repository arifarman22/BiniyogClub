"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  Lock,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  Server,
  UserCheck,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

const SECURITY_PILLARS = [
  {
    title: "Double-Entry Ledger Immutability",
    desc: "Every transaction is recorded with mathematical debit-credit balance checks, preventing unilateral modifications or phantom balances.",
    icon: Lock,
  },
  {
    title: "Legally Binding Digital Agreements",
    desc: "Every allocation generates a timestamped digital contract executed under the Contract Act of Bangladesh, establishing direct legal rights.",
    icon: FileCheck,
  },
  {
    title: "Escrow Segregation Principle",
    desc: "Capital contributed by co-investors is segregated by project and held strictly separated from Biniyog Club's corporate operations.",
    icon: ShieldCheck,
  },
  {
    title: "Finance Specialist Multi-Check",
    desc: "Incoming bank wires and mobile financial service payments are manually inspected and approved by finance officers before allocation.",
    icon: CheckCircle2,
  },
  {
    title: "Mandatory KYC Identity Screening",
    desc: "All co-investors submit verified National Identity (NID) or Passport records, safeguarding the integrity of the collective ecosystem.",
    icon: UserCheck,
  },
  {
    title: "Data Confidentiality & Privacy",
    desc: "Sensitive identification records, bank statements, and tax data are encrypted and accessible only to authorized compliance personnel.",
    icon: Server,
  },
];

export function SecuritySection() {
  return (
    <section className="relative py-24 lg:py-28 bg-muted/40 text-foreground overflow-hidden" id="security">
      {/* Background radial highlights */}
      <div className="absolute top-0 right-1/4 -mt-24 h-96 w-96 bg-emerald-300/15 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-24 h-96 w-96 bg-teal-300/15 blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Text & Security Pillars */}
          <div className="lg:col-span-6">
            <AnimatedSection animation="fade-right" delay={50}>
              <SectionHeading
                align="left"
                eyebrow="Transparency"
                title="Clarity, Accountability"
                highlight="& Informed Decisions"
                description="Bangladeshi co-investors deserve uncompromising rigor. Biniyog Club pairs ledger precision with enforceable legal contracts to safeguard your capital at every step."
                className="mb-8"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                {SECURITY_PILLARS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-none border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-emerald-50 text-emerald-700">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-900 leading-snug">{item.title}</h4>
                      </div>
                      <p className="text-xs text-slate-600 pl-10 leading-relaxed font-normal">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/about"
                  className="group inline-flex items-center justify-center gap-2 rounded-none bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <span>Our Due Diligence Approach</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 rounded-none border border-emerald-600 bg-white px-7 py-3.5 text-sm font-medium text-emerald-800 transition-all hover:bg-emerald-50 w-full sm:w-auto"
                >
                  Security & Compliance FAQ
                </Link>
              </div>
            </AnimatedSection>
          </div>

          {/* Right: Transparency infographic */}
          <div className="lg:col-span-6">
            <AnimatedSection animation="fade-left" delay={150}>
              <div className="relative mx-auto aspect-[1122/1402] w-full max-w-lg overflow-hidden border border-border shadow-xl">
                <Image
                  src="/images/Transparency in Fintech Accountability.png"
                  alt="Transparency at Biniyog Club: double-entry ledger, legally binding agreements, escrow segregation, finance multi-check, KYC screening and data confidentiality"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 32rem, 40vw"
                />
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
