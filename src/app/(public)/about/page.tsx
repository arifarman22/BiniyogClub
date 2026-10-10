import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Anchor,
  ArrowRight,
  Building2,
  Factory,
  Fish,
  Beef,
  Trees,
  Globe,
  HeartHandshake,
  Leaf,
  Lightbulb,
  Clock,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBasket,
  TrendingUp,
  Truck,
  Wheat,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

// Content sourced from https://marinersgroup.com.bd/about-mariners-group/

export const metadata: Metadata = {
  title: "About Mariners Group — Building Today, for Better Tomorrow",
  description:
    "Mariners Group is a diversified business group established in 2020 by maritime professionals, operating across FMCG, Food & Agro, Manufacturing, Export & Import, Distribution, E-commerce & Logistics.",
  openGraph: {
    title: "About Mariners Group | Biniyog Club",
    description:
      "A diversified, multi-sector business group built on Integrity, Innovation, Customer Focus, Sustainability and Responsible Growth.",
  },
};

const STATS = [
  { value: "2020", label: "Established", sub: "By maritime professionals" },
  { value: "50+", label: "FMCG Products", sub: "Across 12 categories" },
  { value: "200+", label: "Mariners Directors", sub: "Growing ownership community" },
  { value: "100%", label: "Interest-Free", sub: "Platform" },
];

const SECTORS = [
  { icon: ShoppingBasket, name: "FMCG" },
  { icon: Wheat, name: "Food & Agro" },
  { icon: Factory, name: "Manufacturing" },
  { icon: Globe, name: "Export & Import" },
  { icon: Truck, name: "Distribution" },
  { icon: Package, name: "E-commerce & Logistics" },
];

const VALUES = [
  { icon: ShieldCheck, title: "Integrity" },
  { icon: Lightbulb, title: "Innovation" },
  { icon: HeartHandshake, title: "Customer Focus" },
  { icon: Leaf, title: "Sustainability" },
  { icon: TrendingUp, title: "Responsible Growth" },
];

const LEADERS = [
  {
    initials: "SH",
    name: "S. M. Subberul Haque",
    role: "Chairman",
    bio: [
      "S. M. Subberul Haque, Chairman of Mariners Group, is an experienced maritime professional and strategic leader with a distinguished background in the shipping and maritime industry.",
      "Drawing on that background, the Chairman provides the corporate foundation and strategic direction of the Group.",
    ],
  },
  {
    initials: "SA",
    name: "Shamim Ahmed",
    role: "Managing Director",
    bio: [
      "Shamim Ahmed is a seasoned entrepreneur and business leader with extensive professional experience rooted in the maritime industry.",
      "Under his leadership, Mariners Group has expanded its footprint across FMCG, Manufacturing, Agro, Real Estate and other emerging sectors, driven by a vision for sustainable and diversified growth.",
    ],
  },
];

const FMCG_PRODUCTS = [
  "Potato Crackers",
  "Biscuit & Cookies",
  "Chanachur",
  "Candy",
  "Rice",
  "Puffed Rice",
  "Toast",
  "Mustard Oil",
  "Wheat / Flour",
  "Noodles",
  "Peanut Snacks",
  "Powdered Drinks",
];

const AGRO_UNITS = [
  { icon: Fish, name: "Captain's Fish Farm" },
  { icon: Beef, name: "Captain's Premium Cattle" },
  { icon: Trees, name: "Captain's Agro Tourism" },
];

const INDUSTRIAL_PARKS = [
  { name: "BSCIC Industrial Park", location: "Sirajganj" },
  { name: "Mariners Industrial Park", location: "Sirajganj" },
];

const COMPANIES = [
  "MG Ventures PLC",
  "Mariners Bakers & Beverages Limited",
  "Merchant Feed Industries Limited",
  "Mariners Cosmetics & Toiletries Limited",
  "BlueWave Media & Press Limited",
  "Marinozz PLC",
  "Captain's Agro Tourism",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── 1. Hero ── */}
      <section className="relative overflow-hidden bg-[#040d09] py-20 text-white lg:py-28">
        <div className="pointer-events-none absolute inset-0">
          <Image
            src="/images/about-due-diligence.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-20"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#040d09]/70 via-[#040d09]/85 to-[#040d09]" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 border border-emerald-400/30 bg-emerald-950/60 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <Anchor className="h-3.5 w-3.5" />
              About Mariners Group
            </div>
            <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Building today, for a{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-400 bg-clip-text font-semibold text-transparent">
                better tomorrow
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Mariners Group is a diversified business group built on the vision of creating sustainable
              opportunities, delivering quality products and services, and contributing meaningfully to the
              communities we serve.
            </p>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={150}>
            <div className="mt-14 grid grid-cols-2 border border-white/10 bg-white/[0.03] backdrop-blur-md lg:grid-cols-4">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={`p-5 sm:p-6 ${i % 2 === 1 ? "border-l border-white/10" : ""} ${i >= 2 ? "border-t border-white/10 lg:border-t-0" : ""} ${i === 2 ? "lg:border-l" : ""}`}
                >
                  <p className="text-3xl font-semibold tabular-nums text-emerald-300 sm:text-4xl">{s.value}</p>
                  <p className="mt-1 text-sm font-semibold text-white">{s.label}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{s.sub}</p>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 2. Who We Are ── */}
      <section className="bg-background py-20 lg:py-24">
        <div className="mx-auto grid grid-cols-1 max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
          <AnimatedSection animation="fade-right" className="lg:col-span-5">
            <div className="group relative h-80 overflow-hidden border border-border shadow-xl sm:h-[28rem]">
              <Image
                src="/images/smart-agro-farm.jpg"
                alt="Mariners Group food and agro operations"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Since 2020</span>
                <p className="mt-1 text-base font-semibold">From food &amp; agro roots to a multi-sector group</p>
              </div>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-left" className="lg:col-span-7">
            <SectionHeading
              align="left"
              eyebrow="Who we are"
              title="A diversified group with"
              highlight="maritime roots"
              className="max-w-none"
            />
            <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                Established in 2020 by a collective of professionals predominantly from the maritime community,
                the Group has evolved from its foundation in food and agro-based businesses into a growing
                multi-sector organization.
              </p>
              <p>
                Today, Mariners Group operates across FMCG, Food &amp; Agro, Manufacturing, Export &amp; Import,
                Distribution, E-commerce &amp; Logistics, with an ambition to expand into new and emerging
                industries.
              </p>
            </div>

            <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SECTORS.map(({ icon: Icon, name }) => (
                <li
                  key={name}
                  className="flex items-center gap-3 border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-primary/50"
                >
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  {name}
                </li>
              ))}
            </ul>
          </AnimatedSection>
        </div>
      </section>

      {/* ── 3. Core Values ── */}
      <section className="bg-muted/40 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading
              eyebrow="Our values"
              title="What sits at the"
              highlight="heart of Mariners Group"
              description="At the heart of Mariners Group is a commitment to Integrity, Innovation, Customer Focus, Sustainability and Responsible Growth."
            />
          </AnimatedSection>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {VALUES.map(({ icon: Icon, title }, i) => (
              <AnimatedSection key={title} delay={i * 70} animation="fade-up">
                <div className="group flex h-full flex-col items-center border border-border bg-card px-4 py-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{title}</h3>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. Leadership ── */}
      <section className="bg-background py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading eyebrow="Leadership" title="Leaders behind" highlight="the vision" />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {LEADERS.map((leader, i) => (
              <AnimatedSection key={leader.name} delay={i * 100} animation="fade-up">
                <article className="relative h-full overflow-hidden border border-border bg-card p-7 shadow-sm sm:p-8">
                  <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-700 via-brand-500 to-teal-400" />
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center bg-[#040d09] text-lg font-semibold tracking-wider text-emerald-300">
                      {leader.initials}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{leader.name}</h3>
                      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{leader.role}</p>
                    </div>
                  </div>
                  <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
                    {leader.bio.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>
                </article>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Business Divisions ── */}
      <section className="bg-muted/40 py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading
              eyebrow="Our brands"
              title="Business"
              highlight="divisions"
              description="From everyday FMCG staples to farms and industrial parks — the operations that make up Mariners Group."
            />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* FMCG */}
            <AnimatedSection animation="fade-up" className="lg:col-span-2">
              <div className="h-full border border-border bg-card p-7 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <ShoppingBasket className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">FMCG Products</h3>
                  <span className="ml-auto bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    12 categories
                  </span>
                </div>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FMCG_PRODUCTS.map((p) => (
                    <li
                      key={p}
                      className="border border-border bg-background px-3 py-2.5 text-sm font-medium text-foreground"
                    >
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </AnimatedSection>

            <div className="grid gap-6">
              {/* Agro */}
              <AnimatedSection animation="fade-up" delay={100}>
                <div className="h-full border border-border bg-card p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <Wheat className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">Agro Industry</h3>
                  </div>
                  <ul className="space-y-3">
                    {AGRO_UNITS.map(({ icon: Icon, name }) => (
                      <li key={name} className="flex items-center gap-3 text-sm font-medium text-foreground">
                        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>

              {/* EPZ & Factory */}
              <AnimatedSection animation="fade-up" delay={180}>
                <div className="h-full border border-border bg-card p-7">
                  <div className="mb-5 flex items-center gap-3">
                    <Factory className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">EPZ &amp; Factory</h3>
                  </div>
                  <ul className="space-y-3">
                    {INDUSTRIAL_PARKS.map((park) => (
                      <li key={park.name} className="flex items-start gap-3 text-sm">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                        <span>
                          <span className="font-medium text-foreground">{park.name}</span>
                          <span className="block text-xs text-muted-foreground">{park.location}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Group Companies ── */}
      <section className="bg-background py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading eyebrow="Group companies" title="Our" highlight="concerns" />
          </AnimatedSection>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COMPANIES.map((company, i) => (
              <AnimatedSection key={company} delay={i * 60} animation="fade-up">
                <div className="group flex h-full items-center gap-3 border border-border bg-card p-5 transition-all duration-300 hover:border-primary/50 hover:shadow-md">
                  <Building2 className="h-5 w-5 shrink-0 text-primary" />
                  <span className="text-sm font-semibold text-foreground">{company}</span>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Contact & CTA ── */}
      <section className="relative overflow-hidden bg-[#040d09] py-20 text-white lg:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_80%_20%,rgba(16,185,129,0.15),transparent)]" />
        <div className="relative mx-auto grid grid-cols-1 max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:items-center lg:px-8">
          <AnimatedSection animation="fade-right" className="lg:col-span-7">
            <SectionHeading
              align="left"
              tone="dark"
              eyebrow="Get involved"
              title="Join the business revolution with"
              highlight="Mariners Group"
              description="Become part of a growing, interest-free business community building sustainable opportunities across Bangladesh."
            />
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/auth/register"
                className="group inline-flex items-center justify-center gap-2 bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/40 transition-all hover:-translate-y-0.5 hover:bg-brand-500"
              >
                Join now
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/groups"
                className="inline-flex items-center justify-center gap-2 border border-white/25 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white transition-all hover:border-white/50 hover:bg-white/10"
              >
                View business groups
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection animation="fade-left" className="lg:col-span-5">
            <address className="space-y-5 border border-white/10 bg-white/[0.04] p-7 not-italic backdrop-blur-md">
              <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Corporate office</h3>
              <p className="flex items-start gap-3 text-sm text-slate-200">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                MG SAM Center, 12 Mohakhali C/A, Dhaka-1212
              </p>
              <p className="flex items-center gap-3 text-sm text-slate-200">
                <Clock className="h-4 w-4 shrink-0 text-emerald-400" />
                Sat–Thu: 9:00 AM – 6:00 PM
              </p>
              <a href="tel:+8801335149033" className="flex items-center gap-3 text-sm text-slate-200 hover:text-white">
                <Phone className="h-4 w-4 shrink-0 text-emerald-400" />
                Investor Relations: +880 1335-149033
              </a>
            </address>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
