import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Clock,
  ArrowRight,
  TrendingUp,
  Building2,
  FileText,
  Sparkles,
  ChevronRight,
  Layers,
} from "lucide-react";
import { getRecentUpdates } from "@/server/data/public.data";

export const metadata: Metadata = {
  title: "Live Project Updates & Disclosures — Biniyog Club",
  description:
    "Real-time operational updates, financial statements, and milestone disclosures from active business groups and projects on Biniyog Club.",
  openGraph: {
    title: "Project Disclosures & Updates | Biniyog Club",
    description: "Radical transparency: live milestone reports from vetted enterprises across Bangladesh.",
  },
};

const UPDATE_TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string }
> = {
  MILESTONE: {
    label: "Milestone Reached",
    badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  FINANCIAL_REPORT: {
    label: "Financial Disclosure",
    badgeClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
  },
  HARVEST_REPORT: {
    label: "Production / Harvest",
    badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  FIELD_VISIT_REPORT: {
    label: "Auditor Site Inspection",
    badgeClass: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  ISSUE: {
    label: "Risk Notification",
    badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
  GENERAL: {
    label: "Project Note",
    badgeClass: "bg-slate-100 dark:bg-slate-800 text-muted-foreground border-border",
  },
};

export default async function UpdatesPage() {
  const updates = await getRecentUpdates(24);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-emerald-950/70 to-slate-950 py-20 lg:py-24 text-white">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-light tracking-widest text-emerald-300 backdrop-blur-md mb-6">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>RADICAL DISCLOSURE & AUDIT</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Live Portfolio Updates &{" "}
            <span className="font-normal bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
              Milestone Disclosures
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg font-light text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Real-time operational reports, audited site inspection summaries, and revenue distributions directly from our active business portfolio.
          </p>
        </div>
      </section>

      {/* ── 2. Updates Grid ── */}
      <section className="py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {updates.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {updates.map((update) => {
                const typeConfig = UPDATE_TYPE_CONFIG[update.type] ?? UPDATE_TYPE_CONFIG.GENERAL;

                return (
                  <Link
                    key={update.id}
                    href={`/projects/${update.project.slug}`}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-[1.8rem] border border-slate-200/80 dark:border-white/10 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-500/10"
                  >
                    {/* Top ambient highlight */}
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent transition-all duration-500 group-hover:via-emerald-500" />

                    <div>
                      {/* Meta header */}
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-normal tracking-wide ${typeConfig.badgeClass}`}
                        >
                          {typeConfig.label}
                        </span>

                        {update.publishedAt && (
                          <span className="flex items-center gap-1 text-[11px] font-light text-muted-foreground">
                            <Clock className="h-3 w-3 text-emerald-500" />
                            {new Date(update.publishedAt).toLocaleDateString("en-BD", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="text-base font-normal sm:font-medium text-foreground leading-snug group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2.5">
                        {update.title}
                      </h2>

                      {/* Content preview */}
                      <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed line-clamp-4">
                        {update.content}
                      </p>
                    </div>

                    {/* Bottom Project Link Banner */}
                    <div className="mt-6 pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2 max-w-[80%]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                        <span className="text-xs font-normal text-foreground truncate">
                          {update.project.title}
                        </span>
                      </div>
                      <span className="inline-flex items-center text-xs font-light text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border border-dashed border-slate-200 dark:border-white/10 py-24 text-center max-w-xl mx-auto px-6">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <FileText className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-normal sm:font-medium text-foreground mb-1">
                Portfolio In Full Operational Cadence
              </h2>
              <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed max-w-md mx-auto">
                All scheduled quarterly milestone reports are current. Fresh site inspection summaries and financial distributions will appear here as disbursements complete.
              </p>
              <div className="mt-6">
                <Link
                  href="/projects"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-2.5 text-xs font-normal text-white shadow-md hover:bg-emerald-700 transition-colors"
                >
                  Explore Active Projects <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 3. Bottom Investor Alert Bar ── */}
      <section className="py-16 bg-gradient-to-b from-slate-900 to-slate-950 text-white border-t border-emerald-950">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-light tracking-tight text-white mb-3">
            Want Milestone Notifications in Real-Time?
          </h2>
          <p className="text-xs sm:text-sm font-light text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
            Registered co-investors receive instant email and SMS notifications when operational progress reports or return distributions are published.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-normal text-white shadow-lg shadow-emerald-600/25 transition-all duration-300 hover:bg-emerald-700 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              Register Co-Investor Account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 px-8 py-3.5 text-sm font-light text-white backdrop-blur-sm transition-all hover:bg-white/10 w-full sm:w-auto"
            >
              Contact Investor Relations
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
