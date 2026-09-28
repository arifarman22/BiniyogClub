import type { Metadata } from "next";
import {
  UserCheck,
  Search,
  Wallet,
  BarChart3,
  TrendingUp,
  ShieldCheck,
  FileText,
  Bell,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/shared/button-link";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "Learn how Biniyog Club works — from account creation and KYC to investing in farm projects and receiving returns. Simple, transparent, secure.",
  openGraph: {
    title: "How Biniyog Club Works",
    description: "A step-by-step guide to investing in Bangladesh's agricultural projects.",
  },
};

const INVESTOR_STEPS = [
  {
    step: "01",
    icon: <UserCheck className="h-6 w-6" />,
    title: "Register & Verify",
    desc: "Create your account with your email and phone number. Complete KYC by submitting your National ID — verification takes 24–48 hours.",
  },
  {
    step: "02",
    icon: <Wallet className="h-6 w-6" />,
    title: "Fund Your Wallet",
    desc: "Add funds via bank transfer, bKash, or Nagad. Your wallet balance is held in escrow until you invest — fully secure.",
  },
  {
    step: "03",
    icon: <Search className="h-6 w-6" />,
    title: "Choose a Project",
    desc: "Browse verified projects. Review farm details, expected returns, risk disclosures, and the farmer's track record before committing.",
  },
  {
    step: "04",
    icon: <FileText className="h-6 w-6" />,
    title: "Sign & Invest",
    desc: "Review and digitally sign your investment contract. Funds are released to the farmer only after the project reaches its funding goal.",
  },
  {
    step: "05",
    icon: <Bell className="h-6 w-6" />,
    title: "Track Progress",
    desc: "Receive milestone updates, field visit reports, and harvest notifications directly in your dashboard and via SMS.",
  },
  {
    step: "06",
    icon: <TrendingUp className="h-6 w-6" />,
    title: "Receive Returns",
    desc: "After harvest and crop sale, your principal plus returns are credited to your wallet. Withdraw anytime to your bank or mobile banking.",
  },
];

const FARMER_STEPS = [
  {
    step: "01",
    title: "Apply as a Farmer",
    desc: "Submit your farm details, land documents, and farming history. Our team reviews your application within 5 business days.",
  },
  {
    step: "02",
    title: "Field Assessment",
    desc: "A certified field officer visits your farm to verify land, assess soil quality, and evaluate your farming capacity.",
  },
  {
    step: "03",
    title: "Create a Project",
    desc: "Work with our project team to structure your funding request — crop type, area, expected yield, timeline, and return terms.",
  },
  {
    step: "04",
    title: "Get Funded",
    desc: "Once approved and listed, investors fund your project. Capital is released in tranches aligned with crop cycle milestones.",
  },
  {
    step: "05",
    title: "Grow & Report",
    desc: "Submit regular updates and allow field officer visits. Transparency builds investor trust and improves your future funding prospects.",
  },
  {
    step: "06",
    title: "Harvest & Repay",
    desc: "After harvest, proceeds are distributed — you keep your agreed share, investors receive their returns, and the platform takes a small fee.",
  },
];

const PROTECTIONS = [
  { icon: <ShieldCheck className="h-5 w-5" />, title: "Escrow-Protected Funds", desc: "Investor funds are held in escrow and only released when a project is fully funded." },
  { icon: <FileText className="h-5 w-5" />, title: "Legally Binding Contracts", desc: "Every investment is backed by a digitally signed contract enforceable under Bangladesh law." },
  { icon: <UserCheck className="h-5 w-5" />, title: "KYC on Both Sides", desc: "Both investors and farmers are identity-verified before any transaction occurs." },
  { icon: <BarChart3 className="h-5 w-5" />, title: "Immutable Ledger", desc: "All financial movements are recorded in a double-entry ledger that cannot be altered." },
];

export default function HowItWorksPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-20 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100">Simple & Transparent</Badge>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">How It Works</h1>
          <p className="text-lg text-brand-100/90">
            Biniyog Club is designed to be straightforward for both investors and farmers. Here&apos;s
            exactly how the platform works — no jargon, no surprises.
          </p>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3">For Investors</Badge>
            <h2 className="text-3xl font-bold">Your Investment Journey</h2>
            <p className="mt-2 text-muted-foreground">From sign-up to returns in six clear steps.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {INVESTOR_STEPS.map(({ step, icon, title, desc }) => (
              <div key={step} className="rounded-xl border border-border bg-card p-6">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {icon}
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground/20">{step}</span>
                </div>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/register">Start Investing →</ButtonLink>
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <Badge variant="secondary" className="mb-3">For Farmers</Badge>
            <h2 className="text-3xl font-bold">Getting Your Farm Funded</h2>
            <p className="mt-2 text-muted-foreground">A clear path from application to capital.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FARMER_STEPS.map(({ step, title, desc }) => (
              <div key={step} className="rounded-xl border border-border bg-card p-6">
                <span className="mb-3 block text-3xl font-bold text-primary/20">{step}</span>
                <h3 className="mb-2 font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <ButtonLink href="/contact" variant="outline">Apply as a Farmer →</ButtonLink>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <Badge variant="secondary" className="mb-3">Built-In Safeguards</Badge>
            <h2 className="text-3xl font-bold">How We Protect You</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PROTECTIONS.map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-6 text-center">
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {icon}
                </div>
                <h3 className="mb-2 text-sm font-semibold">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="mb-4 text-2xl font-bold">Ready to Get Started?</h2>
          <p className="mb-6 text-muted-foreground">
            Create your free account today and explore live investment opportunities.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <ButtonLink href="/register">Create Account →</ButtonLink>
            <ButtonLink href="/faq" variant="outline">Read the FAQ</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
