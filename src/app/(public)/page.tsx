import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  TrendingUp,
  Users,
  Sprout,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  Star,
  MapPin,
  Clock,
  Wheat,
  Fish,
  Beef,
  Egg,
  Milk,
  Flower2,
  Factory,
  HelpCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProjectCard } from "@/components/shared/project-card";
import { ButtonLink } from "@/components/shared/button-link";
import {
  getPlatformStats,
  getFeaturedProjects,
  getPublicFarmers,
  getRecentUpdates,
  getProjectCategories,
} from "@/server/data/public.data";
import { JsonLd, organizationSchema, websiteSchema, faqSchema } from "@/components/shared/json-ld";

export const metadata: Metadata = {
  title: "Biniyog Club — Invest in Bangladesh Agriculture",
  description:
    "Join Bangladesh's leading agricultural investment platform. Invest in verified farm projects, earn competitive returns, and support food security. Start from ৳5,000.",
  openGraph: {
    title: "Biniyog Club — Invest in Bangladesh Agriculture",
    description:
      "Invest in verified agricultural projects across Bangladesh. Transparent returns, verified farmers, real-time tracking.",
    url: "/",
    images: [{ url: "/og-home.png", width: 1200, height: 630, alt: "Biniyog Club" }],
  },
};

function formatBdt(n: number) {
  if (n >= 10000000) return `৳${(n / 10000000).toFixed(1)} Cr`;
  if (n >= 100000) return `৳${(n / 100000).toFixed(1)}L`;
  return `৳${n.toLocaleString()}`;
}

const CATEGORY_META: Record<string, { label: string; color: string; emoji: string }> = {
  CROP_FARMING:   { label: "Crop Farming",    color: "bg-brand-100 text-brand-700",       emoji: "🌾" },
  LIVESTOCK:      { label: "Livestock",        color: "bg-harvest-100 text-harvest-600",   emoji: "🐄" },
  AQUACULTURE:    { label: "Aquaculture",      color: "bg-finance-100 text-finance-600",   emoji: "🐟" },
  POULTRY:        { label: "Poultry",          color: "bg-harvest-100 text-harvest-600",   emoji: "🐔" },
  DAIRY:          { label: "Dairy",            color: "bg-brand-100 text-brand-700",       emoji: "🥛" },
  HORTICULTURE:   { label: "Horticulture",     color: "bg-brand-100 text-brand-700",       emoji: "🌿" },
  AGRO_PROCESSING:{ label: "Agro Processing",  color: "bg-finance-100 text-finance-600",   emoji: "🏭" },
  OTHER:          { label: "Other",            color: "bg-muted text-muted-foreground",    emoji: "🌱" },
};

const HOW_IT_WORKS = [
  { step: "01", title: "Create Your Account",    description: "Register in minutes. Complete KYC verification to unlock full investment access. Your identity and funds are protected.",                                          icon: <Users className="h-6 w-6" /> },
  { step: "02", title: "Browse Verified Projects", description: "Explore agricultural projects reviewed by our team. Each listing includes farm details, expected returns, and risk disclosures.",                               icon: <Sprout className="h-6 w-6" /> },
  { step: "03", title: "Invest & Track",          description: "Fund projects from ৳5,000. Monitor progress through real-time updates, field visit reports, and financial dashboards.",                                          icon: <BarChart3 className="h-6 w-6" /> },
  { step: "04", title: "Earn Returns",            description: "Receive your principal plus returns at harvest. Funds are distributed directly to your wallet after crop sale.",                                                  icon: <TrendingUp className="h-6 w-6" /> },
];

const TRANSPARENCY_POINTS = [
  "Every project undergoes a multi-stage review before listing",
  "Field officers conduct on-site visits throughout the crop cycle",
  "All financial transactions are recorded in an immutable ledger",
  "Investors receive milestone updates directly from the farm",
  "Harvest yields and sale prices are published publicly",
  "Platform fees are disclosed upfront — no hidden charges",
];

const FAQS = [
  { q: "What is the minimum investment amount?",  a: "You can start investing from as little as ৳5,000. Each project sets its own minimum, which is clearly displayed on the project page." },
  { q: "How are farmers verified?",               a: "All farmers undergo identity verification, land ownership checks, and an in-person farm assessment by our field officers before any project is listed." },
  { q: "What returns can I expect?",              a: "Returns vary by project type and duration. Crop farming projects typically offer 12–25% returns over 3–6 months. All expected returns are shown before you invest." },
  { q: "What happens if a crop fails?",           a: "We work with farmers to mitigate risks through crop insurance and diversification. In the event of a partial or full loss, investors are notified immediately and a recovery plan is shared." },
  { q: "How do I withdraw my returns?",           a: "Returns are credited to your Biniyog Club wallet after harvest. You can withdraw to your bank account or mobile banking (bKash, Nagad) at any time." },
  { q: "Is my investment legally protected?",     a: "Yes. Every investment is backed by a signed digital contract. The platform operates under Bangladesh's financial regulations and all agreements are legally enforceable." },
];

export default async function HomePage() {
  const [stats, featuredProjects, farmers, recentUpdates, categories] = await Promise.all([
    getPlatformStats(),
    getFeaturedProjects(6),
    getPublicFarmers(4),
    getRecentUpdates(3),
    getProjectCategories(),
  ]);

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

  return (
    <>
      <JsonLd data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL), faqSchema(FAQS)]} />

      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-brand-900 text-white">
        {/* Full-bleed background image with dark tint */}
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/1..png"
            alt=""
            fill
            className="object-cover object-center"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-900/95 via-brand-900/85 to-brand-800/70" />
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-brand-900/80 to-transparent" />
        </div>

        {/* Hero copy */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-20 pb-10 sm:px-6 sm:pt-28 sm:pb-14 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100 hover:bg-brand-700/60">
              🇧🇩 Bangladesh&apos;s Agricultural Investment Platform
            </Badge>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Grow Your Wealth,{" "}
              <span className="text-harvest-400">Feed the Nation</span>
            </h1>
            <p className="mb-8 text-lg text-brand-100/90 sm:text-xl">
              Invest in verified agricultural projects across Bangladesh. Earn competitive returns
              while supporting local farmers and strengthening food security.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <ButtonLink href="/register" className="bg-harvest-500 text-white hover:bg-harvest-600 w-full sm:w-auto">
                Start Investing →
              </ButtonLink>
              <ButtonLink
                href="/projects"
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto"
              >
                Browse Projects
              </ButtonLink>
            </div>
            <p className="mt-4 text-sm text-brand-200/70">
              Minimum investment ৳5,000 · No hidden fees · Legally protected contracts
            </p>
          </div>
        </div>

        {/* Bottom image strip — banners 2, 3, 4 */}
        <div className="relative z-10 grid grid-cols-3 gap-0.5">
          {(["/2.png", "/3.png", "/4.png"] as const).map((src, i) => (
            <div key={i} className="relative h-20 overflow-hidden sm:h-28">
              <Image src={src} alt="" fill className="object-cover object-center" sizes="33vw" />
              <div className="absolute inset-0 bg-brand-900/50" />
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. Platform Statistics ── */}
      <section className="border-b border-border bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Total Projects",  value: stats.totalProjects.toLocaleString() },
              { label: "Active Projects", value: stats.activeProjects.toLocaleString() },
              { label: "Investors",       value: stats.totalInvestors.toLocaleString() },
              { label: "Farmers",         value: stats.totalFarmers.toLocaleString() },
              { label: "Total Funded",    value: formatBdt(stats.totalFundedBdt) },
              { label: "Completed",       value: stats.completedProjects.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-primary">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ── */}
      <section className="py-20" id="how-it-works">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3">Simple Process</Badge>
            <h2 className="text-3xl font-bold">How Biniyog Club Works</h2>
            <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
              From registration to returns — a transparent, four-step journey designed for
              first-time and experienced investors alike.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map(({ step, title, description, icon }) => (
              <div key={step} className="relative">
                <div className="rounded-xl border border-border bg-card p-6 h-full">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {icon}
                    </span>
                    <span className="text-3xl font-bold text-muted-foreground/20">{step}</span>
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
                </div>
                {step !== "04" && (
                  <ChevronRight className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-muted-foreground/30 lg:block" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/how-it-works" variant="outline">Learn More →</ButtonLink>
          </div>
        </div>
      </section>

      {/* ── 4. Featured Projects ── */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <Badge variant="secondary" className="mb-3">Live Opportunities</Badge>
              <h2 className="text-3xl font-bold">Featured Projects</h2>
              <p className="mt-2 text-muted-foreground">
                Verified agricultural projects open for investment right now.
              </p>
            </div>
            <ButtonLink href="/projects" variant="outline" size="sm" className="hidden sm:flex">View All →</ButtonLink>
          </div>

          {featuredProjects.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((p) => (
                <ProjectCard
                  key={p.id}
                  slug={p.slug}
                  title={p.title}
                  description={p.description}
                  category={p.category}
                  status={p.status}
                  fundingGoalBdt={p.fundingGoalBdt.toString()}
                  fundedAmountBdt={p.fundedAmountBdt.toString()}
                  minInvestmentBdt={p.minInvestmentBdt.toString()}
                  expectedReturnPct={p.expectedReturnPct.toString()}
                  returnType={p.returnType}
                  durationDays={p.durationDays}
                  fundingDeadline={p.fundingDeadline}
                  coverImageUrl={p.coverImageUrl}
                  farm={p.farm}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-16 text-center">
              <Sprout className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
              <p className="text-muted-foreground">New projects launching soon. Check back shortly.</p>
            </div>
          )}

          <div className="mt-8 text-center sm:hidden">
            <ButtonLink href="/projects" variant="outline">View All Projects</ButtonLink>
          </div>
        </div>
      </section>

      {/* ── 5. Categories ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Diverse Sectors</Badge>
            <h2 className="text-3xl font-bold">Investment Categories</h2>
            <p className="mt-2 text-muted-foreground">
              From paddy fields to fish farms — diversify across Bangladesh&apos;s agricultural sectors.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(categories.length > 0
              ? categories
              : Object.keys(CATEGORY_META).slice(0, 8).map((c) => ({ category: c, count: 0 }))
            ).map(({ category, count }) => {
              const meta = CATEGORY_META[category] ?? CATEGORY_META.OTHER!;
              return (
                <Link
                  key={category}
                  href={`/projects?category=${category}`}
                  className="group rounded-xl border border-border bg-card p-5 text-center transition-all hover:border-primary/40 hover:shadow-sm"
                >
                  <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl text-2xl ${meta.color}`}>
                    {meta.emoji}
                  </div>
                  <p className="text-sm font-medium group-hover:text-primary">{meta.label}</p>
                  {count > 0 && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{count} projects</p>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 6. Farmer Ecosystem ── */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <Badge variant="secondary" className="mb-3">Verified Farmers</Badge>
              <h2 className="text-3xl font-bold">Meet Our Farmers</h2>
              <p className="mt-2 text-muted-foreground">
                Every farmer on Biniyog Club is identity-verified and field-assessed.
              </p>
            </div>
            <ButtonLink href="/farmers" variant="outline" size="sm" className="hidden sm:flex">All Farmers →</ButtonLink>
          </div>

          {farmers.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {farmers.map((farmer) => (
                <Card key={farmer.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    <div className="mb-3 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700 font-semibold text-sm">
                        {farmer.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{farmer.user.name}</p>
                        {farmer.farms[0] && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {farmer.farms[0].district}
                          </p>
                        )}
                      </div>
                    </div>
                    {farmer.yearsExperience && (
                      <p className="mb-2 text-xs text-muted-foreground">
                        {farmer.yearsExperience} years experience
                      </p>
                    )}
                    {farmer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {farmer.specializations.slice(0, 2).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                        ))}
                      </div>
                    )}
                    {farmer.farms[0] && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {farmer.farms[0]._count.projects} active project{farmer.farms[0]._count.projects !== 1 ? "s" : ""}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <p className="text-muted-foreground">Farmers joining soon.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── 7. Transparency ── */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="secondary" className="mb-3">Our Commitment</Badge>
              <h2 className="mb-4 text-3xl font-bold">
                Radical Transparency,{" "}
                <span className="text-primary">Every Step of the Way</span>
              </h2>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                We believe investors deserve complete visibility into where their money goes and how
                it performs. Biniyog Club is built on an immutable financial ledger, verified field
                reports, and real-time project tracking.
              </p>
              <ul className="space-y-3 mb-8">
                {TRANSPARENCY_POINTS.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <ButtonLink href="/about">Our Approach →</ButtonLink>
            </div>

            <div className="space-y-4">
              {/* Real photo from public folder */}
              <div className="relative overflow-hidden rounded-2xl">
                <Image
                  src="/3.png"
                  alt="Biniyog Club farm transparency"
                  width={2172}
                  height={724}
                  className="w-full h-52 object-cover rounded-2xl"
                />
                <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-border/20" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <ShieldCheck className="h-6 w-6" />, title: "KYC Verified",    desc: "All farmers and investors are identity-verified before onboarding." },
                  { icon: <BarChart3 className="h-6 w-6" />,   title: "Live Tracking",   desc: "Real-time dashboards show crop progress, expenses, and yield data." },
                  { icon: <TrendingUp className="h-6 w-6" />,  title: "Audited Returns", desc: "Every return calculation is backed by actual harvest and sale records." },
                  { icon: <Star className="h-6 w-6" />,        title: "Field Verified",  desc: "On-site visits by certified field officers at every growth stage." },
                ].map(({ icon, title, desc }) => (
                  <div key={title} className="rounded-xl border border-border bg-card p-5">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {icon}
                    </div>
                    <h4 className="mb-1 text-sm font-semibold">{title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. Project Updates ── */}
      {recentUpdates.length > 0 && (
        <section className="bg-muted/30 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex items-end justify-between">
              <div>
                <Badge variant="secondary" className="mb-3">From the Field</Badge>
                <h2 className="text-3xl font-bold">Latest Updates</h2>
                <p className="mt-2 text-muted-foreground">Real-time reports from active farm projects.</p>
              </div>
              <ButtonLink href="/updates" variant="outline" size="sm" className="hidden sm:flex">All Updates →</ButtonLink>
            </div>
            <div className="grid gap-5 sm:grid-cols-3">
              {recentUpdates.map((update) => (
                <Link
                  key={update.id}
                  href={`/projects/${update.project.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {update.type.replace("_", " ")}
                    </Badge>
                    {update.publishedAt && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(update.publishedAt).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-1 text-sm font-semibold group-hover:text-primary line-clamp-2">{update.title}</h3>
                  <p className="mb-3 text-xs text-muted-foreground line-clamp-3">{update.content}</p>
                  <p className="text-xs text-primary">{update.project.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── 9. FAQ ── */}
      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Common Questions</Badge>
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <p className="mb-1.5 text-sm font-semibold">{q}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/faq" variant="outline">View All FAQs →</ButtonLink>
          </div>
        </div>
      </section>

      {/* ── 10. CTA ── */}
      <section className="relative overflow-hidden bg-brand-900 py-20 text-white">
        <div className="pointer-events-none absolute inset-0">
          <Image src="/4.png" alt="" fill className="object-cover object-center opacity-20" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-br from-brand-900/95 to-brand-800/90" />
        </div>
        <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
            Ready to Invest in Bangladesh&apos;s Future?
          </h2>
          <p className="mb-8 text-brand-100/90">
            Join thousands of investors already earning returns from verified agricultural projects.
            Create your free account and start investing today.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/register" className="bg-harvest-500 text-white hover:bg-harvest-600 w-full sm:w-auto">
              Create Free Account →
            </ButtonLink>
            <ButtonLink
              href="/contact"
              variant="outline"
              className="border-white/30 bg-white/10 text-white hover:bg-white/20 w-full sm:w-auto"
            >
              Talk to Us
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
