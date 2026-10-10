"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  FileCheck,
  ChevronRight,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

export function DashboardPreviewSection() {
  return (
    <section className="relative py-24 lg:py-28 bg-muted/40 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="mb-16">
          <SectionHeading
            eyebrow="Investor dashboard"
            title="A real-time dashboard built for"
            highlight="total transparency"
            description="Gain complete visibility over your deployed capital, scheduled profit distributions, transaction logs, and executed digital contracts."
          />
        </AnimatedSection>

        {/* Dashboard Mockup Container with Floating Cards */}
        <AnimatedSection animation="zoom-in" delay={100} className="relative mx-auto max-w-5xl">
          {/* Main Dashboard Frame */}
          <div className="relative rounded-none border border-border/80 bg-card p-6 sm:p-8 lg:p-10 shadow-2xl dark:bg-slate-900/90 dark:border-white/10 overflow-hidden">
            {/* Top Bar of the Dashboard Preview */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-border gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-none bg-primary/10 text-primary flex items-center justify-center font-bold">
                  BC
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Welcome back, Verified Investor</h3>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-none bg-emerald-500" />
                    KYC Verified • Level 2 Account
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-none bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 px-3 py-1 text-xs font-semibold">
                  Wallet: ৳45,200 Available
                </span>
                <Link
                  href="/auth/register"
                  className="rounded-none bg-primary px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-brand-400 transition-colors"
                >
                  Join Portal
                </Link>
              </div>
            </div>

            {/* Dashboard Stat Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="rounded-none border border-border/70 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                <p className="text-xs text-muted-foreground">Total Capital Deployed</p>
                <div className="text-2xl font-light text-foreground mt-1">৳1,50,000</div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <ArrowUpRight className="h-3 w-3" /> Across 2 active projects
                </p>
              </div>

              <div className="rounded-none border border-border/70 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                <p className="text-xs text-muted-foreground">Expected Annual Return</p>
                <div className="text-2xl font-light text-emerald-600 dark:text-emerald-400 mt-1">19.2%</div>
                <p className="text-[11px] text-muted-foreground mt-1">Based on project contract terms</p>
              </div>

              <div className="rounded-none border border-border/70 bg-slate-50/50 dark:bg-slate-800/40 p-4">
                <p className="text-xs text-muted-foreground">Cumulative Disbursed Returns</p>
                <div className="text-2xl font-light text-foreground mt-1">৳28,800</div>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> All cycles on time
                </p>
              </div>
            </div>

            {/* Simulated Active Projects & Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Active Allocations */}
              <div className="lg:col-span-7 rounded-none border border-border/70 p-5 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Allocations</h4>
                  <span className="text-xs text-primary font-medium">2 Projects</span>
                </div>

                <div className="space-y-3">
                  <div className="p-3.5 rounded-none border border-border/60 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-foreground">Green Valley Organic Agro Cycle III</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">Agriculture • ৳1,00,000 Deployed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">20.5% Yield</span>
                      <p className="text-[10px] text-muted-foreground">Matures in 180 days</p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-none border border-border/60 bg-slate-50/60 dark:bg-slate-800/30 flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-semibold text-foreground">Apex Cold Storage & Trade Facility</h5>
                      <p className="text-xs text-muted-foreground mt-0.5">Infrastructure • ৳50,000 Deployed</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">18.0% Yield</span>
                      <p className="text-[10px] text-muted-foreground">Matures in 270 days</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Recent Ledger Transactions */}
              <div className="lg:col-span-5 rounded-none border border-border/70 p-5 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recent Ledger Activity</h4>
                  <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-none bg-emerald-500 animate-pulse" /> Verified
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <p className="font-semibold text-foreground">Profit Distribution</p>
                      <p className="text-[10px] text-muted-foreground">Quarterly harvest return</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">+৳5,125</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <p className="font-semibold text-foreground">Bank Wire Deposit</p>
                      <p className="text-[10px] text-muted-foreground">City Bank • Confirmed</p>
                    </div>
                    <span className="font-mono font-bold text-foreground">৳50,000</span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-semibold text-foreground">Digital Deed Executed</p>
                      <p className="text-[10px] text-muted-foreground">PDF Signed & Stamped</p>
                    </div>
                    <span className="text-[11px] text-primary font-semibold">Downloaded</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating UI Card 1 (Top Left) */}
          <div className="hidden sm:flex absolute -top-5 -left-6 items-center gap-3 rounded-none border border-border/80 bg-card p-3.5 shadow-xl backdrop-blur-xl animate-float">
            <div className="h-9 w-9 rounded-none bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Payout Status</p>
              <p className="text-xs font-bold text-foreground">Scheduled Return Disbursed</p>
            </div>
          </div>

          {/* Floating UI Card 2 (Bottom Right) */}
          <div className="hidden sm:flex absolute -bottom-5 -right-6 items-center gap-3 rounded-none border border-border/80 bg-card p-3.5 shadow-xl backdrop-blur-xl animate-float-delayed">
            <div className="h-9 w-9 rounded-none bg-primary/10 text-primary flex items-center justify-center">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Contract Security</p>
              <p className="text-xs font-bold text-foreground">Legally Enforceable Deed</p>
            </div>
          </div>
        </AnimatedSection>

        <div className="mt-14 text-center">
          <Link
            href="/auth/register"
            className="group inline-flex items-center gap-2 rounded-none bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all duration-300 hover:bg-brand-400 hover:shadow-primary/30 hover:-translate-y-0.5"
          >
            <span>Create Your Investor Account & Enter Dashboard</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
