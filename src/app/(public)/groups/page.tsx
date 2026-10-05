import type { Metadata } from "next";
import Link from "next/link";
import { getAllGroups } from "@/server/data/groups.data";
import {
  ChevronRight,
  TrendingUp,
  Building2,
  Users,
  Landmark,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";

export const metadata: Metadata = {
  title: "Business Groups — Institutional Multi-Tier Syndicates | Biniyog Club",
  description:
    "Invest directly in vetted commercial conglomerates: Mariners Group, MOHS Group, and Marinozz Group. Choose from Investor, Shareholder, Directorship, Plot Booking, and Land Sharing tiers.",
  openGraph: {
    title: "Business Groups | Biniyog Club Bangladesh",
    description: "Multi-tier commercial co-investment syndicates across leading industrial and property groups in Bangladesh.",
  },
};

const TIER_ICONS: Record<string, string> = {
  INVESTOR: "📈",
  SHAREHOLDER: "🏦",
  DIRECTORSHIP: "👔",
  PLOT_BOOKING: "🏗️",
  LAND_SHARE: "🌍",
};

const TIER_COLORS: Record<string, string> = {
  INVESTOR: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  SHAREHOLDER: "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30",
  DIRECTORSHIP: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
  PLOT_BOOKING: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
  LAND_SHARE: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
};

const GROUP_GRADIENTS: Record<string, string> = {
  MARINERS: "from-blue-950 via-slate-900 to-slate-950",
  MOHS: "from-emerald-950 via-slate-900 to-slate-950",
  MARINOZZ: "from-purple-950 via-slate-900 to-slate-950",
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
  MARINERS: <TrendingUp className="h-8 w-8 text-blue-400" />,
  MOHS: <Building2 className="h-8 w-8 text-emerald-400" />,
  MARINOZZ: <Landmark className="h-8 w-8 text-purple-400" />,
};

function fmtBdt(n: number | string) {
  const v = Number(n);
  if (v >= 10000000) return `৳${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `৳${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `৳${(v / 1000).toFixed(0)}K`;
  return `৳${v.toLocaleString()}`;
}

export default async function GroupsPage() {
  const groups = await getAllGroups();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-emerald-950/80 to-slate-950 py-20 lg:py-24 text-white border-b border-border/40">
        <div className="absolute top-0 right-1/4 -mt-20 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 -mb-20 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection animation="fade-down">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-medium tracking-widest text-emerald-300 backdrop-blur-md mb-6">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>INSTITUTIONAL SYNDICATES • MULTI-TIER CO-INVESTMENT</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white max-w-4xl mx-auto leading-tight">
              Institutional Business Groups in{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
                Bangladesh
              </span>
            </h1>

            <p className="mt-5 text-base sm:text-lg font-normal text-slate-100 max-w-3xl mx-auto leading-relaxed">
              Participate directly in established commercial conglomerates: Mariners Group, MOHS Group, and Marinozz Group. Whether as an Investor, Shareholder, Director, or Property Owner, each tier offers structured governance and quarterly yields.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2.5 text-xs sm:text-sm">
              {[
                { name: "Investor Tier", desc: "Short/Medium term yield" },
                { name: "Shareholder Tier", desc: "Long-term equity dividends" },
                { name: "Directorship Tier", desc: "Board participation & voting" },
                { name: "Plot Booking", desc: "Commercial real estate allocation" },
                { name: "Land Sharing", desc: "Proportional land title co-ownership" },
              ].map((t) => (
                <span
                  key={t.name}
                  className="rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-1.5 text-white font-medium"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 2. How Group Investment Works ── */}
      <section className="border-b border-border/60 bg-card/60 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-slate-900 dark:text-white">
              How Business Group Participation Works
            </h2>
            <p className="text-xs sm:text-sm font-normal text-slate-700 dark:text-slate-200 mt-1">
              Four streamlined steps from selecting your desired group to receiving quarterly distributions
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "01", title: "Select Group & Tier", desc: "Compare the 3 commercial conglomerates and pick the tier tailored to your financial goals." },
              { step: "02", title: "Allocation Request", desc: "Submit your investment application and specify your intended commitment amount." },
              { step: "03", title: "Segregated Escrow Transfer", desc: "Transfer capital to our designated project bank escrow and upload your verified receipt." },
              { step: "04", title: "Deed Execution & Payouts", desc: "Receive countersigned digital deed certificates and earn scheduled distributions." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-card p-5 shadow-sm transition-all hover:border-emerald-500/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mb-3">
                  {step}
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-1">{title}</h3>
                <p className="text-xs font-normal text-slate-800 dark:text-slate-200 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Groups Showcase ── */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {groups.map((group) => (
            <div
              key={group.id}
              className="overflow-hidden rounded-3xl border border-border/80 dark:border-white/10 bg-card shadow-lg transition-all"
            >
              {/* Group header */}
              <div className={`bg-gradient-to-r ${GROUP_GRADIENTS[group.slug] ?? "from-slate-900 to-slate-850"} px-6 sm:px-8 py-8 sm:py-10 text-white relative overflow-hidden border-b border-white/10`}>
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner">
                      {GROUP_ICONS[group.slug]}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-emerald-300 uppercase mb-1">
                        {group.slug}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-white">{group.name}</h2>
                      {group.tagline && <p className="mt-1 text-sm text-slate-200 font-normal">{group.tagline}</p>}
                    </div>
                  </div>
                  <Link
                    href={`/groups/${group.slug.toLowerCase()}`}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 backdrop-blur-md px-5 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition-all self-start"
                  >
                    <span>View Group Dossier</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="relative z-10 mt-5 max-w-3xl text-xs sm:text-sm text-slate-100 leading-relaxed font-normal">{group.description}</p>
              </div>

              {/* Entities & tiers */}
              <div className="divide-y divide-border/60">
                {group.entities.map((entity) => (
                  <div key={entity.id} className="p-6 sm:p-8">
                    <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">{entity.name}</h3>
                        <p className="text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 mt-0.5">{entity.description}</p>
                      </div>
                      <Link
                        href={`/groups/${group.slug.toLowerCase()}/${entity.slug}`}
                        className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        Explore Entity Tiers <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {entity.tiers.map((tier) => (
                        <div
                          key={tier.id}
                          className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-slate-50/70 dark:bg-slate-900/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-md"
                        >
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-xl">{TIER_ICONS[tier.type] ?? "💼"}</span>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${TIER_COLORS[tier.type] ?? "bg-muted text-foreground"}`}>
                              {tier.type.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{tier.name}</p>
                          <div className="mt-2.5 flex items-center justify-between text-xs font-normal text-slate-800 dark:text-slate-200">
                            <span>Min. Allocation</span>
                            <span className="font-bold text-slate-900 dark:text-white font-mono">{fmtBdt(tier.minAmountBdt.toString())}</span>
                          </div>
                          {tier.expectedReturnPct && (
                            <div className="mt-1 flex items-center justify-between text-xs font-normal text-slate-800 dark:text-slate-200">
                              <span>Estimated Yield</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{Number(tier.expectedReturnPct)}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA footer */}
              <div className="border-t border-border/60 bg-card p-6 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    Ready to participate in {group.name}?
                  </p>
                  <p className="text-xs font-normal text-slate-800 dark:text-slate-200">
                    Direct legal contracts under Contract Act 1872, verified quarterly yields, and asset collateral.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href={`/groups/${group.slug.toLowerCase()}`}
                    className="rounded-full border border-slate-300 dark:border-white/20 bg-card px-5 py-2 text-xs sm:text-sm font-semibold hover:border-emerald-500/50 transition-all"
                  >
                    Explore Tiers
                  </Link>
                  <Link
                    href="/auth/register"
                    className="rounded-full bg-emerald-600 px-5 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20"
                  >
                    Open Account
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Cross-link to Individual Projects ── */}
      <section className="py-16 bg-card/70 border-t border-border/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-slate-900 dark:text-white">
            Looking for Fixed-Term Project Investment?
          </h2>
          <p className="mt-2 text-xs sm:text-sm font-normal text-slate-800 dark:text-slate-200 max-w-xl mx-auto">
            Browse live agricultural, trade finance, and SME projects with entry thresholds starting from ৳5,000.
          </p>
          <div className="mt-6">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
            >
              Browse All Opportunities <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
