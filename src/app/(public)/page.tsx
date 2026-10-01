import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ChevronRight, Clock, TrendingUp, Shield, Users, BarChart3 } from "lucide-react";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { AnimatedSection } from "@/components/shared/animated-section";
import { HeroSlider } from "@/components/shared/hero-slider";
import { ProjectCard } from "@/components/shared/project-card";
import { getPlatformStats, getRecentUpdates, getFeaturedProjects } from "@/server/data/public.data";
import { getAllGroups } from "@/server/data/groups.data";
import { JsonLd, organizationSchema, websiteSchema, faqSchema } from "@/components/shared/json-ld";

export const metadata: Metadata = {
  title: "Biniyog Club — Invest in Bangladesh",
  description: "Join Bangladesh's leading investment platform. Invest in verified projects, earn competitive returns. Start from ৳5,000.",
};

function fmtBdt(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  return `৳${n.toLocaleString()}`;
}

function fmtLocal(n: number | string | null | undefined) {
  const v = Number(n ?? 0);
  if (v >= 10000000) return `৳${(v / 10000000).toFixed(1)} Cr`;
  if (v >= 100000) return `৳${(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `৳${(v / 1000).toFixed(0)}K`;
  return `৳${v.toLocaleString()}`;
}

const HOW_IT_WORKS = [
  { step: "01", title: "Create Account", desc: "Register in minutes. Complete KYC to unlock full investment access.", icon: "/icons/user.png" },
  { step: "02", title: "Browse Groups", desc: "Explore admin-reviewed business groups with tiers, returns, and risk disclosures.", icon: "/icons/search-engine.png" },
  { step: "03", title: "Invest & Track", desc: "Fund from ৳5,000. Monitor progress through real-time dashboards.", icon: "/icons/investment.png" },
  { step: "04", title: "Earn Returns", desc: "Receive principal plus returns at maturity, directly to your wallet.", icon: "/icons/income.png" },
];

const TRUST_POINTS = [
  "Every project undergoes multi-stage review before listing",
  "All transactions recorded in an immutable double-entry ledger",
  "Investors receive milestone updates throughout the lifecycle",
  "Platform fees disclosed upfront — no hidden charges",
  "KYC-verified investors and admin-managed projects only",
  "Finance officers review every payment before confirmation",
];

const FAQS = [
  { q: "What is the minimum investment amount?", a: "You can start investing from as little as ৳5,000. Each project sets its own minimum, clearly displayed on the listing." },
  { q: "How are projects verified?", a: "All projects are created and reviewed by our admin team before listing. They undergo financial due diligence and approval before going live." },
  { q: "What returns can I expect?", a: "Returns vary by project type and duration. All expected returns are shown before you invest — no surprises." },
  { q: "How do I withdraw my returns?", a: "Returns are credited to your Biniyog Club wallet after project completion. Withdraw to your bank account or mobile banking anytime." },
  { q: "Is my investment legally protected?", a: "Yes. Every investment is backed by a signed digital contract. All agreements are legally enforceable." },
  { q: "How does the payment process work?", a: "Pay via bank transfer or mobile banking. Upload your payment proof and our finance team verifies and confirms your investment." },
];

const GROUP_COVER: Record<string, string> = {
  MARINERS: "/2.png",
  MOHS: "/3.png",
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
  const [stats, recentUpdates, groups, featuredProjects] = await Promise.all([
    getPlatformStats(),
    getRecentUpdates(3),
    getAllGroups(),
    getFeaturedProjects(6),
  ]);

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

  return (
    <>
      <JsonLd data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL), faqSchema(FAQS)]} />

      {/* ── 1. Hero Slider ── */}
      <HeroSlider />

      {/* ── 3. Business Groups ── */}
      {groups.length > 0 && (
        <section className="py-12" style={{backgroundColor: "#f9fbfa"}}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-down" className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-4xl font-thin tracking-tight sm:text-5xl">Business Groups</h2>
                <p className="mt-3 text-muted-foreground text-lg max-w-xl">
                  Join Mariners, MOHS, Marinozz and more as an Investor, Shareholder, or Director.
                </p>
              </div>
              <Link href="/groups" className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium text-foreground transition-all hover:border-primary hover:text-primary shrink-0">
                View All Groups <ChevronRight className="h-4 w-4" />
              </Link>
            </AnimatedSection>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {groups.map((group, i) => {
                const allTiers = group.entities.flatMap((e) => e.tiers);
                const uniqueTypes = [...new Set(allTiers.map((t) => t.type))];
                const totalInvestors = allTiers.reduce((s, t) => s + t._count.investments, 0);
                const minEntry = allTiers.reduce((min, t) => Number(t.minAmountBdt) < Number(min.minAmountBdt) ? t : min, allTiers[0]);
                const maxReturn = allTiers.reduce((max, t) => Number(t.expectedReturnPct ?? 0) > Number(max?.expectedReturnPct ?? 0) ? t : max, allTiers[0]);
                const coverImg = group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png";
                return (
                  <AnimatedSection key={group.id} delay={i * 120} animation="zoom-in" className="h-full">
                    <Link
                      href={`/groups/${group.slug.toLowerCase()}`}
                      className="group relative flex flex-col overflow-hidden rounded-none bg-white shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 h-full border border-primary/20"
                    >
                      <div className="relative h-52 overflow-hidden">
                        <Image src={coverImg} alt={group.name} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                        {totalInvestors > 0 && (
                          <div className="absolute top-3 right-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-[11px] font-semibold text-white">
                              <Users className="h-3 w-3" /> {totalInvestors} investors
                            </span>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 p-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 mb-1">{group.slug}</p>
                          <h3 className="text-xl font-bold text-white leading-tight">{group.name}</h3>
                        </div>
                      </div>
                      <div className="flex flex-1 flex-col p-5 gap-4">
                        <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed">{group.description}</p>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: "Min. Entry", value: minEntry ? fmtLocal(Number(minEntry.minAmountBdt)) : "—" },
                            { label: "Max Return", value: maxReturn?.expectedReturnPct ? `${Number(maxReturn.expectedReturnPct)}%` : "—", highlight: true },
                            { label: "Tiers", value: String(allTiers.length) },
                          ].map(({ label, value, highlight }) => (
                            <div key={label} className="flex flex-col items-center rounded-2xl bg-gray-50 py-3 px-2">
                              <span className={`text-base font-black ${highlight ? "text-primary" : "text-gray-800"}`}>{value}</span>
                              <span className="text-[10px] text-gray-400 font-medium mt-0.5 text-center">{label}</span>
                            </div>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {uniqueTypes.map((type) => (
                            <span key={type} className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${TIER_COLORS[type] ?? "bg-gray-100 text-gray-500 border-gray-200"}`}>
                              {type.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                        <div className="mt-auto pt-2 flex items-center justify-between border-t border-gray-100">
                          <span className="text-sm font-semibold text-primary">View investment tiers</span>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 group-hover:bg-primary transition-colors duration-300">
                            <ChevronRight className="h-4 w-4 text-primary group-hover:text-white transition-colors duration-300" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  </AnimatedSection>
                );
              })}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link href="/groups" className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-all hover:border-primary hover:text-primary">
                View All Groups <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 4. Featured Projects ── */}
      {featuredProjects.length > 0 && (
        <section className="py-12" style={{backgroundColor: "#f9fbfa"}}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-down" className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-4xl font-thin tracking-tight sm:text-5xl">Featured Projects</h2>
                <p className="mt-3 text-muted-foreground text-lg max-w-xl">
                  Verified investment opportunities across Bangladesh — real estate, trade, SME and more.
                </p>
              </div>
              <Link href="/projects" className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium transition-all hover:border-primary hover:text-primary shrink-0">
                View All Projects <ChevronRight className="h-4 w-4" />
              </Link>
            </AnimatedSection>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project, i) => (
                <AnimatedSection key={project.id} delay={i * 100} animation="zoom-in">
                  <ProjectCard
                    slug={project.slug}
                    title={project.title}
                    description={project.description}
                    category={project.category}
                    status={project.status}
                    fundingGoalBdt={Number(project.fundingGoalBdt)}
                    fundedAmountBdt={Number(project.fundedAmountBdt)}
                    minInvestmentBdt={Number(project.minInvestmentBdt)}
                    expectedReturnPct={Number(project.expectedReturnPct)}
                    returnType={project.returnType}
                    durationDays={project.durationDays}
                    fundingDeadline={project.fundingDeadline}
                    coverImageUrl={project.coverImageUrl}
                    location={project.location}
                  />
                </AnimatedSection>
              ))}
            </div>

            <div className="mt-10 text-center sm:hidden">
              <Link href="/projects" className="inline-flex items-center gap-1.5 rounded-full border border-border px-6 py-2.5 text-sm font-medium transition-all hover:border-primary hover:text-primary">
                View All Projects <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. How It Works ── */}
      <section className="py-12" id="how-it-works" style={{backgroundColor: "#f9fbfa"}}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-10 text-center">
            <h2 className="text-4xl font-thin tracking-tight sm:text-5xl">How Biniyog Club Works</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto text-lg">
              From registration to returns — a transparent four-step journey.
            </p>
          </AnimatedSection>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, desc, icon }, i) => (
              <AnimatedSection key={step} delay={i * 120} animation="zoom-in">
                <div className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 h-full shadow-sm hover:shadow-lg hover:border-primary/30 hover:-translate-y-1 transition-all duration-300">
                  {/* Step number watermark */}
                  <span className="absolute top-5 right-5 text-5xl font-black text-black/40 dark:text-white/20 select-none leading-none">{step}</span>
                  {/* Icon */}
                  <div className="mb-5">
                    <Image src={icon} alt={title} width={40} height={40} className="object-contain" />
                  </div>
                  <h3 className="mb-2 font-bold text-base">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                  {/* Connector arrow */}
                  {i < 3 && (
                    <ChevronRight className="absolute -right-3.5 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-border lg:block" />
                  )}
                </div>
              </AnimatedSection>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-2.5 text-sm font-medium transition-all hover:border-primary hover:text-primary">
              Learn More <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. Trust & Transparency ── */}
      <section className="py-12" style={{backgroundColor: "#f9fbfa"}}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <AnimatedSection animation="fade-right" delay={0}>
              <h2 className="mb-5 text-4xl font-thin tracking-tight sm:text-5xl leading-tight">
                Radical Transparency,{" "}
                <span className="text-primary">Every Step</span>
              </h2>
              <p className="mb-7 text-muted-foreground leading-relaxed text-lg">
                We believe investors deserve complete visibility into where their money goes and how it performs.
                Biniyog Club is built on an immutable financial ledger and real-time tracking.
              </p>
              <ul className="space-y-3 mb-8">
                {TRUST_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-foreground/80">{point}</span>
                  </li>
                ))}
              </ul>
              <Link href="/about" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 hover:-translate-y-0.5">
                Our Approach <ChevronRight className="h-4 w-4" />
              </Link>
            </AnimatedSection>

            <AnimatedSection animation="fade-left" delay={150} className="space-y-4">
              <div className="relative overflow-hidden rounded-2xl shadow-lg">
                <Image src="/3.png" alt="Transparency" width={2172} height={724} className="w-full h-60 object-cover" />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Shield className="h-5 w-5" />, title: "KYC Verified", desc: "All investors are identity-verified before onboarding." },
                  { icon: <TrendingUp className="h-5 w-5" />, title: "Live Tracking", desc: "Real-time dashboards show project progress and financials." },
                  { icon: <BarChart3 className="h-5 w-5" />, title: "Audited Returns", desc: "Every return calculation is backed by verified records." },
                  { icon: <Users className="h-5 w-5" />, title: "Admin Reviewed", desc: "Every project is reviewed and approved by our team." },
                ].map(({ icon, title, desc }, i) => (
                  <AnimatedSection key={title} delay={i * 100} animation="zoom-in">
                    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5 transition-all duration-300">
                      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                        {icon}
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
        <section className="py-12" style={{backgroundColor: "#f9fbfa"}}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedSection animation="fade-down" className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <h2 className="text-4xl font-thin tracking-tight sm:text-5xl">Project Updates</h2>
                <p className="mt-3 text-muted-foreground text-lg">Real-time reports from active projects.</p>
              </div>
              <Link href="/updates" className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2 text-sm font-medium transition-all hover:border-primary hover:text-primary shrink-0">
                All Updates <ChevronRight className="h-4 w-4" />
              </Link>
            </AnimatedSection>

            <div className="grid gap-6 sm:grid-cols-3">
              {recentUpdates.map((update, i) => (
                <AnimatedSection key={update.id} delay={i * 120} animation="fade-up">
                  <Link href={`/projects/${update.project.slug}`} className="group flex flex-col rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {update.project.coverImageUrl && (
                      <div className="relative h-40 overflow-hidden">
                        <Image src={update.project.coverImageUrl} alt={update.project.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    )}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                          {update.type.replace("_", " ")}
                        </span>
                        {update.publishedAt && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(update.publishedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                      <h3 className="mb-2 text-sm font-bold group-hover:text-primary line-clamp-2 transition-colors">{update.title}</h3>
                      <p className="mb-4 text-xs text-muted-foreground line-clamp-3 leading-relaxed">{update.content}</p>
                      <p className="mt-auto text-xs font-semibold text-primary">{update.project.title}</p>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 8. FAQ ── */}
      <section className="py-12" style={{backgroundColor: "#f9fbfa"}}>
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-8 text-center">
            <h2 className="text-4xl font-thin tracking-tight sm:text-5xl">Frequently Asked Questions</h2>
          </AnimatedSection>

          <FaqAccordion />

          <div className="mt-10 text-center">
            <Link href="/faq" className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-2.5 text-sm font-medium transition-all hover:border-primary hover:text-primary">
              View All FAQs <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── 9. Final CTA ── */}
      <section className="relative overflow-hidden py-24 text-white">
        <div className="absolute inset-0">
          <Image src="/4.png" alt="" fill className="object-cover object-center" sizes="100vw" />
          <div className="absolute inset-0 bg-black/75" />
          <div className="absolute inset-0 bg-primary/20" />
        </div>

        <AnimatedSection animation="zoom-in" className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm text-white/80 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Join {stats.totalInvestors.toLocaleString()}+ investors today
          </div>
          <h2 className="mb-5 text-4xl font-thin text-white sm:text-5xl lg:text-6xl leading-tight">
            Ready to Invest in{" "}
            <span className="text-primary">
              Bangladesh&apos;s Future?
            </span>
          </h2>
          <p className="mb-10 text-white/70 text-lg max-w-xl mx-auto leading-relaxed">
            Join investors already earning returns from verified projects.
            Create your free account and start investing today.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/auth/register"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-9 py-3.5 text-base font-semibold text-white shadow-lg transition-all hover:bg-primary/90 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
            >
              Create Free Account
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-9 py-3.5 text-base font-medium text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
            >
              Talk to Us
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </>
  );
}
