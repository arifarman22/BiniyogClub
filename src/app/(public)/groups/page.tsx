import type { Metadata } from "next";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAllGroups } from "@/server/data/groups.data";
import {
  ArrowRight,
  Briefcase,
  Building,
  ChevronRight,
  Clock,
  FileCheck,
  Landmark,
  Map as MapIcon,
  MousePointerClick,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

export const metadata: Metadata = {
  title: "Business Groups — Institutional Multi-Tier Syndicates | Biniyog Club",
  description:
    "Invest directly in vetted commercial groups: Mariners Group, MOHS Group, and Marinozz Group. Choose from Investor, Shareholder, Directorship, Plot Booking, and Land Sharing tiers.",
  openGraph: {
    title: "Business Groups | Biniyog Club Bangladesh",
    description: "Multi-tier commercial co-investment across leading industrial and property groups in Bangladesh.",
  },
};

const TIERS: Record<string, { icon: LucideIcon; label: string; desc: string }> = {
  INVESTOR: { icon: TrendingUp, label: "Investor", desc: "Short to medium-term returns on a fixed allocation." },
  SHAREHOLDER: { icon: Landmark, label: "Shareholder", desc: "Long-term equity with dividend participation." },
  DIRECTORSHIP: { icon: Briefcase, label: "Directorship", desc: "Board participation and voting rights." },
  PLOT_BOOKING: { icon: Building, label: "Plot Booking", desc: "Allocation in commercial real estate developments." },
  LAND_SHARE: { icon: MapIcon, label: "Land Sharing", desc: "Proportional co-ownership of land title." },
};

const GROUP_COVER: Record<string, string> = {
  MARINERS: "/2.png",
  MOHS: "/3.png",
  MARINOZZ: "/4.png",
};

const STEPS = [
  { icon: MousePointerClick, title: "Select group & tier", desc: "Compare the groups and choose the tier that fits your goals." },
  { icon: FileCheck, title: "Submit your application", desc: "Specify the amount you intend to commit to your chosen tier." },
  { icon: Upload, title: "Transfer & upload proof", desc: "Pay into the designated bank account and upload your receipt for verification." },
  { icon: Wallet, title: "Deed & distributions", desc: "Receive your digital deed certificate and earn scheduled distributions." },
];

function fmtBdt(n: number | string) {
  const v = Number(n);
  if (v >= 10_000_000) return `৳${(v / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (v >= 100_000) return `৳${(v / 100_000).toFixed(1).replace(/\.0$/, "")} L`;
  if (v >= 1000) return `৳${(v / 1000).toFixed(0)}K`;
  return `৳${v.toLocaleString()}`;
}

export default async function GroupsPage() {
  const groups = await getAllGroups();

  const allTiers = groups.flatMap((g) => g.entities.flatMap((e) => e.tiers));
  const entityCount = groups.reduce((n, g) => n + g.entities.length, 0);
  const minEntry = allTiers.length ? Math.min(...allTiers.map((t) => Number(t.minAmountBdt))) : 0;

  const stats = [
    { value: groups.length.toString(), label: "Business groups" },
    { value: entityCount.toString(), label: "Operating entities" },
    { value: allTiers.length.toString(), label: "Investment tiers" },
    { value: minEntry ? fmtBdt(minEntry) : "—", label: "Lowest entry" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-[#040d09] py-20 text-white lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <Image src="/2.png" alt="" fill priority className="object-cover opacity-15" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040d09]/70 via-[#040d09]/85 to-[#040d09]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent)]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-px w-5 bg-emerald-400/70" />
              Business groups
              <span className="h-px w-5 bg-emerald-400/70" />
            </div>
            <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Institutional business groups in{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
                Bangladesh
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Participate directly in established commercial groups — as an investor, shareholder, director or property
              owner. Each tier comes with structured governance and a binding legal contract.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={150}>
            <div className="mx-auto mt-12 grid max-w-5xl grid-cols-2 border border-white/10 bg-white/[0.03] backdrop-blur-md lg:grid-cols-4">
              {stats.map((s, i) => (
                <div
                  key={s.label}
                  className={`p-5 text-center sm:p-6 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
                >
                  <p className="text-3xl font-semibold tabular-nums text-emerald-300 sm:text-4xl">{s.value}</p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 2. Tier guide ── */}
      <section className="bg-muted/40 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading
              eyebrow="Participation tiers"
              title="Five ways to"
              highlight="participate"
              description="Every group offers one or more of these tiers. Pick the one that matches your timeline and goals."
            />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(TIERS).map(([key, { icon: Icon, label, desc }], i) => (
              <AnimatedSection key={key} delay={i * 70} animation="fade-up" className="h-full">
                <div className="group h-full border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{label}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. Groups showcase ── */}
      <section className="bg-background py-20 lg:py-24" id="groups">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading
              eyebrow="Our groups"
              title="Explore the"
              highlight="business groups"
              description="Each group operates one or more entities, and each entity offers its own investment tiers."
            />
          </AnimatedSection>

          {groups.length === 0 ? (
            <div className="border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              Business groups will appear here once they are published.
            </div>
          ) : (
            <div className="space-y-10">
              {groups.map((group, gi) => {
                const groupHref = `/groups/${group.slug.toLowerCase()}`;
                const cover = group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png";
                return (
                  <AnimatedSection key={group.id} animation="fade-up">
                    <article className="overflow-hidden border border-border bg-card shadow-sm lg:grid lg:grid-cols-12">
                      {/* Cover + intro */}
                      <div className="relative flex min-h-[320px] flex-col justify-end overflow-hidden bg-slate-950 p-7 text-white sm:p-8 lg:col-span-5">
                        <Image
                          src={cover}
                          alt={group.name}
                          fill
                          priority={gi === 0}
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 40vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/10" />
                        <div className="relative">
                          <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                            {group.entities.length} {group.entities.length === 1 ? "entity" : "entities"}
                          </span>
                          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            {group.name}
                          </h2>
                          {group.tagline && <p className="mt-1 text-sm font-medium text-emerald-200">{group.tagline}</p>}
                          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-slate-300">{group.description}</p>
                          <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                              href={groupHref}
                              className="group/btn inline-flex items-center gap-2 bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
                            >
                              View group
                              <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                            </Link>
                            <Link
                              href="/auth/register"
                              className="inline-flex items-center border border-white/25 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-white/50 hover:bg-white/10"
                            >
                              Open account
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* Entities & tiers */}
                      <div className="divide-y divide-border lg:col-span-7">
                        {group.entities.length === 0 && (
                          <p className="p-8 text-sm text-muted-foreground">Entities for this group are coming soon.</p>
                        )}
                        {group.entities.map((entity) => (
                          <div key={entity.id} className="p-6 sm:p-7">
                            <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                              <div>
                                <h3 className="text-base font-semibold text-foreground">{entity.name}</h3>
                                <p className="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{entity.description}</p>
                              </div>
                              <Link
                                href={`${groupHref}/${entity.slug}`}
                                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
                              >
                                Explore tiers <ChevronRight className="h-3.5 w-3.5" />
                              </Link>
                            </div>

                            {entity.tiers.length > 0 && (
                              <ul className="divide-y divide-border border border-border">
                                {entity.tiers.map((tier) => {
                                  const meta = TIERS[tier.type];
                                  const Icon = meta?.icon ?? Briefcase;
                                  return (
                                    <li
                                      key={tier.id}
                                      className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-background px-4 py-3 transition-colors hover:bg-primary/5"
                                    >
                                      <div className="flex min-w-0 flex-1 items-center gap-3">
                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary/10 text-primary">
                                          <Icon className="h-4 w-4" />
                                        </span>
                                        <div className="min-w-0">
                                          <p className="truncate text-sm font-semibold text-foreground">{tier.name}</p>
                                          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                            {meta?.label ?? tier.type.replace(/_/g, " ")}
                                          </p>
                                        </div>
                                      </div>
                                      <dl className="flex items-center gap-5 text-right text-xs">
                                        <div>
                                          <dt className="text-muted-foreground">Min.</dt>
                                          <dd className="font-semibold tabular-nums text-foreground">
                                            {fmtBdt(tier.minAmountBdt.toString())}
                                          </dd>
                                        </div>
                                        {tier.expectedReturnPct && (
                                          <div>
                                            <dt className="text-muted-foreground">Est. yield</dt>
                                            <dd className="font-semibold tabular-nums text-primary">
                                              {Number(tier.expectedReturnPct)}%
                                            </dd>
                                          </div>
                                        )}
                                        {tier.durationMonths && (
                                          <div className="hidden sm:block">
                                            <dt className="text-muted-foreground">Term</dt>
                                            <dd className="inline-flex items-center gap-1 font-semibold tabular-nums text-foreground">
                                              <Clock className="h-3 w-3" />
                                              {tier.durationMonths} mo
                                            </dd>
                                          </div>
                                        )}
                                      </dl>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </article>
                  </AnimatedSection>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── 4. How participation works ── */}
      <section className="bg-muted/40 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading
              eyebrow="Four steps"
              title="How group participation"
              highlight="works"
              description="From choosing a group to receiving scheduled distributions."
            />
          </AnimatedSection>

          <ol className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, desc }, i) => (
              <li key={title} className="relative border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-light tabular-nums text-primary/40">0{i + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── 5. Cross-link CTA ── */}
      <section className="relative overflow-hidden bg-[#030906] py-20 text-white lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_40%,rgba(16,185,129,0.18),transparent)]" />
        <AnimatedSection animation="zoom-in" className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-light tracking-tight text-balance sm:text-5xl">
            Looking for fixed-term{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
              project investment?
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-300">
            Browse live agricultural, trade and SME projects with entry thresholds from ৳5,000.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/projects"
              className="group inline-flex items-center justify-center gap-2 bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
            >
              Browse projects
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/auth/register"
              className="inline-flex items-center justify-center gap-2 border border-white/25 bg-white/5 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
            >
              Create account
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
