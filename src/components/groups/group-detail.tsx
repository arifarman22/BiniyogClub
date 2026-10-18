import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import {
  AlertTriangle,
  Briefcase,
  Building,
  Building2,
  ChevronRight,
  FileCheck,
  Landmark,
  Map as MapIcon,
  MousePointerClick,
  ShieldCheck,
  TrendingUp,
  Upload,
  Wallet,
} from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

export const TIER_META: Record<string, { icon: LucideIcon; label: string }> = {
  INVESTOR: { icon: TrendingUp, label: "Investor" },
  SHAREHOLDER: { icon: Landmark, label: "Shareholder" },
  DIRECTORSHIP: { icon: Briefcase, label: "Directorship" },
  PLOT_BOOKING: { icon: Building, label: "Plot Booking" },
  LAND_SHARE: { icon: MapIcon, label: "Land Sharing" },
};

export const GROUP_COVER: Record<string, string> = {
  MARINERS: "/4.png",
  MOHS: "/2.png",
  MARINOZZ: "/3.png",
};

export function fmtBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

export function fmtBdtCompact(n: number | string) {
  const v = Number(n);
  if (v >= 10_000_000) return `৳${(v / 10_000_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (v >= 100_000) return `৳${(v / 100_000).toFixed(1).replace(/\.0$/, "")} L`;
  if (v >= 1000) return `৳${(v / 1000).toFixed(0)}K`;
  return `৳${v.toLocaleString()}`;
}

export function fmtPct(n: number | string) {
  return `${Number(Number(n).toFixed(2))}%`;
}

type Tierish = { minAmountBdt: { toString(): string }; expectedReturnPct: { toString(): string } | null };

/** Headline figures shown in a detail-page hero. */
export function tierStats(tiers: Tierish[]) {
  const mins = tiers.map((t) => Number(t.minAmountBdt.toString()));
  const returns = tiers.filter((t) => t.expectedReturnPct).map((t) => Number(t.expectedReturnPct!.toString()));
  return {
    lowestEntry: mins.length ? fmtBdtCompact(Math.min(...mins)) : "—",
    topReturn: returns.length ? fmtPct(Math.max(...returns)) : null,
  };
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

type Crumb = { label: string; href?: string };

export function DetailHero({
  crumbs,
  eyebrow,
  title,
  tagline,
  description,
  cover,
  stats,
  ctaHref,
  ctaLabel = "View investment tiers",
}: {
  crumbs: Crumb[];
  eyebrow: string;
  title: string;
  tagline?: string | null;
  description?: string | null;
  cover: string;
  stats: { value: string; label: string }[];
  ctaHref: string;
  ctaLabel?: string;
}) {
  return (
    <section className="relative overflow-hidden bg-[#040d09] py-16 text-white lg:py-20">
      <div className="pointer-events-none absolute inset-0">
        <Image src={cover} alt="" fill priority className="object-cover opacity-20" sizes="100vw" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#040d09] via-[#040d09]/90 to-[#040d09]/60" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_60%_at_0%_0%,rgba(16,185,129,0.16),transparent)]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-1.5 text-sm text-slate-400">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {c.href ? (
                <Link href={c.href} className="transition-colors hover:text-white">{c.label}</Link>
              ) : (
                <span className="text-slate-200">{c.label}</span>
              )}
            </span>
          ))}
        </nav>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <AnimatedSection animation="fade-down" className="lg:col-span-7">
            <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
              <span className="h-px w-6 bg-emerald-400/70" />
              {eyebrow}
            </div>
            <h1 className="text-4xl font-light leading-[1.1] tracking-tight text-balance sm:text-5xl">
              <span className="font-semibold">{title}</span>
            </h1>
            {tagline && <p className="mt-3 text-base font-medium text-emerald-200">{tagline}</p>}
            {description && (
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300">{description}</p>
            )}
            <a
              href={ctaHref}
              className="mt-8 inline-flex items-center gap-2 bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              {ctaLabel}
              <ChevronRight className="h-4 w-4" />
            </a>
          </AnimatedSection>

          <AnimatedSection animation="fade-up" delay={150} className="lg:col-span-5">
            <dl className="grid grid-cols-2 gap-px border border-white/10 bg-white/10 backdrop-blur-md">
              {stats.map((s) => (
                <div key={s.label} className="bg-[#040d09]/80 p-5 sm:p-6">
                  <dd className="text-2xl font-semibold tabular-nums text-emerald-300 sm:text-3xl">{s.value}</dd>
                  <dt className="mt-1 text-[11px] font-semibold uppercase tracking-widest text-slate-400">{s.label}</dt>
                </div>
              ))}
            </dl>
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
}

// ─── How to invest ────────────────────────────────────────────────────────────

const STEPS = [
  { icon: MousePointerClick, title: "Choose a tier", desc: "Compare the tiers and pick the one that fits your goals." },
  { icon: FileCheck, title: "Submit application", desc: "Enter the amount you intend to commit to the tier." },
  { icon: Upload, title: "Transfer & upload proof", desc: "Pay into the tier's designated bank account and upload your receipt." },
  { icon: ShieldCheck, title: "Finance verification", desc: "Our finance team verifies your payment in 1–2 business days." },
  { icon: Wallet, title: "Investment active", desc: "The amount is added to your dashboard with your deed certificate." },
];

export function InvestmentProcess() {
  return (
    <section className="bg-muted/40 py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="mb-12">
          <SectionHeading
            eyebrow="How to invest"
            title="From application to"
            highlight="active investment"
            description="Every tier follows the same verified, five-step process."
          />
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(({ icon: Icon, title, desc }, i) => (
            <AnimatedSection key={title} delay={i * 70} animation="fade-up" className="h-full">
              <div className="h-full border border-border bg-card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-light tabular-nums text-muted-foreground/50">0{i + 1}</span>
                </div>
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{desc}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Tier payment account ─────────────────────────────────────────────────────

export type TierBankAccount = {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber: string | null;
  branchName: string | null;
  mobileNumber: string | null;
  instructions: string | null;
};

/** The single account an admin assigned to a tier, shown on the tier page. */
export function TierBankAccountCard({ account }: { account: TierBankAccount }) {
  const rows = [
    { label: "Bank", value: account.bankName },
    { label: "Account name", value: account.accountName },
    { label: "Account number", value: account.accountNumber, mono: true },
    ...(account.routingNumber ? [{ label: "Routing number", value: account.routingNumber, mono: true }] : []),
    ...(account.branchName ? [{ label: "Branch", value: account.branchName }] : []),
    ...(account.mobileNumber ? [{ label: "Mobile", value: account.mobileNumber, mono: true }] : []),
  ];
  return (
    <div className="border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Building2 className="h-5 w-5 text-primary" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">Pay into this account</h3>
          <p className="text-xs text-muted-foreground">Use only this account for this tier, then upload your receipt.</p>
        </div>
      </div>
      <dl className="divide-y divide-border">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 px-6 py-3 text-sm">
            <dt className="shrink-0 text-muted-foreground">{r.label}</dt>
            <dd className={`text-right font-medium text-foreground ${r.mono ? "font-mono" : ""}`}>{r.value}</dd>
          </div>
        ))}
      </dl>
      {account.instructions && (
        <p className="border-t border-border border-l-4 border-l-warning bg-warning/5 px-6 py-3 text-xs text-muted-foreground">
          {account.instructions}
        </p>
      )}
    </div>
  );
}

// ─── Risk disclosure ──────────────────────────────────────────────────────────

export function RiskDisclosure() {
  return (
    <section className="bg-background pb-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-4 border border-border border-l-4 border-l-warning bg-card p-6">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
          <div className="text-sm leading-relaxed text-muted-foreground">
            <p className="mb-1 font-semibold text-foreground">Investment risk disclosure</p>
            All investments carry risk and returns are not guaranteed. Expected returns are projections based on current
            business plans. Please read all terms carefully before investing, and{" "}
            <Link href="/contact" className="font-medium text-primary hover:underline">contact our support team</Link>{" "}
            if you have any questions.
          </div>
        </div>
      </div>
    </section>
  );
}
