"use client";

import Image from "next/image";
import { TrendingUp, Users, ShieldCheck, CheckCircle2, Award } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

interface MetricsDockProps {
  stats: {
    totalProjects: number;
    activeProjects: number;
    totalInvestors: number;
    totalFundedBdt: number;
    completedProjects: number;
  };
}

function fmtBdt(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `৳${(n / 1000).toFixed(0)}K`;
  return `৳${n.toLocaleString()}`;
}

export function MetricsDock({ stats }: MetricsDockProps) {
  return (
    <section className="relative z-20 -mt-10 sm:-mt-16 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <AnimatedSection animation="fade-up" delay={50}>
        {/* Outer glowing glass dock */}
        <div className="relative rounded-none p-2.5 sm:p-3.5 bg-gradient-to-b from-white/95 via-emerald-50/40 to-white/85 dark:from-slate-900/95 dark:via-emerald-950/25 dark:to-slate-900/90 border border-emerald-500/25 shadow-[0_20px_60px_-15px_rgba(0,140,100,0.15)] backdrop-blur-2xl">
          {/* Top ambient highlight line */}
          <div className="absolute inset-x-16 -top-px h-[2px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent pointer-events-none" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Stat 1: Total Funded */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="absolute -right-8 -top-8 h-28 w-28 bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <Image src="/icons/investment.png" alt="Capital Deployed" width={32} height={32} className="object-contain" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-none bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider">
                  DIRECT IMPACT
                </span>
              </div>

              <div className="my-1">
                <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                  {stats.totalFundedBdt > 0 ? fmtBdt(stats.totalFundedBdt) : "৳2.5 Cr+"}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <p className="text-sm font-medium text-foreground">Total Capital Deployed</p>
                <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
                  Productive real-economy investments
                </p>
              </div>
            </div>

            {/* Stat 2: Active Investors */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="absolute -right-8 -top-8 h-28 w-28 bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <Image src="/icons/user.png" alt="Verified Co-Investors" width={32} height={32} className="object-contain" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-none bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider">
                  100% KYC
                </span>
              </div>

              <div className="my-1">
                <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                  {stats.totalInvestors > 0 ? `${stats.totalInvestors.toLocaleString()}+` : "4+"}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <p className="text-sm font-medium text-foreground">Verified Co-Investors</p>
                <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
                  Active retail & corporate members
                </p>
              </div>
            </div>

            {/* Stat 3: Projects Financed */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="absolute -right-8 -top-8 h-28 w-28 bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <Image src="/icons/search-engine.png" alt="Vetted Business Projects" width={32} height={32} className="object-contain" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-none bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider">
                  AUDITED
                </span>
              </div>

              <div className="my-1">
                <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                  {stats.totalProjects > 0 ? `${stats.totalProjects}+` : "3+"}
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <p className="text-sm font-medium text-foreground">Vetted Business Projects</p>
                <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
                  Due diligence & asset-backed
                </p>
              </div>
            </div>

            {/* Stat 4: Legal Protection & Returns */}
            <div className="group relative flex flex-col justify-between overflow-hidden rounded-none border border-slate-200/80 bg-white/95 dark:bg-slate-900/90 dark:border-white/10 p-5 sm:p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10">
              <div className="absolute -right-8 -top-8 h-28 w-28 bg-emerald-500/10 blur-xl transition-all duration-500 group-hover:scale-150 group-hover:bg-emerald-500/20 pointer-events-none" />
              <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

              <div className="flex items-center justify-between mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-none bg-emerald-500/10 border border-emerald-500/20 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110">
                  <Image src="/icons/income.png" alt="On-Time Return Payouts" width={32} height={32} className="object-contain" />
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-none bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 tracking-wider">
                  TRACK RECORD
                </span>
              </div>

              <div className="my-1">
                <span className="text-3xl sm:text-4xl font-light tracking-tight text-emerald-950 dark:text-emerald-100 group-hover:scale-[1.02] transition-transform duration-300 origin-left inline-block">
                  100%
                </span>
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/5">
                <p className="text-sm font-medium text-foreground">On-Time Return Payouts</p>
                <p className="text-xs font-normal text-slate-600 dark:text-slate-300 mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 bg-emerald-500 animate-pulse" />
                  Consistent capital & profit disbursals
                </p>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>
    </section>
  );
}
