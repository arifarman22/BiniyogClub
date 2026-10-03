import type { Metadata } from "next";
import Link from "next/link";
import { getAllGroups } from "@/server/data/groups.data";
import { ChevronRight, TrendingUp, Building2, Users, Landmark } from "lucide-react";

export const metadata: Metadata = {
  title: "Business Groups — Biniyog Club",
  description: "Invest in Mariners Group, MOHS Group, and Marinozz Group. Choose from Investor, Shareholder, Directorship, Plot Booking, and Land Sharing tiers.",
};

const TIER_ICONS: Record<string, string> = {
  INVESTOR: "📈",
  SHAREHOLDER: "🏦",
  DIRECTORSHIP: "👔",
  PLOT_BOOKING: "🏗️",
  LAND_SHARE: "🌍",
};

const TIER_COLORS: Record<string, string> = {
  INVESTOR: "bg-brand-100 text-brand-700 border-brand-300/40",
  SHAREHOLDER: "bg-finance-100 text-finance-600 border-finance-400/40",
  DIRECTORSHIP: "bg-harvest-100 text-harvest-600 border-harvest-400/40",
  PLOT_BOOKING: "bg-success-muted text-success border-success/30",
  LAND_SHARE: "bg-info/10 text-info border-info/30",
};

const GROUP_GRADIENTS: Record<string, string> = {
  MARINERS: "from-blue-900 to-blue-700",
  MOHS: "from-emerald-900 to-emerald-700",
  MARINOZZ: "from-purple-900 to-purple-700",
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
  MARINERS: <TrendingUp className="h-8 w-8" />,
  MOHS: <Building2 className="h-8 w-8" />,
  MARINOZZ: <Landmark className="h-8 w-8" />,
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
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <p className="mb-3 text-xs font-light uppercase tracking-widest text-white/60">Biniyog Club</p>
          <h1 className="text-4xl font-light tracking-tight sm:text-5xl text-white">Business Groups</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base sm:text-lg font-light text-white/75 leading-relaxed">
            Join our partner business groups as an Investor, Shareholder, Director, or property owner.
            Each group offers structured tiers designed for every level of participation.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm">
            {["Investor Tier", "Shareholder Tier", "Directorship", "Plot Booking", "Land Sharing"].map((t) => (
              <span key={t} className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-white/80">{t}</span>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-b border-border bg-muted/30 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-6 text-center text-lg font-bold">How Group Investment Works</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { step: "1", title: "Choose a Group & Tier", desc: "Browse the three groups and select the tier that matches your investment goals." },
              { step: "2", title: "Express Interest", desc: "Submit your investment application with the desired amount." },
              { step: "3", title: "Transfer & Submit Proof", desc: "Transfer funds to our bank account and upload your payment receipt." },
              { step: "4", title: "Verification & Activation", desc: "Our finance team verifies your payment and activates your investment." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-3 rounded-xl border border-border bg-card p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{step}</div>
                <div>
                  <p className="font-semibold text-sm">{title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Groups */}
      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {groups.map((group) => (
            <div key={group.id} className="overflow-hidden rounded-3xl border border-border/80 dark:border-white/10 bg-card shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.4)]">
              {/* Group header */}
              <div className={`bg-gradient-to-r ${GROUP_GRADIENTS[group.slug] ?? "from-gray-800 to-gray-700"} px-6 sm:px-8 py-8 sm:py-10 text-white relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/15 pointer-events-none" />
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-inner">
                      {GROUP_ICONS[group.slug]}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-2.5 py-0.5 text-[10px] font-bold tracking-widest text-white/90 uppercase mb-1">
                        {group.slug}
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{group.name}</h2>
                      {group.tagline && <p className="mt-1 text-sm text-white/80 font-medium">{group.tagline}</p>}
                    </div>
                  </div>
                  <Link
                    href={`/groups/${group.slug.toLowerCase()}`}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 backdrop-blur-md px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/25 transition-all shadow-sm self-start"
                  >
                    <span>View Full Details</span>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <p className="relative z-10 mt-5 max-w-3xl text-sm sm:text-base text-white/85 leading-relaxed font-normal">{group.description}</p>
              </div>

              {/* Entities & tiers */}
              <div className="divide-y divide-border/60">
                {group.entities.map((entity) => (
                  <div key={entity.id} className="p-6 sm:p-8">
                    <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-bold text-foreground">{entity.name}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{entity.description}</p>
                      </div>
                      <Link
                        href={`/groups/${group.slug.toLowerCase()}/${entity.slug}`}
                        className="text-xs sm:text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        Explore Entity <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                      {entity.tiers.map((tier) => (
                        <div key={tier.id} className="rounded-2xl border border-border/70 bg-slate-50/70 dark:bg-slate-800/40 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <span className="text-xl">{TIER_ICONS[tier.type] ?? "💼"}</span>
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${TIER_COLORS[tier.type] ?? "bg-muted text-muted-foreground"}`}>
                              {tier.type.replace(/_/g, " ")}
                            </span>
                          </div>
                          <p className="font-bold text-sm text-foreground">{tier.name}</p>
                          <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Min. Entry</span>
                            <span className="font-bold text-foreground">{fmtBdt(tier.minAmountBdt.toString())}</span>
                          </div>
                          {tier.expectedReturnPct && (
                            <div className="mt-1 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Est. Return</span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">{Number(tier.expectedReturnPct)}%</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA footer */}
              <div className="border-t border-border/60 bg-muted/20 px-6 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Ready to participate in {group.name}?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Direct co-ownership, legal contracts, and verified quarterly distributions.
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Link href={`/groups/${group.slug.toLowerCase()}`} className="rounded-full border border-border bg-card px-5 py-2 text-xs sm:text-sm font-semibold hover:border-primary hover:text-primary transition-all shadow-xs">
                    Explore Tiers
                  </Link>
                  <Link href="/register" className="rounded-full bg-primary px-5 py-2 text-xs sm:text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all shadow-xs">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
