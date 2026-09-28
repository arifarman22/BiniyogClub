import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Biniyog Club's terms of service — the rules and conditions governing use of our agricultural investment platform.",
};

export default function TermsPage() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold">Terms of Service</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
        </div>

        <div className="space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing or using the Biniyog Club platform (&quot;Platform&quot;), you agree to be bound
              by these Terms of Service (&quot;Terms&quot;). If you do not agree, you may not use the
              Platform. These Terms constitute a legally binding agreement between you and Biniyog
              Club Ltd., a company registered in Bangladesh.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p className="leading-relaxed">
              You must be at least 18 years of age and a Bangladeshi citizen or Non-Resident
              Bangladeshi (NRB) to use the Platform. By registering, you represent and warrant that
              you meet these requirements and that all information you provide is accurate and
              complete.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Account Registration & KYC</h2>
            <p className="leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials.
              You must complete KYC verification before making any investment. Providing false
              information during KYC is grounds for immediate account termination and may result in
              legal action.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Investment Terms</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>All investments are subject to the specific terms disclosed on each project page.</li>
              <li>Investment contracts are legally binding once signed digitally by both parties.</li>
              <li>Biniyog Club acts as a marketplace facilitator, not a financial advisor. We do not guarantee returns.</li>
              <li>Past performance of projects does not guarantee future results.</li>
              <li>You acknowledge that agricultural investments carry inherent risks including crop failure, weather events, and market price fluctuations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Platform Fees</h2>
            <p className="leading-relaxed">
              Biniyog Club charges a platform fee on investment returns. The applicable fee
              percentage is disclosed on each project page before investment. No fees are charged on
              your principal amount. Fees are deducted automatically at the time of return
              distribution.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Wallet & Payments</h2>
            <p className="leading-relaxed">
              Your Biniyog Club wallet holds funds in a segregated escrow account. Biniyog Club does
              not pay interest on uninvested wallet balances. Withdrawal requests are processed
              within 1–3 business days. We reserve the right to delay withdrawals pending fraud
              investigation.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Prohibited Activities</h2>
            <p className="mb-2 leading-relaxed">You may not:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Use the Platform for money laundering or any illegal financial activity.</li>
              <li>Create multiple accounts or impersonate another person.</li>
              <li>Attempt to manipulate project funding or investor sentiment.</li>
              <li>Reverse-engineer, scrape, or copy Platform content without permission.</li>
              <li>Use automated tools to access the Platform without prior written consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Limitation of Liability</h2>
            <p className="leading-relaxed">
              To the maximum extent permitted by law, Biniyog Club shall not be liable for any
              indirect, incidental, or consequential damages arising from your use of the Platform
              or any investment loss. Our total liability to you shall not exceed the platform fees
              paid by you in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Dispute Resolution</h2>
            <p className="leading-relaxed">
              Any dispute arising from these Terms shall first be attempted to be resolved through
              good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to
              binding arbitration in Dhaka, Bangladesh, under applicable arbitration rules.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Governing Law</h2>
            <p className="leading-relaxed">
              These Terms are governed by the laws of the People&apos;s Republic of Bangladesh. The
              courts of Dhaka shall have exclusive jurisdiction over any disputes not resolved
              through arbitration.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">11. Changes to Terms</h2>
            <p className="leading-relaxed">
              We may modify these Terms at any time. We will provide at least 14 days&apos; notice of
              material changes via email. Continued use of the Platform after the effective date
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">12. Contact</h2>
            <p className="leading-relaxed">
              For questions about these Terms, contact us at{" "}
              <a href="mailto:legal@biniyog.club" className="text-primary hover:underline">
                legal@biniyog.club
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
