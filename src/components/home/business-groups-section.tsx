"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { BusinessGroupCard } from "@/components/shared/business-group-card";
import { SectionHeading } from "@/components/home/section-heading";

interface BusinessGroupsSectionProps {
  groups: any[];
}

export function BusinessGroupsSection({ groups }: BusinessGroupsSectionProps) {
  return (
    <section className="relative py-24 lg:py-28 bg-background" id="business-groups">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection animation="fade-down" className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Partner enterprises"
            title="Institutional"
            highlight="Business Groups"
            description="Partner with vetted corporate enterprises and multi-sector conglomerates driving verified economic growth across Bangladesh."
          />

          <Link
            href="/groups"
            className="group hidden sm:inline-flex items-center gap-2 rounded-none border border-border/80 bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md shrink-0"
          >
            <span>View All Groups</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </AnimatedSection>

        {/* Business Groups Grid */}
        {groups.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {groups.map((group, i) => (
              <AnimatedSection key={group.id} delay={i * 90} animation="zoom-in" className="h-full">
                <BusinessGroupCard group={group} priority={i === 0} />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-none border border-dashed border-border p-8">
            <p className="text-muted-foreground text-sm">Corporate business groups will appear here.</p>
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/groups"
            className="group inline-flex items-center gap-2 rounded-none border border-border/80 bg-card px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md"
          >
            <span>View All Business Groups</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
