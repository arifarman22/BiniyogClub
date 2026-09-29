import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, Clock, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/shared/button-link";
import { AnimatedSection } from "@/components/shared/animated-section";
import {
  getPlatformStats,
  getRecentUpdates,
} from "@/server/data/public.data";
import { getAllGroups } from "@/server/data/groups.data";
import { JsonLd, organizationSchema, websiteSchema, faqSchema } from "@/components/shared/json-ld";

export const metadata: Metadata = {
  title: "Biniyog Club — Invest in Bangladesh",
  description:
    "Join Bangladesh's leading investment platform. Invest in verified projects, earn competitive returns. Start from ৳5,000.",
  openGraph: {
    title: "Biniyog Club — Invest in Bangladesh",
    description: "Invest in verified projects across Bangladesh. Transparent returns, real-time tracking.",
    url: "/",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "Biniyog Club" }],
  },
};

function formatBdt(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  return `৳${n.toLocaleString()}`;
}

const FI = {
  stats:      "/icons/investment.png",
  active:     "/icons/income.png",
  investors:  "/icons/user.png",
  funded:     "/icons/investment.png",
  completed:  "/icons/income.png",
  register:   "/icons/user.png",
  browse:     "/icons/search-engine.png",
  invest:     "/icons/investment.png",
  returns:    "/icons/income.png",
  realEstate: "/icons/investment.png",
  trade:      "/icons/income.png",
  sme:        "/icons/investment.png",
  tech:       "/icons/search-engine.png",
  infra:      "/icons/investment.png",
  other:      "/icons/income.png",
  kyc:        "/icons/user.png",
  tracking:   "/icons/search-engine.png",
  audit:      "/icons/income.png",
  review:     "/icons/investment.png",
};

const HOW_IT_WORKS = [
  { step: "01", title: "Create Your Account", description: "Register in minutes. Complete KYC verification to unlock full investment access.", icon: FI.register },
  { step: "02", title: "Browse Groups",        description: "Explore business groups reviewed by our team. Each listing includes tiers, expected returns, and risk disclosures.", icon: FI.browse },
  { step: "03", title: "Invest & Track",       description: "Fund from ৳5,000. Monitor progress through real-time updates and financial dashboards.", icon: FI.invest },
  { step: "04", title: "Earn Returns",         description: "Receive your principal plus returns at maturity. Funds are distributed directly to your wallet.", icon: FI.returns },
];

const TRANSPARENCY_POINTS = [
  "Every project undergoes a multi-stage review before listing",
  "All financial transactions are recorded in an immutable ledger",
  "Investors receive milestone updates throughout the project lifecycle",
  "Platform fees are disclosed upfront — no hidden charges",
  "KYC-verified investors and admin-managed projects only",
  "Finance officers review every payment before confirmation",
];

const FAQS = [
  { q: "What is the minimum investment amount?",  a: "You can start investing from as little as ৳5,000. Each project sets its own minimum, clearly displayed on the project page." },
  { q: "How are projects verified?",              a: "All projects are created and reviewed by our admin team before listing. They undergo financial due diligence and approval before going live." },
  { q: "What returns can I expect?",              a: "Returns vary by project type and duration. All expected returns are shown before you invest." },
  { q: "How do I withdraw my returns?",           a: "Returns are credited to your Biniyog Club wallet after project completion. You can withdraw to your bank account or mobile banking at any time." },
  { q: "Is my investment legally protected?",     a: "Yes. Every investment is backed by a signed digital contract. All agreements are legally enforceable." },
  { q: "How does the payment process work?",      a: "You can pay via bank transfer or mobile banking. Upload your payment proof and our finance team will verify and confirm your investment." },
];

const GROUP_GRADIENTS: Record<string, string> = {
  MARINERS: "from-blue-900 via-blue-800 to-blue-700",
  MOHS:     "from-emerald-900 via-emerald-800 to-emerald-700",
  MARINOZZ: "from-purple-900 via-purple-800 to-purple-700",
};

const GROUP_COVER: Record<string, string> = {
  MARINERS: "/2.png",
  MOHS:     "/3.png",
  MARINOZZ: "/4.png",
};

const TIER_COLORS: Record<string, string> = {
  INVESTOR:     "bg-brand-100 text-brand-700 border-brand-200",
  SHAREHOLDER:  "bg-finance-100 text-finance-600 border-finance-100",
  DIRECTORSHIP: "bg-harvest-100 text-harvest-600 border-harvest-100",
  PLOT_BOOKING: "bg-green-100 text-green-700 border-green-200",
  LAND_SHARE:   "bg-blue-100 text-blue-700 border-blue-200",
};

export default async function HomePage() {
  const [stats, recentUpdates, groups] = await Promise.all([
    getPlatformStats(),
    getRecentUpdates(3),
    getAllGroups(),
  ]);

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

  return (
    <>
      <JsonLd data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL), faqSchema(FAQS)]} />

      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-brand-900 text-white min-h-[88vh] flex flex-col justify-center">
        <div className="pointer-events-none absolute inset-0">
          <Image src="/1..png" alt="" fill className="object-cover object-center scale-105" priority sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/97 via-brand-900/85 to-brand-800/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-harvest-500/10 via-transparent to-transparent" />
        </div>
        <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl leading-tight">
              Grow Your Wealth,{" "}
              <span className="text-brand-300 font-light">
                Invest in Bangladesh
              </span>
            </h1>
            <p className="mb-10 text-lg text-brand-100/80 sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Join verified business groups across Bangladesh. Earn competitive returns
              with full transparency and legal protection.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {/* Primary CTA */}
              <Link
                href="/auth/register"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 rounded-full bg-harvest-500 transition-colors duration-300 group-hover:bg-harvest-400" />
                <span className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "conic-gradient(from var(--angle, 0deg), transparent 60%, oklch(0.82 0.16 80) 80%, transparent 100%)", animation: "spin-border 2s linear infinite" }}
                />
                <span className="absolute inset-[1px] rounded-full bg-harvest-500 group-hover:bg-harvest-400 transition-colors duration-300" />
                <span className="relative z-10 flex items-center gap-2">Start Investing <ChevronRight className="h-4 w-4" /></span>
              </Link>
              {/* Secondary CTA */}
              <Link
                href="/groups"
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-full px-8 py-3 text-base font-medium text-white transition-all duration-300 hover:-translate-y-0.5"
              >
                <span className="absolute inset-0 rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition-colors duration-300 group-hover:bg-white/20" />
                <span className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: "conic-gradient(from var(--angle, 0deg), transparent 60%, rgba(255,255,255,0.6) 80%, transparent 100%)", animation: "spin-border 2s linear infinite" }}
                />
                <span className="absolute inset-[1px] rounded-full bg-white/10 group-hover:bg-white/20 backdrop-blur-sm transition-colors duration-300" />
                <span className="relative z-10">Explore Groups</span>
              </Link>
            </div>

          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-1">
          {(["/2.png", "/3.png", "/4.png"] as const).map((src, i) => (
            <div key={i} className="relative h-24 overflow-hidden sm:h-36">
              <Image src={src} alt="" fill className="object-cover object-center transition-transform duration-700 hover:scale-105" sizes="33vw" />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-900/80 via-brand-900/30 to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Platform Statistics ── */}
      <section className="border-b border-border bg-card py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
            {[
              { label: "Total Projects",  value: stats.totalProjects.toLocaleString(),     icon: FI.stats,     bg: "bg-brand-100",   ring: "ring-brand-200" },
              { label: "Active Projects", value: stats.activeProjects.toLocaleString(),    icon: FI.active,    bg: "bg-finance-100", ring: "ring-finance-100" },
              { label: "Investors",       value: stats.totalInvestors.toLocaleString(),    icon: FI.investors, bg: "bg-harvest-100", ring: "ring-harvest-100" },
              { label: "Total Funded",    value: formatBdt(stats.totalFundedBdt),          icon: FI.funded,    bg: "bg-brand-100",   ring: "ring-brand-200" },
              { label: "Completed",       value: stats.completedProjects.toLocaleString(), icon: FI.completed, bg: "bg-finance-100", ring: "ring-finance-100" },
            ].map(({ label, value, icon, bg, ring }, i) => (
              <AnimatedSection key={label} delay={i * 80} animation="fade-up" className="text-center">
                <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${bg} ring-1 ${ring}`}>
                  <Image src={icon} alt={label} width={30} height={30} className="object-contain" />
                </div>
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Business Groups ── */}
      {groups.length > 0 && (
        <section className="py-14 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-3 px-4 py-1">Group Investments</Badge>
                <h2 className="text-4xl font-bold">Business Groups</h2>
                <p className="mt-2 text-muted-foreground text-lg max-w-xl">
                  Join Mariners, MOHS, Marinozz and more as an Investor, Shareholder, or Director.
                </p>
              </div>
              <ButtonLink href="/groups" variant="outline" size="sm" className="hidden sm:flex shrink-0">View All →</ButtonLink>
            </AnimatedSection>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {groups.map((group, i) => {
                const allTiers = group.entities.flatMap((e) => e.tiers);
                const uniqueTypes = [...new Set(allTiers.map((t) => t.type))];
                const totalInvestors = allTiers.reduce((s, t) => s + t._count.investments, 0);
                const minEntry = allTiers.reduce((min, t) =>
                  Number(t.minAmountBdt) < Number(min.minAmountBdt) ? t : min, allTiers[0]);
                const maxReturn = allTiers.reduce((max, t) =>
                  Number(t.expectedReturnPct ?? 0) > Number(max?.expectedReturnPct ?? 0) ? t : max, allTiers[0]);
                const coverImg = group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png";
                const gradient = GROUP_GRADIENTS[group.slug] ?? "from-gray-900 via-gray-800 to-gray-700";
                function fmtBdt(n: number | string | null | undefined) {
                  const v = Number(n ?? 0);
                  if (v >= 10000000) return `৳${(v / 10000000).toFixed(1)} Cr`;
                  if (v >= 100000)   return `৳${(v / 100000).toFixed(1)}L`;
                  if (v >= 1000)     return `৳${(v / 1000).toFixed(0)}K`;
                  return `৳${v.toLocaleString()}`;
                }
                return (
                  <AnimatedSection key={group.id} delay={i * 120} animation="fade-up" className="h-full">
                    <Link
                      href={`/groups/${group.slug.toLowerCase()}`}
                      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-400 h-full"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <Image src={coverImg} alt={group.name} fill className="object-cover object-center transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-70`} />
                        <div className="absolute top-4 left-4">
                          <span className="inline-flex items-center rounded-xl bg-white/15 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-bold text-white uppercase tracking-widest">
                            {group.slug}
                          </span>
                        </div>
                        {totalInvestors > 0 && (
                          <div className="absolute top-4 right-4">
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10 px-2.5 py-1 text-xs text-white">
                              <Image src="/icons/user.png" alt="investors" width={12} height={12} className="object-contain invert" />
                              {totalInvestors} investors
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 p-5">
                          <h3 className="text-2xl font-bold text-white drop-shadow-sm">{group.name}</h3>
                          {group.tagline && <p className="mt-0.5 text-sm text-white/75 line-clamp-1">{group.tagline}</p>}
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5">
                        <p className="mb-5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">{group.description}</p>
                        <div className="mb-5 grid grid-cols-3 gap-2">
                          <div className="rounded-xl bg-muted/60 px-3 py-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Min. Entry</p>
                            <p className="text-sm font-bold text-foreground">{minEntry ? fmtBdt(Number(minEntry.minAmountBdt)) : "—"}</p>
                          </div>
                          <div className="rounded-xl bg-muted/60 px-3 py-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Max Return</p>
                            <p className="text-sm font-bold text-primary">{maxReturn?.expectedReturnPct ? `${Number(maxReturn.expectedReturnPct)}%` : "—"}</p>
                          </div>
                          <div className="rounded-xl bg-muted/60 px-3 py-2.5 text-center">
                            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Tiers</p>
                            <p className="text-sm font-bold text-foreground">{allTiers.length}</p>
                          </div>
                        </div>
                        <div className="mb-4 flex flex-wrap gap-1.5">
                          {uniqueTypes.map((type) => (
                            <span key={type} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${TIER_COLORS[type] ?? "bg-muted text-muted-foreground border-border"}`}>
                              {type.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                        <div className="mt-auto space-y-1.5">
                          {group.entities.slice(0, 2).map((entity) => (
                            <div key={entity.id} className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2">
                              <span className="text-xs font-medium text-foreground truncate">{entity.name}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0 ml-2">{entity.tiers.length} tiers</span>
                            </div>
                          ))}
                          {group.entities.length > 2 && (
                            <p className="text-[10px] text-muted-foreground text-center pt-0.5">+{group.entities.length - 2} more entities</p>
                          )}
                        </div>
                      </div>
                      <div className="border-t border-border bg-muted/20 px-5 py-3.5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-primary group-hover:underline">Explore investment tiers →</span>
                        <ChevronRight className="h-4 w-4 text-primary transition-transform duration-200 group-hover:translate-x-1" />
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>
            <div className="mt-8 text-center sm:hidden">
              <ButtonLink href="/groups" variant="outline">View All Groups</ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. How It Works ── */}
      <section className="py-14 bg-gradient-to-b from-background to-muted/20" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3 px-4 py-1">Simple Process</Badge>
            <h2 className="text-4xl font-bold">How Biniyog Club Works</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto text-lg">
              From registration to returns — a transparent, four-step journey.
            </p>
          </AnimatedSection>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, description, icon }, i) => (
              <AnimatedSection key={step} delay={i * 100} animation="fade-up">
                <div className="relative group rounded-2xl border border-border bg-card p-7 h-full shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/8 ring-1 ring-primary/15 group-hover:bg-primary/12 transition-colors">
                      <Image src={icon} alt={title} width={32} height={32} className="object-contain" />
                    </div>
                    <span className="text-4xl font-black text-muted-foreground/10 select-none">{step}</span>
                  </div>
                  <h3 className="mb-2 font-bold text-base">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                  {step !== "04" && (
                    <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/20 lg:block" />
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/how-it-works" variant="outline" className="px-8">Learn More →</ButtonLink>
          </div>
        </div>
      </section>

      {/* ── 5. Transparency ── */}
      <section className="py-14 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <AnimatedSection animation="fade-right">
              <Badge variant="secondary" className="mb-3 px-4 py-1">Our Commitment</Badge>
              <h2 className="mb-4 text-4xl font-bold">
                Radical Transparency,{" "}
                <span className="text-primary">Every Step of the Way</span>
              </h2>
              <p className="mb-6 text-muted-foreground leading-relaxed text-lg">
                We believe investors deserve complete visibility into where their money goes and how
                it performs. Biniyog Club is built on an immutable financial ledger and real-time tracking.
              </p>
              <ul className="space-y-3 mb-8">
                {TRANSPARENCY_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/about" className="px-8">Our Approach →</ButtonLink>
            </AnimatedSection>
            <AnimatedSection animation="fade-left" className="space-y-4">
              <div className="relative overflow-hidden rounded-3xl shadow-lg">
                <Image src="/3.png" alt="Biniyog Club transparency" width={2172} height={724} className="w-full h-56 object-cover" />
                <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-border/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: FI.kyc,      title: "KYC Verified",    desc: "All investors are identity-verified before onboarding." },
                  { icon: FI.tracking, title: "Live Tracking",   desc: "Real-time dashboards show project progress and financials." },
                  { icon: FI.audit,    title: "Audited Returns", desc: "Every return calculation is backed by verified records." },
                  { icon: FI.review,   title: "Admin Reviewed",  desc: "Every project is reviewed and approved by our team." },
                ].map(({ icon, title, desc }, i) => (
                  <AnimatedSection key={title} delay={i * 80} animation="fade-up">
                    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/8 ring-1 ring-primary/15">
                        <Image src={icon} alt={title} width={24} height={24} className="object-contain" />
                      </div>
                      <h4 className="mb-1 text-sm font-bold">{title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </AnimatedSection>
                ))}
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── 7. Project Updates ── */}
      {recentUpdates.length > 0 && (
        <section className="py-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection className="mb-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <Badge variant="secondary" className="mb-3 px-4 py-1">Latest News</Badge>
                <h2 className="text-4xl font-bold">Project Updates</h2>
                <p className="mt-2 text-muted-foreground text-lg">Real-time reports from active projects.</p>
              </div>
              <ButtonLink href="/updates" variant="outline" size="sm" className="hidden sm:flex shrink-0">All Updates →</ButtonLink>
            </AnimatedSection>
            <div className="grid gap-6 sm:grid-cols-3">
              {recentUpdates.map((update, i) => (
                <AnimatedSection key={update.id} delay={i * 100} animation="fade-up">
                  <Link href={`/projects/${update.project.slug}`} className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {update.project.coverImageUrl && (
                      <div className="relative h-36 overflow-hidden">
                        <Image src={update.project.coverImageUrl} alt={update.project.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px]">{update.type.replace("_", " ")}</Badge>
                        {update.publishedAt && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(update.publishedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                      <h3 className="mb-1 text-sm font-bold group-hover:text-primary line-clamp-2 transition-colors">{update.title}</h3>
                      <p className="mb-3 text-xs text-muted-foreground line-clamp-3 leading-relaxed">{update.content}</p>
                      <p className="mt-auto text-xs font-medium text-primary">{update.project.title}</p>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. FAQ ── */}
      <section className="py-14 bg-muted/30">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3 px-4 py-1">Common Questions</Badge>
            <h2 className="text-4xl font-bold">Frequently Asked Questions</h2>
          </AnimatedSection>
          <div className="space-y-3">
            {FAQS.map(({ q, a }, i) => (
              <AnimatedSection key={q} delay={i * 60} animation="fade-up">
                <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-sm hover:border-primary/30 transition-all duration-300">
                  <div className="flex items-start gap-3">
                    <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <div>
                      <p className="mb-1.5 text-sm font-bold">{q}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
          <div className="mt-10 text-center">
            <ButtonLink href="/faq" variant="outline" className="px-8">View All FAQs →</ButtonLink>
          </div>
        </div>
      </section>

      {/* ── 9. CTA ── */}
      <section className="relative overflow-hidden bg-brand-900 py-16 text-white">
        <div className="pointer-events-none absolute inset-0">
          <Image src="/4.png" alt="" fill className="object-cover object-center opacity-15" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/97 to-brand-800/90" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-harvest-500/10 via-transparent to-transparent" />
        </div>
        <AnimatedSection className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <span className="h-2 w-2 rounded-full bg-harvest-400 animate-pulse" />
            Join {stats.totalInvestors.toLocaleString()}+ investors today
          </div>
          <h2 className="mb-4 text-4xl font-bold text-white sm:text-5xl leading-tight">
            Ready to Invest in Bangladesh&apos;s Future?
          </h2>
          <p className="mb-10 text-brand-100/80 text-lg max-w-xl mx-auto">
            Join investors already earning returns from verified projects.
            Create your free account and start investing today.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <ButtonLink href="/auth/register" className="bg-harvest-500 text-white hover:bg-harvest-400 w-full sm:w-auto px-10 py-3 text-base font-semibold shadow-lg shadow-harvest-500/30 hover:shadow-harvest-400/40 hover:-translate-y-0.5 transition-all">
              Create Free Account →
            </ButtonLink>
            <ButtonLink href="/contact" variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto px-10 py-3 text-base backdrop-blur-sm hover:-translate-y-0.5 transition-all">
              Talk to Us
            </ButtonLink>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
