"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

const PRESET_AMOUNTS = [10000, 25000, 50000, 100000, 250000, 500000];
const DURATIONS = [
  { months: 6, label: "6 Months" },
  { months: 12, label: "12 Months" },
  { months: 18, label: "18 Months" },
  { months: 24, label: "24 Months" },
];

export function CalculatorSection() {
  const [amount, setAmount] = useState(50000);
  const [months, setMonths] = useState(12);
  const [expectedRate, setExpectedRate] = useState(18); // 18% annual return

  // Calculations
  const annualReturn = (amount * expectedRate) / 100;
  const periodReturn = (annualReturn * months) / 12;
  const totalMaturity = amount + periodReturn;
  const monthlyEquivalent = periodReturn / months;

  return (
    <section className="relative py-24 lg:py-28 bg-gradient-to-b from-slate-50/50 via-emerald-50/15 to-background dark:from-slate-900/40 dark:via-emerald-950/10 dark:to-background border-b border-border/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.15]">
            Estimate Your{" "}
            <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Projected Returns
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-300 leading-relaxed">
            Simulate your investment growth across audited project tiers. Direct capital preservation backed by enforceable contracts.
          </p>
        </AnimatedSection>

        {/* Calculator Card */}
        <AnimatedSection animation="zoom-in" delay={100} className="mx-auto max-w-4xl">
          <div className="rounded-none border border-border/80 bg-card p-6 sm:p-10 shadow-xl dark:bg-slate-900/90 dark:border-white/10">
            <div className="grid gap-8 lg:grid-cols-12 items-center">
              {/* Controls Column */}
              <div className="lg:col-span-7 space-y-6">
                {/* Investment Amount Slider & Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                      Investment Principal (BDT)
                    </label>
                    <span className="text-base sm:text-lg font-bold font-mono text-primary">
                      ৳{amount.toLocaleString()}
                    </span>
                  </div>

                  <input
                    type="range"
                    min={5000}
                    max={1000000}
                    step={5000}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-slate-200 dark:bg-slate-700 rounded-none cursor-pointer"
                  />

                  {/* Preset Pills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {PRESET_AMOUNTS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className={`rounded-none px-3 py-1 text-xs font-semibold transition-all ${
                          amount === preset
                            ? "bg-primary text-white shadow-sm"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
                        }`}
                      >
                        ৳{preset >= 100000 ? `${preset / 100000}L` : `${preset / 1000}K`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration Buttons */}
                <div>
                  <label className="text-xs sm:text-sm font-semibold text-foreground block mb-2">
                    Investment Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {DURATIONS.map((d) => (
                      <button
                        key={d.months}
                        type="button"
                        onClick={() => setMonths(d.months)}
                        className={`rounded-none border py-2.5 text-xs font-semibold transition-all ${
                          months === d.months
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-border/80 bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 hover:border-primary/40"
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expected Return Rate Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs sm:text-sm font-semibold text-foreground">
                      Expected Annual Rate (%)
                    </label>
                    <span className="text-sm font-bold text-primary">{expectedRate}% APR</span>
                  </div>
                  <div className="flex gap-2">
                    {[14, 16, 18, 20, 22].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setExpectedRate(rate)}
                        className={`flex-1 rounded-none border py-1.5 text-xs font-semibold transition-all ${
                          expectedRate === rate
                            ? "border-primary bg-primary/10 text-primary font-bold"
                            : "border-border/70 text-muted-foreground hover:border-primary/40"
                        }`}
                      >
                        {rate}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Results Showcase Column */}
              <div className="lg:col-span-5 rounded-none bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-7 text-white border border-emerald-500/25 shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                    Simulated Projection
                  </span>
                  <span className="rounded-none bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-500/30">
                    {months} Mo @ {expectedRate}%
                  </span>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-xs text-slate-400">Estimated Total Return (Profit)</span>
                    <div className="text-2xl sm:text-3xl font-light text-emerald-400 mt-0.5">
                      +৳{Math.round(periodReturn).toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <span className="text-xs text-slate-400">Total Maturity Value (Principal + Profit)</span>
                    <div className="text-xl sm:text-2xl font-bold text-white mt-0.5">
                      ৳{Math.round(totalMaturity).toLocaleString()}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Monthly Equivalent</span>
                    <span className="font-semibold text-emerald-300 font-mono">
                      ৳{Math.round(monthlyEquivalent).toLocaleString()} / mo
                    </span>
                  </div>
                </div>

                <Link
                  href="/auth/register"
                  className="mt-6 flex items-center justify-center gap-2 rounded-none bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition-all w-full"
                >
                  <span>Start Investing With This Amount</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-3 text-[10px] text-slate-400 leading-normal text-center">
                  * Projections are illustrative based on historical project tiers. Actual returns depend on specific project agreements.
                </p>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
