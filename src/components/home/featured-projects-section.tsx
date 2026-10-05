"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { ProjectCard } from "@/components/shared/project-card";

interface FeaturedProjectsSectionProps {
  featuredProjects: any[];
}

export function FeaturedProjectsSection({
  featuredProjects,
}: FeaturedProjectsSectionProps) {
  return (
    <section className="relative py-24 lg:py-28 bg-gradient-to-b from-slate-50/60 via-background to-emerald-50/20 dark:from-slate-900/40 dark:via-background dark:to-emerald-950/10 border-b border-border/50" id="projects">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection animation="fade-down" className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-tight text-foreground leading-[1.15]">
              Investment{" "}
              <span className="font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                Projects
              </span>
            </h2>
            <p className="mt-3.5 text-base sm:text-lg font-normal text-slate-700 dark:text-slate-300 max-w-2xl leading-relaxed">
              Explore admin-vetted, asset-backed commercial ventures with legally binding contracts and transparent milestone distributions.
            </p>
          </div>

          <Link
            href="/projects"
            className="group hidden sm:inline-flex items-center gap-2 rounded-none border border-border/80 bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md shrink-0"
          >
            <span>View All Projects</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </AnimatedSection>

        {/* Projects Grid */}
        {featuredProjects.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
            {featuredProjects.map((project, i) => (
              <AnimatedSection key={project.id} delay={i * 80} animation="zoom-in" className="h-full">
                <ProjectCard
                  slug={project.slug}
                  title={project.title}
                  description={project.description}
                  category={project.category}
                  status={project.status}
                  fundingGoalBdt={Number(project.fundingGoalBdt)}
                  fundedAmountBdt={Number(project.fundedAmountBdt)}
                  minInvestmentBdt={Number(project.minInvestmentBdt)}
                  expectedReturnPct={Number(project.expectedReturnPct)}
                  returnPctMin={project.returnPctMin ? Number(project.returnPctMin) : undefined}
                  returnPctMax={project.returnPctMax ? Number(project.returnPctMax) : undefined}
                  returnType={project.returnType}
                  durationDays={project.durationDays}
                  fundingDeadline={project.fundingDeadline}
                  coverImageUrl={project.coverImageUrl}
                  imageUrls={project.imageUrls}
                  location={project.location}
                  group={project.group}
                  priority={i < 2}
                />
              </AnimatedSection>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card rounded-none border border-dashed border-border p-8">
            <p className="text-muted-foreground text-sm">New vetted project listings are currently being audited.</p>
          </div>
        )}

        {/* Mobile View All Button */}
        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/projects"
            className="group inline-flex items-center gap-2 rounded-none border border-border/80 bg-card px-8 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md"
          >
            <span>View All Investment Projects</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
