import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getGroupBySlug } from "@/server/data/groups.data";
import { getActiveBankAccounts } from "@/server/data/manual-payment.data";
import { getSession } from "@/lib/auth/session";
import { db } from "@/lib/db/prisma";
import { ChevronRight, CheckCircle2, AlertCircle } from "lucide-react";
import { GroupInvestForm } from "@/components/groups/group-invest-form";

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

const TIER_ICONS: Record<string, string> = {
  INVESTOR: "📈", SHAREHOLDER: "🏦", DIRECTORSHIP: "👔",
  PLOT_BOOKING: "🏗️", LAND_SHARE: "🌍",
};

const TIER_COLORS: Record<string, string> = {
  INVESTOR: "border-brand-300/40 bg-brand-50",
  SHAREHOLDER: "border-finance-400/40 bg-finance-50",
  DIRECTORSHIP: "border-harvest-400/40 bg-harvest-50",
  PLOT_BOOKING: "border-success/30 bg-success-muted",
  LAND_SHARE: "border-info/30 bg-info/5",
};

function fmtBdt(n: number | string) {
  return `৳${Number(n).toLocaleString("en-BD")}`;
}

export default async function GroupDetailPage({ params }: Props) {
  const { slug } = await params;
  const [group, bankAccounts, session] = await Promise.all([
    getGroupBySlug(slug),
    getActiveBankAccounts(),
    getSession(),
  ]);
  if (!group) notFound();

  let kycApproved = false;
  if (session) {
    const kyc = await db.kyc.findUnique({
      where: { userId: session.id },
      select: { status: true },
    });
    kycApproved = kyc?.status === "VERIFIED";
  }

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-white/50">
            <Link href="/groups" className="hover:text-white/80">Groups</Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-white/80">{group.name}</span>
          </nav>
          <h1 className="text-3xl font-bold sm:text-4xl">{group.name}</h1>
          {group.tagline && <p className="mt-2 text-white/70">{group.tagline}</p>}
          <p className="mt-4 max-w-2xl text-sm text-white/70 leading-relaxed">{group.description}</p>
        </div>
      </section>

      {/* Investment process banner */}
      <div className="border-b border-border bg-muted/40 py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            {["Choose a Tier", "Submit Application", "Transfer & Upload Proof", "Finance Verification", "Investment Active"].map((s, i, arr) => (
              <span key={s} className="flex items-center gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">{i + 1}</span>
                  {s}
                </span>
                {i < arr.length - 1 && <ChevronRight className="h-3 w-3 shrink-0" />}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Entities & Tiers */}
      <section className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          {group.entities.map((entity) => (
            <div key={entity.id}>
              <div className="mb-6">
                <h2 className="text-2xl font-bold">{entity.name}</h2>
                <p className="mt-1 text-muted-foreground">{entity.description}</p>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {entity.tiers.map((tier) => (
                  <div key={tier.id} className={`rounded-2xl border-2 ${TIER_COLORS[tier.type] ?? "border-border bg-card"} overflow-hidden flex flex-col`}>
                    {/* Tier header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{TIER_ICONS[tier.type] ?? "💼"}</span>
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            {tier.type.replace(/_/g, " ")}
                          </p>
                          <h3 className="text-lg font-bold">{tier.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{tier.description}</p>
                    </div>

                    {/* Key numbers */}
                    <div className="mx-6 mb-4 grid grid-cols-2 gap-2 rounded-xl border border-border bg-background/60 p-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{fmtBdt(tier.minAmountBdt.toString())}</p>
                        <p className="text-[10px] text-muted-foreground">Min. Investment</p>
                      </div>
                      {tier.expectedReturnPct ? (
                        <div className="text-center">
                          <p className="text-lg font-bold text-success">{Number(tier.expectedReturnPct).toFixed(0)}%</p>
                          <p className="text-[10px] text-muted-foreground">Expected Return</p>
                        </div>
                      ) : tier.pricePerSqftBdt ? (
                        <div className="text-center">
                          <p className="text-lg font-bold text-success">{fmtBdt(tier.pricePerSqftBdt.toString())}</p>
                          <p className="text-[10px] text-muted-foreground">Per Sqft</p>
                        </div>
                      ) : null}
                      {tier.durationMonths && (
                        <div className="text-center">
                          <p className="text-lg font-bold">{tier.durationMonths}mo</p>
                          <p className="text-[10px] text-muted-foreground">Duration</p>
                        </div>
                      )}
                      {tier.availableUnits !== null && (
                        <div className="text-center">
                          <p className="text-lg font-bold">{tier.availableUnits}</p>
                          <p className="text-[10px] text-muted-foreground">Units Left</p>
                        </div>
                      )}
                    </div>

                    {/* Benefits */}
                    <div className="px-6 pb-4 flex-1">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">What you get</p>
                      <ul className="space-y-1.5">
                        {tier.benefits.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* CTA */}
                    <div className="border-t border-border/50 p-4">
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
                        bankAccounts={bankAccounts}
                        entityName={entity.name}
                        groupName={group.name}
                        isLoggedIn={!!session}
                        kycApproved={kycApproved}
                        currentPath={`/groups/${slug}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Risk notice */}
          <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 flex gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
            <div className="text-sm text-muted-foreground">
              <p className="font-semibold text-foreground mb-1">Investment Risk Disclosure</p>
              All investments carry risk. Returns are not guaranteed. Please read all terms carefully before investing.
              Contact our support team if you have any questions.{" "}
              <Link href="/contact" className="text-primary hover:underline">Contact Support</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
