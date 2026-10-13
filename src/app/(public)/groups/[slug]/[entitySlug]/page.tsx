import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEntityBySlug } from "@/server/data/groups.data";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";
import { TierCard } from "@/components/groups/tier-card";
import {
  DetailHero,
  GROUP_COVER,
  InvestmentProcess,
  RiskDisclosure,
  tierStats,
} from "@/components/groups/group-detail";

type Props = { params: Promise<{ slug: string; entitySlug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity) return { title: "Not Found" };
  return {
    title: `${entity.name} — ${entity.group.name} — Biniyog Club`,
    description: entity.description?.slice(0, 160) ?? "",
  };
}

export default async function EntityDetailPage({ params }: Props) {
  const { slug, entitySlug } = await params;
  const entity = await getEntityBySlug(entitySlug);
  if (!entity || entity.group.slug.toLowerCase() !== slug.toLowerCase()) notFound();

  const { lowestEntry, topReturn } = tierStats(entity.tiers);
  const durations = entity.tiers.map((t) => t.durationMonths).filter((d): d is number => d !== null);
  const minDur = Math.min(...durations);
  const maxDur = Math.max(...durations);
  const durationLabel = !durations.length ? "—" : minDur === maxDur ? `${minDur} mo` : `${minDur}–${maxDur} mo`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DetailHero
        crumbs={[
          { label: "Groups", href: "/groups" },
          { label: entity.group.name, href: `/groups/${slug}` },
          { label: entity.name },
        ]}
        eyebrow={entity.group.name}
        title={entity.name}
        description={entity.description}
        cover={entity.group.coverUrl ?? GROUP_COVER[entity.group.slug] ?? "/2.png"}
        ctaHref="#tiers"
        stats={[
          { value: entity.tiers.length.toString(), label: "Investment tiers" },
          { value: lowestEntry, label: "Lowest entry" },
          { value: topReturn ?? "—", label: "Top expected return" },
          { value: durationLabel, label: "Duration" },
        ]}
      />

      <section id="tiers" className="scroll-mt-20 bg-background py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedSection animation="fade-down" className="mb-12">
            <SectionHeading
              eyebrow="Investment tiers"
              title="Choose how you"
              highlight="participate"
              description={`Each tier in ${entity.name} comes with its own entry amount, returns and benefits.`}
            />
          </AnimatedSection>

          {entity.tiers.length === 0 ? (
            <div className="border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              Investment tiers for this entity are coming soon.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {entity.tiers.map((tier, ti) => (
                <AnimatedSection key={tier.id} animation="fade-up" delay={ti * 70} className="h-full">
                  <TierCard tier={tier} href={`/groups/${slug}/${entitySlug}/${tier.id}`} />
                </AnimatedSection>
              ))}
            </div>
          )}
        </div>
      </section>

      <InvestmentProcess />
      <RiskDisclosure />
    </div>
  );
}
