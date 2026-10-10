"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock, ChevronRight } from "lucide-react";
import { AnimatedSection } from "@/components/shared/animated-section";
import { SectionHeading } from "@/components/home/section-heading";

interface UpdatesSectionProps {
  recentUpdates: any[];
}

export function UpdatesSection({ recentUpdates }: UpdatesSectionProps) {
  if (!recentUpdates || recentUpdates.length === 0) return null;

  return (
    <section className="relative py-24 lg:py-28 bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AnimatedSection animation="fade-down" className="mb-12 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <SectionHeading
            align="left"
            eyebrow="Latest updates"
            title="Live project"
            highlight="disclosures"
            description="Milestone completions, harvest results, and operational reports directly from active ventures."
          />
          <Link
            href="/updates"
            className="group inline-flex items-center gap-2 rounded-none border border-border/80 bg-card px-6 py-2.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-300 hover:border-primary hover:text-primary hover:shadow-md shrink-0"
          >
            <span>All Updates</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </AnimatedSection>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {recentUpdates.map((update, i) => (
            <AnimatedSection key={update.id} delay={i * 100} animation="fade-up">
              <Link
                href={`/projects/${update.project.slug}`}
                className="group flex flex-col h-full rounded-none border border-border/80 bg-card overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/40 hover:-translate-y-1.5 transition-all duration-300"
              >
                {update.project.coverImageUrl && (
                  <div className="relative h-48 overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <Image
                      src={update.project.coverImageUrl}
                      alt={update.project.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 rounded-none bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-medium text-white">
                      {update.project.title}
                    </span>
                  </div>
                )}
                <div className="p-6 flex flex-col flex-1">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="rounded-none bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary capitalize">
                      {update.type ? String(update.type).toLowerCase().replace(/_/g, " ") : "Update"}
                    </span>
                    {update.publishedAt && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(update.publishedAt).toLocaleDateString("en-BD", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                  <h3 className="mb-2 text-base font-semibold group-hover:text-primary line-clamp-2 transition-colors leading-snug">
                    {update.title}
                  </h3>
                  <p className="mb-4 text-xs sm:text-sm font-normal text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {update.content}
                  </p>
                  <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Read full report</span>
                    <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
}
