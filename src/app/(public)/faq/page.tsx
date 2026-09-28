import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/shared/button-link";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Frequently asked questions about investing on Biniyog Club — accounts, KYC, returns, withdrawals, risk, and more.",
  openGraph: {
    title: "FAQ — Biniyog Club",
    description: "Everything you need to know about agricultural investment on Biniyog Club.",
  },
};

const FAQ_SECTIONS = [
  {
    heading: "Getting Started",
    items: [
      {
        q: "Who can invest on Biniyog Club?",
        a: "Any Bangladeshi citizen aged 18 or above with a valid National ID can invest. Non-resident Bangladeshis (NRBs) may also invest subject to applicable regulations.",
      },
      {
        q: "How do I create an account?",
        a: "Click 'Start Investing' on the homepage, enter your name, email, and phone number, then verify your email. KYC verification is required before your first investment.",
      },
      {
        q: "What is KYC and why is it required?",
        a: "KYC (Know Your Customer) is an identity verification process required by Bangladesh's financial regulations. It protects both investors and farmers from fraud. You'll need to submit your National ID and a selfie.",
      },
      {
        q: "How long does KYC verification take?",
        a: "KYC is typically reviewed within 24–48 business hours. You'll receive an SMS and email notification once approved.",
      },
    ],
  },
  {
    heading: "Investing",
    items: [
      {
        q: "What is the minimum investment amount?",
        a: "The platform minimum is ৳5,000. Individual projects may set higher minimums, which are clearly displayed on each project page.",
      },
      {
        q: "Can I invest in multiple projects?",
        a: "Yes. We encourage diversification across different crop types, regions, and durations to spread risk.",
      },
      {
        q: "What happens if a project doesn't reach its funding goal?",
        a: "If a project fails to reach its minimum funding threshold by the deadline, all invested funds are returned to investors' wallets in full — no fees charged.",
      },
      {
        q: "Can I cancel my investment after committing?",
        a: "Investments can be cancelled within 48 hours of commitment, provided the project has not yet reached its funding goal. Once a project is fully funded and active, investments cannot be cancelled.",
      },
    ],
  },
  {
    heading: "Returns & Payments",
    items: [
      {
        q: "How are returns calculated?",
        a: "Returns are calculated based on the expected return percentage shown on each project page. For fixed-return projects, you receive a guaranteed percentage. For profit-share projects, returns depend on actual harvest proceeds.",
      },
      {
        q: "When do I receive my returns?",
        a: "Returns are distributed after the crop is harvested and sold. This typically occurs at the end of the project duration. You'll receive a notification when funds are credited to your wallet.",
      },
      {
        q: "How do I withdraw my money?",
        a: "You can withdraw from your wallet to a registered bank account or mobile banking number (bKash, Nagad, Rocket) at any time. Withdrawals are processed within 1–3 business days.",
      },
      {
        q: "Are there any fees?",
        a: "Biniyog Club charges a platform fee on returns only — not on your principal. The fee percentage is disclosed on each project page before you invest. There are no hidden charges.",
      },
    ],
  },
  {
    heading: "Risk & Safety",
    items: [
      {
        q: "What are the risks of agricultural investment?",
        a: "Agricultural investments carry risks including adverse weather, pest damage, disease, and market price fluctuations. We mitigate these through crop insurance, diversified project structures, and experienced farmer selection.",
      },
      {
        q: "What happens if a crop fails?",
        a: "In the event of a partial or full crop failure, investors are notified immediately. We work with farmers to recover maximum value. Where crop insurance applies, claims are processed and distributed to investors.",
      },
      {
        q: "Is my money safe on the platform?",
        a: "Uninvested wallet funds are held in a segregated escrow account. Invested funds are protected by legally binding contracts. We do not use investor funds for platform operations.",
      },
      {
        q: "Is Biniyog Club regulated?",
        a: "Biniyog Club operates under applicable Bangladesh financial regulations. All investment contracts are legally enforceable. We are committed to full regulatory compliance as the agri-fintech regulatory framework evolves.",
      },
    ],
  },
  {
    heading: "For Farmers",
    items: [
      {
        q: "How do I apply as a farmer?",
        a: "Visit our Contact page and select 'Farmer Application'. Our team will reach out within 3 business days to begin the onboarding process.",
      },
      {
        q: "Do I need to own land to apply?",
        a: "No. You can apply with leased land, provided you have a valid lease agreement of at least one full crop cycle duration.",
      },
      {
        q: "What are the repayment terms?",
        a: "Repayment terms are agreed upfront and documented in your project contract. Repayment occurs after harvest and crop sale — there are no monthly installments.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 text-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100">Help Center</Badge>
          <h1 className="mb-4 text-4xl font-bold text-white sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-brand-100/90">
            Everything you need to know about investing on Biniyog Club.
          </p>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="space-y-12">
            {FAQ_SECTIONS.map(({ heading, items }) => (
              <div key={heading}>
                <h2 className="mb-5 text-xl font-bold border-b border-border pb-3">{heading}</h2>
                <div className="space-y-4">
                  {items.map(({ q, a }) => (
                    <div key={q} className="rounded-xl border border-border bg-card p-5">
                      <p className="mb-2 font-semibold text-sm">{q}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-xl border border-border bg-muted/30 p-8 text-center">
            <h3 className="mb-2 font-semibold">Still have questions?</h3>
            <p className="mb-5 text-sm text-muted-foreground">
              Our support team is available Sunday–Thursday, 9am–6pm BST.
            </p>
            <ButtonLink href="/contact">Contact Support →</ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
