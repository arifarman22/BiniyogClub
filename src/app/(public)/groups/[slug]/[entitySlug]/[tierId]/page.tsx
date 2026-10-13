import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { getTierForPage } from "@/server/data/groups.data";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { GroupInvestForm } from "@/components/groups/group-invest-form";
import { FiguresGrid, tierFigures } from "@/components/groups/tier-card";
import {
  DetailHero,
  GROUP_COVER,
  InvestmentProcess,
  RiskDisclosure,
  TIER_META,
  TierBankAccountCard,
  fmtBdtCompact,
  fmtPct,
} from "@/components/groups/group-detail";

type Props = { params: Promise<{ slug: string; entitySlug: string; tierId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entitySlug, tierId } = await params;
  const tier = await getTierForPage(entitySlug, tierId);
  if (!tier) return { title: "Not Found" };
  return {
    title: `${tier.name} — ${tier.entity.name} — Biniyog Club`,
    description: tier.description.slice(0, 160),
  };
}

export default async function TierDetailPage({ params }: Props) {
  const { slug, entitySlug, tierId } = await params;
  const [tier, session] = await Promise.all([getTierForPage(entitySlug, tierId), getSession()]);
  if (!tier || tier.entity.group.slug.toLowerCase() !== slug.toLowerCase()) notFound();

  let kycApproved = false;
  if (session) {
    const kyc = await db.kyc.findUnique({ where: { userId: session.id }, select: { status: true } });
    kycApproved = kyc?.status === "VERIFIED";
  }

  const { entity } = tier;
  const group = entity.group;
  const groupHref = `/groups/${slug}`;
  const entityHref = `${groupHref}/${entitySlug}`;
  const tierHref = `${entityHref}/${tier.id}`;
  const meta = TIER_META[tier.type];
  const soldOut = tier.availableUnits === 0;
  const bank = tier.bankAccount;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DetailHero
        crumbs={[
          { label: "Groups", href: "/groups" },
          { label: group.name, href: groupHref },
          { label: entity.name, href: entityHref },
          { label: tier.name },
        ]}
        eyebrow={`${meta?.label ?? tier.type.replace(/_/g, " ")} tier · ${entity.name}`}
        title={tier.name}
        description={tier.description}
        cover={group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png"}
        ctaHref="#invest"
        ctaLabel="Invest now"
        stats={[
          { value: fmtBdtCompact(tier.minAmountBdt.toString()), label: "Minimum" },
          { value: tier.expectedReturnPct ? fmtPct(tier.expectedReturnPct.toString()) : "—", label: "Expected return" },
          { value: tier.durationMonths ? `${tier.durationMonths} mo` : "—", label: "Duration" },
          {
            value: tier.availableUnits !== null ? tier.availableUnits.toString() : "Open",
            label: tier.availableUnits !== null ? "Units left" : "Availability",
          },
        ]}
      />

      <section className="bg-background py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
          {/* Details */}
          <div className="space-y-8 lg:col-span-7">
            <div className="border border-border bg-card">
              <div className="px-6 py-5">
                <h2 className="text-lg font-semibold text-foreground">Tier at a glance</h2>
                <p className="mt-1 text-sm text-muted-foreground">Key terms for the {tier.name}.</p>
              </div>
              <FiguresGrid figures={tierFigures(tier)} />
              {tier.totalUnits !== null && (
                <p className="px-6 py-4 text-sm text-muted-foreground">
                  {tier.availableUnits ?? 0} of {tier.totalUnits} units remaining.
                </p>
              )}
            </div>

            {tier.benefits.length > 0 && (
              <div className="border border-border bg-card p-6">
                <h2 className="text-lg font-semibold text-foreground">What you get</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {tier.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="border border-border bg-card p-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">About the entity</p>
              <h2 className="mt-1 text-lg font-semibold text-foreground">{entity.name}</h2>
              {entity.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{entity.description}</p>
              )}
              <Link href={entityHref} className="group/link mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Compare all tiers in {entity.name}
                <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
              </Link>
            </div>
          </div>

          {/* Invest panel */}
          <aside id="invest" className="scroll-mt-24 lg:col-span-5">
            <div className="space-y-6 lg:sticky lg:top-24">
              {soldOut ? (
                <div className="border border-border bg-card p-6 text-center">
                  <h2 className="text-lg font-semibold text-foreground">Fully subscribed</h2>
                  <p className="mt-2 text-sm text-muted-foreground">All units in this tier have been taken.</p>
                  <Link href={entityHref} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    See other tiers <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : !bank ? (
                <div className="border border-border bg-card p-6 text-center">
                  <Clock className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h2 className="mt-3 text-lg font-semibold text-foreground">Opening soon</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Payment details for this tier haven&apos;t been published yet. Please check back shortly or{" "}
                    <Link href="/contact" className="font-medium text-primary hover:underline">contact us</Link>.
                  </p>
                </div>
              ) : (
                <>
                  <TierBankAccountCard account={bank} />
                  <div className="border border-border bg-card">
                    <div className="border-b border-border px-6 py-4">
                      <h2 className="text-sm font-semibold text-foreground">Invest in {tier.name}</h2>
                      <p className="text-xs text-muted-foreground">
                        Apply, transfer to the account above, then upload your receipt for review.
                      </p>
                    </div>
                    <div className="p-6">
                      <GroupInvestForm
                        tier={{
                          id: tier.id,
                          name: tier.name,
                          type: tier.type,
                          minAmountBdt: Number(tier.minAmountBdt),
                          maxAmountBdt: tier.maxAmountBdt ? Number(tier.maxAmountBdt) : undefined,
                          plotSizeSqft: tier.plotSizeSqft ? Number(tier.plotSizeSqft) : undefined,
                          pricePerSqftBdt: tier.pricePerSqftBdt ? Number(tier.pricePerSqftBdt) : undefined,
                        }}
                        bankAccounts={[bank]}
                        entityName={entity.name}
                        groupName={group.name}
                        isLoggedIn={!!session}
                        kycApproved={kycApproved}
                        currentPath={tierHref}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </aside>
        </div>
      </section>

      <InvestmentProcess />
      <RiskDisclosure />
    </div>
  );
}
