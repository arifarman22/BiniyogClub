"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { BusinessGroupCard } from "@/components/shared/business-group-card";

interface BusinessGroupsSectionProps {
  groups: any[];
}

export function BusinessGroupsSection({ groups }: BusinessGroupsSectionProps) {
  return (
    <section className="relative py-24 lg:py-28 bg-gradient-to-b from-background via-slate-50/40 to-background dark:via-slate-900/30 border-b border-border/50" id="business-groups">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection animation="fade-down" className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.15]">
              Institutional{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Business Groups
              </span>
            </h2>
            <p className="mt-3.5 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              Partner with vetted corporate enterprises and multi-sector conglomerates driving verified economic growth across Bangladesh.
            </p>
          </div>

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
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
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
