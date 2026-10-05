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
    <section className="relative py-24 lg:py-28 bg-[#040d09] text-white border-b border-emerald-950/60 overflow-hidden" id="security">
      {/* Background radial highlights */}
      <div className="absolute top-0 right-1/4 -mt-24 h-96 w-96 bg-emerald-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-10 -mb-24 h-96 w-96 bg-teal-500/10 blur-[140px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Text & Security Pillars */}
          <div className="lg:col-span-6">
            <AnimatedSection animation="fade-right" delay={50}>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-white leading-[1.15] mb-5">
                Your Trust. <br />
                <span className="font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent">
                  Our Responsibility.
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-100 font-normal leading-relaxed mb-8">
                We believe Bangladeshi co-investors deserve uncompromised rigor. Biniyog Club pairs mathematical ledger precision with enforceable legal contracts to safeguard your capital at every step.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {SECURITY_PILLARS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="rounded-none border border-white/10 bg-white/5 p-4 transition-all duration-300 hover:border-emerald-500/40 hover:bg-white/10"
                    >
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-emerald-500/20 text-emerald-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white leading-snug">{item.title}</h4>
                      </div>
                      <p className="text-xs text-slate-200 pl-10 leading-relaxed font-normal">{item.desc}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link
                  href="/about"
                  className="group inline-flex items-center justify-center gap-2 rounded-none bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all duration-300 hover:bg-emerald-500 hover:-translate-y-0.5 w-full sm:w-auto"
                >
                  <span>Our Due Diligence Approach</span>
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/faq"
                  className="inline-flex items-center justify-center gap-2 rounded-none border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-medium text-slate-200 transition-all hover:bg-white/10 hover:border-emerald-400/40 hover:text-white w-full sm:w-auto"
                >
                  Security & Compliance FAQ
                </Link>
              </div>
            </AnimatedSection>
          </div>

          {/* Right Security Protocol Showcase */}
          <div className="lg:col-span-6">
            <AnimatedSection animation="fade-left" delay={150}>
              <div className="relative rounded-none border border-emerald-500/25 bg-gradient-to-br from-slate-900 via-slate-950 to-[#06150f] p-6 sm:p-8 text-white shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/10 pb-5 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-none bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">Trust & Security Framework</h4>
                      <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse" />
                        Multi-Layer Audit Active
                      </p>
                    </div>
                  </div>
                  <span className="rounded-none bg-white/10 px-3 py-1 text-[11px] font-semibold text-slate-300 border border-white/10">
                    Active Verified
                  </span>
                </div>

                {/* Real Legal Deed Image Preview */}
                <div className="relative h-48 w-full rounded-none overflow-hidden mb-5 border border-white/10">
                  <Image
                    src="/images/contract-security.jpg"
                    alt="Biniyog Club Legally Binding Investment Contract"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-none border border-white/15">
                      Stamped Legal Agreement
                    </span>
                    <span className="text-[10px] font-bold text-emerald-300 bg-emerald-950/80 backdrop-blur-md px-2.5 py-1 rounded-none border border-emerald-500/30">
                      Contract Act 1872
                    </span>
                  </div>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="rounded-none border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Ledger Immutability Guarantee</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Every deposit and payout is audited via double-entry accounting</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-none">
                      100%
                    </span>
                  </div>

                  <div className="rounded-none border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Contract Act 1872 Alignment</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Legally recognized deeds enforceable in Bangladeshi courts</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-none">
                      Legal
                    </span>
                  </div>

                  <div className="rounded-none border border-white/10 bg-white/5 p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-white">Segregated Escrow Allocation</p>
                      <p className="text-[11px] text-slate-300 mt-0.5">Project capital isolated from operational accounts</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-none">
                      Isolated
                    </span>
                  </div>
                </div>

                <div className="rounded-none bg-emerald-950/50 border border-emerald-500/30 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                    <span className="text-xs text-slate-200">
                      Multi-stage due diligence conducted prior to every project listing
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-400 whitespace-nowrap ml-2">Compliant</span>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </div>
    </section>
  );
}
