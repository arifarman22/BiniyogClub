import type { Metadata } from "next";
import { Target, Eye, Heart, Users, Sprout, ShieldCheck, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/shared/button-link";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Biniyog Club — our mission to democratize agricultural investment in Bangladesh and empower farmers with fair access to capital.",
  openGraph: {
    title: "About Biniyog Club",
    description: "Our mission, team, and commitment to Bangladesh's agricultural future.",
  },
};

const VALUES = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Trust Through Transparency",
    desc: "Every transaction, every field visit, every harvest report is recorded and accessible to investors. We have nothing to hide.",
  },
  {
    icon: <Heart className="h-5 w-5" />,
    title: "Farmer-First Philosophy",
    desc: "Farmers are our partners, not just borrowers. We structure projects so that farmers earn fairly while investors receive competitive returns.",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "Data-Driven Agriculture",
    desc: "We combine traditional farming knowledge with modern data tools to improve yield predictions and reduce investment risk.",
  },
  {
    icon: <Users className="h-5 w-5" />,
    title: "Community Impact",
    desc: "Beyond returns, we measure success by the number of farming families lifted, the food produced, and the rural livelihoods strengthened.",
  },
];

const MILESTONES = [
  { year: "2023", event: "Biniyog Club founded in Dhaka with a mission to bridge the agri-finance gap." },
  { year: "2024", event: "Launched pilot with 12 verified farmers across Rajshahi and Mymensingh divisions." },
  { year: "2024", event: "Crossed ৳1 Crore in total investments. First batch of investors received returns." },
  { year: "2025", event: "Expanded to 8 divisions. Introduced aquaculture and poultry investment categories." },
  { year: "2025", event: "Launched mobile app and real-time field tracking with IoT sensor integration." },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100">Our Story</Badge>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Bridging Capital and Cultivation
          </h1>
          <p className="text-lg text-brand-100/90">
            Biniyog Club was born from a simple observation: Bangladesh has millions of skilled
            farmers who lack capital, and millions of savers who lack meaningful investment options.
            We built the bridge.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                icon: <Target className="h-6 w-6" />,
                label: "Mission",
                text: "To democratize agricultural investment in Bangladesh by creating a transparent, technology-driven platform that connects verified farmers with everyday investors.",
              },
              {
                icon: <Eye className="h-6 w-6" />,
                label: "Vision",
                text: "A Bangladesh where every farmer has access to fair capital and every citizen can participate in the nation's agricultural growth.",
              },
              {
                icon: <Sprout className="h-6 w-6" />,
                label: "Impact",
                text: "By 2030, we aim to fund 10,000 farm projects, support 50,000 farming families, and contribute meaningfully to Bangladesh's food security.",
              },
            ].map(({ icon, label, text }) => (
              <div key={label} className="rounded-xl border border-border bg-card p-8 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {icon}
                </div>
                <h2 className="mb-3 text-xl font-bold">{label}</h2>
                <p className="text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">What We Stand For</Badge>
            <h2 className="text-3xl font-bold">Our Core Values</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Our Journey</Badge>
            <h2 className="text-3xl font-bold">Key Milestones</h2>
          </div>
          <div className="relative space-y-6 before:absolute before:left-16 before:top-0 before:h-full before:w-px before:bg-border">
            {MILESTONES.map(({ year, event }) => (
              <div key={event} className="flex gap-6">
                <span className="w-12 shrink-0 text-right text-sm font-semibold text-primary">
                  {year}
                </span>
                <div className="relative flex-1 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
                  <div className="absolute -left-[25px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border-2 border-primary bg-background" />
                  {event}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold">Join the Movement</h2>
          <p className="mb-6 text-muted-foreground">
            Whether you&apos;re an investor looking for meaningful returns or a farmer seeking fair
            capital — Biniyog Club is built for you.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/register">Get Started →</ButtonLink>
            <ButtonLink href="/contact" variant="outline">Contact Us</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
