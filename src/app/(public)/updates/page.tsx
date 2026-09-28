import type { Metadata } from "next";
import Link from "next/link";
import { Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRecentUpdates } from "@/server/data/public.data";

export const metadata: Metadata = {
  title: "Project Updates",
  description:
    "Real-time updates from active agricultural projects on Biniyog Club. Milestone reports, harvest news, and field visit summaries.",
  openGraph: {
    title: "Project Updates — Biniyog Club",
    description: "Live reports from farms across Bangladesh.",
  },
};

const UPDATE_TYPE_LABELS: Record<string, string> = {
  GENERAL: "General",
  MILESTONE: "Milestone",
  ISSUE: "Issue",
  HARVEST_REPORT: "Harvest Report",
  FINANCIAL_REPORT: "Financial Report",
  FIELD_VISIT_REPORT: "Field Visit",
};

const UPDATE_TYPE_COLORS: Record<string, string> = {
  MILESTONE: "bg-brand-100 text-brand-700",
  HARVEST_REPORT: "bg-harvest-100 text-harvest-600",
  FINANCIAL_REPORT: "bg-finance-100 text-finance-600",
  FIELD_VISIT_REPORT: "bg-muted text-muted-foreground",
  ISSUE: "bg-destructive/10 text-destructive",
  GENERAL: "bg-muted text-muted-foreground",
};

export default async function UpdatesPage() {
  const updates = await getRecentUpdates(24);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100">From the Field</Badge>
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">Project Updates</h1>
          <p className="text-brand-100/90">
            Real-time reports from active farms across Bangladesh.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {updates.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {updates.map((update) => (
                <Link
                  key={update.id}
                  href={`/projects/${update.project.slug}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${UPDATE_TYPE_COLORS[update.type] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {UPDATE_TYPE_LABELS[update.type] ?? update.type}
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

                  <h2 className="mb-2 text-sm font-semibold leading-snug group-hover:text-primary line-clamp-2">
                    {update.title}
                  </h2>
                  <p className="mb-4 text-xs text-muted-foreground leading-relaxed line-clamp-4">
                    {update.content}
                  </p>

                  <div className="flex items-center justify-between border-t border-border pt-3">
                    <p className="text-xs font-medium text-primary line-clamp-1">
                      {update.project.title}
                    </p>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-20 text-center">
              <p className="text-2xl mb-2">📋</p>
              <p className="font-medium">No updates yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Updates will appear here as projects progress.
              </p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
