export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requireSession } from "@/lib/auth/session";
import {
  getProjectsEligibleForDistribution,
} from "@/server/data/distribution.data";
import { PageHeader } from "@/components/ui/page-header";
import { CalculateDistributionForm } from "@/components/admin/calculate-distribution-form";
import { DistributionRuleForm } from "@/components/admin/distribution-rule-form";

export const metadata: Metadata = { title: "New Distribution — Admin" };

export default async function NewDistributionPage() {
  const session = await requireSession();
  const projects = await getProjectsEligibleForDistribution(session);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/distributions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Distributions
        </Link>
      </div>

      <PageHeader title="New Distribution Batch" description="Calculate and preview profit distribution for a project." />

      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No eligible projects found.</p>
          <p className="mt-1 text-xs text-muted-foreground">Projects must be ACTIVE or COMPLETED with at least one active investment.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Step 1: Configure rule */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 text-base font-semibold">Step 1 — Distribution Rule</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Configure how revenue is split between investors and the platform. Rules are snapshotted at calculation time.
            </p>
            {projects.map((p) => (
              <details key={p.id} className="mb-3 rounded-lg border border-border">
                <summary className="cursor-pointer px-4 py-3 text-sm font-medium select-none">
                  {p.title}
                  {p.distributionRule
                    ? <span className="ml-2 text-xs text-success">Rule configured</span>
                    : <span className="ml-2 text-xs text-warning">No rule</span>}
                </summary>
                <div className="border-t border-border px-4 py-4">
                  <DistributionRuleForm
                    projectId={p.id}
                    existing={p.distributionRule ? {
                      investorSharePct: Number(p.distributionRule.investorSharePct),
                      platformFeePct:   Number(p.distributionRule.platformFeePct),
                    } : null}
                  />
                </div>
              </details>
            ))}
          </div>

          {/* Step 2: Enter financials */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 text-base font-semibold">Step 2 — Enter Financial Data</h2>
            <p className="mb-4 text-xs text-muted-foreground">
              Enter the project&apos;s total revenue and eligible expenses. The system will calculate each investor&apos;s entitlement proportionally.
            </p>
            <CalculateDistributionForm
              projects={projects.map((p) => ({
                id:    p.id,
                title: p.title,
                status: p.status,
                distributionRule: p.distributionRule
                  ? { investorSharePct: Number(p.distributionRule.investorSharePct), platformFeePct: Number(p.distributionRule.platformFeePct) }
                  : null,
                _count: { investments: p._count.investments },
              }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
