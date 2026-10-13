import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGroupBySlug } from "@/server/data/groups.data";
import { ArrowRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { TierCard } from "@/components/groups/tier-card";
import {
  DetailHero,
  GROUP_COVER,
  InvestmentProcess,
  RiskDisclosure,
  tierStats,
} from "@/components/groups/group-detail";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) return { title: "Not Found" };
  return {
    title: `${group.name} — Biniyog Club`,
    description: group.description.slice(0, 160),
  };
}

export default async function GroupDetailPage({ params }: Props) {
  const { slug } = await params;
  const group = await getGroupBySlug(slug);
  if (!group) notFound();

  const groupHref = `/groups/${slug}`;
  const allTiers = group.entities.flatMap((e) => e.tiers);
  const { lowestEntry, topReturn } = tierStats(allTiers);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DetailHero
        crumbs={[{ label: "Groups", href: "/groups" }, { label: group.name }]}
        eyebrow="Business group"
        title={group.name}
        tagline={group.tagline}
        description={group.description}
        cover={group.coverUrl ?? GROUP_COVER[group.slug] ?? "/2.png"}
        ctaHref="#entities"
        stats={[
          { value: group.entities.length.toString(), label: "Entities" },
          { value: allTiers.length.toString(), label: "Investment tiers" },
          { value: lowestEntry, label: "Lowest entry" },
          { value: topReturn ?? "—", label: "Top expected return" },
        ]}
      />

      {/* Entity quick nav */}
      {group.entities.length > 1 && (
        <nav aria-label="Entities" className="border-b border-border bg-card">
          <div className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
            {group.entities.map((entity) => (
              <a
                key={entity.id}
                href={`#${entity.slug}`}
                className="shrink-0 border-b-2 border-transparent px-4 py-4 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                {entity.name}
              </a>
            ))}
          </div>
        </nav>
      )}

      {/* Entities & tiers */}
      <section id="entities" className="scroll-mt-20 bg-background py-20 lg:py-24">
        <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6 lg:px-8">
          {group.entities.length === 0 && (
            <div className="border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              Entities for this group are coming soon.
            </div>
          )}

          {group.entities.map((entity, ei) => (
            <div key={entity.id} id={entity.slug} className="scroll-mt-20">
              <AnimatedSection animation="fade-down">
                <div className="mb-10 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
                  <div className="max-w-3xl">
                    <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      <span className="h-px w-6 bg-primary/60" />
                      Entity {String(ei + 1).padStart(2, "0")} · {entity.tiers.length}{" "}
                      {entity.tiers.length === 1 ? "tier" : "tiers"}
                    </div>
                    <h2 className="text-3xl font-semibold tracking-tight text-foreground">{entity.name}</h2>
                    {entity.description && (
                      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{entity.description}</p>
                    )}
                  </div>
                  <Link
                    href={`${groupHref}/${entity.slug}`}
                    className="group/link inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary"
                  >
                    Entity details
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/link:translate-x-0.5" />
                  </Link>
                </div>
              </AnimatedSection>

              {entity.tiers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Investment tiers for this entity are coming soon.</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {entity.tiers.map((tier, ti) => (
                    <AnimatedSection key={tier.id} animation="fade-up" delay={ti * 70} className="h-full">
                      <TierCard tier={tier} href={`${groupHref}/${entity.slug}/${tier.id}`} />
                    </AnimatedSection>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <InvestmentProcess />
      <RiskDisclosure />
    </div>
  );
}
