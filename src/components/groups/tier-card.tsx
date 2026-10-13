import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { TIER_META, fmtBdt, fmtPct } from "@/components/groups/group-detail";

type Num = { toString(): string };

export type TierSummary = {
  id: string;
  type: string;
  name: string;
  description: string;
  benefits: string[];
  minAmountBdt: Num;
  maxAmountBdt: Num | null;
  plotSizeSqft: Num | null;
  pricePerSqftBdt: Num | null;
  totalUnits: number | null;
  availableUnits: number | null;
  expectedReturnPct: Num | null;
  durationMonths: number | null;
};

/** Key figures for a tier, shared by the card and the tier page. */
export function tierFigures(tier: TierSummary) {
  return [
    { label: "Minimum", value: fmtBdt(tier.minAmountBdt.toString()), accent: true },
    tier.expectedReturnPct && { label: "Expected return", value: fmtPct(tier.expectedReturnPct.toString()), accent: true },
    tier.pricePerSqftBdt && { label: "Price / sqft", value: fmtBdt(tier.pricePerSqftBdt.toString()) },
    tier.plotSizeSqft && { label: "Plot size", value: `${Number(tier.plotSizeSqft.toString()).toLocaleString("en-BD")} sqft` },
    tier.durationMonths && { label: "Duration", value: `${tier.durationMonths} months` },
    tier.maxAmountBdt && { label: "Maximum", value: fmtBdt(tier.maxAmountBdt.toString()) },
  ].filter(Boolean) as { label: string; value: string; accent?: boolean }[];
}

export function FiguresGrid({ figures }: { figures: ReturnType<typeof tierFigures> }) {
  return (
    <dl className="grid grid-cols-2 gap-px border-y border-border bg-border">
      {figures.map((f, i) => (
        <div key={f.label} className={`bg-card px-6 py-4 ${figures.length % 2 === 1 && i === figures.length - 1 ? "col-span-2" : ""}`}>
          <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{f.label}</dt>
          <dd className={`mt-1 text-lg font-semibold tabular-nums ${f.accent ? "text-primary" : "text-foreground"}`}>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TierCard({ tier, href }: { tier: TierSummary; href: string }) {
  const meta = TIER_META[tier.type] ?? { icon: CheckCircle2, label: tier.type.replace(/_/g, " ") };
  const Icon = meta.icon;
  const soldOut = tier.availableUnits === 0;

  return (
    <article className="group flex h-full flex-col border border-border bg-card transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
      {/* Header */}
      <header className="p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex h-11 w-11 items-center justify-center bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <Icon className="h-5 w-5" />
          </div>
          {tier.availableUnits !== null && (
            <span
              className={`border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
                soldOut ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/30 bg-primary/5 text-primary"
              }`}
            >
              {soldOut ? "Fully subscribed" : `${tier.availableUnits}${tier.totalUnits ? ` / ${tier.totalUnits}` : ""} units left`}
            </span>
          )}
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{meta.label}</p>
        <h3 className="mt-1 text-lg font-semibold text-foreground">{tier.name}</h3>
        {tier.description && <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{tier.description}</p>}
      </header>

      <FiguresGrid figures={tierFigures(tier)} />

      {/* Benefits */}
      <div className="flex-1 p-6">
        {tier.benefits.length > 0 && (
          <>
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">What you get</p>
            <ul className="space-y-2">
              {tier.benefits.map((b) => (
                <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {b}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* CTA */}
      <footer className="border-t border-border bg-muted/30 p-6">
        <Link
          href={href}
          className="group/btn flex w-full items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-brand-500"
        >
          {soldOut ? "View tier details" : "Invest in this tier"}
          <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
        </Link>
      </footer>
    </article>
  );
}
