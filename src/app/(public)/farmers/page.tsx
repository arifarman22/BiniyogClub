import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ArrowRight, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPublicFarmers } from "@/server/data/public.data";
import { ButtonLink } from "@/components/shared/button-link";

export const metadata: Metadata = {
  title: "Our Farmers",
  description:
    "Meet the verified farmers behind Biniyog Club's agricultural projects. Every farmer is identity-checked, field-assessed, and supported by our team.",
  openGraph: {
    title: "Verified Farmers — Biniyog Club",
    description: "Meet the farmers growing Bangladesh's agricultural future.",
  },
};

const FARMER_BENEFITS = [
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Fair Capital Access", desc: "Get funded at fair terms without predatory interest rates or middlemen." },
  { icon: <Star className="h-5 w-5" />, title: "Expert Support", desc: "Access agronomists, field officers, and market linkage support throughout your project." },
  { icon: <ArrowRight className="h-5 w-5" />, title: "Build Your Reputation", desc: "Successful projects build your track record, making future funding faster and larger." },
];

export default async function FarmersPage() {
  const farmers = await getPublicFarmers(20);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100">Verified Partners</Badge>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">Meet Our Farmers</h1>
          <p className="text-lg text-brand-100/90">
            Every farmer on Biniyog Club has passed identity verification, land assessment, and an
            in-person farm evaluation. These are the people growing your returns.
          </p>
        </div>
      </section>

      {/* Verification process */}
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: "01", title: "Identity Verified", desc: "National ID and biometric verification for every farmer." },
              { step: "02", title: "Land Assessed", desc: "Ownership documents and land quality evaluated by our team." },
              { step: "03", title: "Field Inspected", desc: "On-site visit by a certified field officer before listing." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex items-start gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  {step}
                </span>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Farmer grid */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-2xl font-bold">
              {farmers.length > 0 ? `${farmers.length} Verified Farmers` : "Our Farmer Community"}
            </h2>
            <p className="mt-1 text-muted-foreground">
              Farming families across Bangladesh&apos;s eight divisions.
            </p>
          </div>

          {farmers.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {farmers.map((farmer) => (
                <Card key={farmer.id} className="overflow-hidden">
                  <CardContent className="p-5">
                    {/* Avatar + name */}
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-lg font-bold">
                        {farmer.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{farmer.user.name}</p>
                        {farmer.farms[0] && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {farmer.farms[0].district}, {farmer.farms[0].division}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="mb-3 grid grid-cols-2 gap-2">
                      <div className="rounded-md bg-muted/50 p-2 text-center">
                        <p className="text-sm font-semibold text-primary">
                          {farmer.yearsExperience ?? "—"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Yrs Experience</p>
                      </div>
                      <div className="rounded-md bg-muted/50 p-2 text-center">
                        <p className="text-sm font-semibold text-primary">
                          {farmer.farms.reduce((s, f) => s + f._count.projects, 0)}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Projects</p>
                      </div>
                    </div>

                    {/* Specializations */}
                    {farmer.specializations.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {farmer.specializations.slice(0, 3).map((s) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Farm area */}
                    {farmer.farms[0] && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        {Number(farmer.farms[0].totalAreaAcres).toFixed(1)} acres ·{" "}
                        {farmer.farms[0].name}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border py-20 text-center">
              <p className="text-2xl mb-2">👨‍🌾</p>
              <p className="font-medium">Farmers joining soon</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We&apos;re onboarding verified farmers across Bangladesh.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Are you a farmer? */}
      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <Badge variant="secondary" className="mb-3">For Farmers</Badge>
              <h2 className="mb-4 text-3xl font-bold">Are You a Farmer?</h2>
              <p className="mb-6 text-muted-foreground leading-relaxed">
                If you have land, farming experience, and a project idea — Biniyog Club can help you
                access the capital you need. No collateral required. Fair terms. Full support.
              </p>
              <div className="space-y-4 mb-8">
                {FARMER_BENEFITS.map(({ icon, title, desc }) => (
                  <div key={title} className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      {icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{title}</p>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <ButtonLink href="/contact">Apply as a Farmer →</ButtonLink>
            </div>
            <div className="rounded-xl border border-border bg-card p-8">
              <h3 className="mb-4 font-semibold">Eligibility Requirements</h3>
              <ul className="space-y-3">
                {[
                  "Valid National ID (NID)",
                  "Minimum 1 acre of cultivable land (owned or leased)",
                  "At least 2 years of active farming experience",
                  "Clean financial history (no active loan defaults)",
                  "Willingness to allow field officer visits",
                  "Smartphone with internet access for reporting",
                ].map((req) => (
                  <li key={req} className="flex items-start gap-2 text-sm">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
