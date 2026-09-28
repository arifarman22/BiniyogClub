import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Biniyog Club's privacy policy — how we collect, use, and protect your personal data.",
};

export default function PrivacyPage() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="mb-2 text-3xl font-bold">Privacy Policy</h1>
          <p className="text-sm text-muted-foreground">Last updated: January 1, 2025</p>
        </div>

        <div className="prose prose-sm max-w-none space-y-8 text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Introduction</h2>
            <p className="leading-relaxed">
              Biniyog Club Ltd. (&quot;Biniyog Club&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to
              protecting your personal information. This Privacy Policy explains how we collect,
              use, disclose, and safeguard your data when you use our platform at biniyog.club and
              related mobile applications.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Information We Collect</h2>
            <p className="mb-2 leading-relaxed">We collect the following categories of information:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-foreground">Identity Data:</strong> Full name, National ID number, date of birth, photograph.</li>
              <li><strong className="text-foreground">Contact Data:</strong> Email address, phone number, postal address.</li>
              <li><strong className="text-foreground">Financial Data:</strong> Bank account details, mobile banking numbers, transaction history.</li>
              <li><strong className="text-foreground">Usage Data:</strong> IP address, browser type, pages visited, time spent on platform.</li>
              <li><strong className="text-foreground">Device Data:</strong> Device identifiers, operating system, app version.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To verify your identity and comply with KYC/AML regulations.</li>
              <li>To process investments, payments, and withdrawals.</li>
              <li>To send transaction confirmations, project updates, and account notifications.</li>
              <li>To improve platform features and user experience.</li>
              <li>To detect and prevent fraud and unauthorized access.</li>
              <li>To comply with applicable laws and regulatory requirements.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Sharing</h2>
            <p className="leading-relaxed">
              We do not sell your personal data. We may share your information with:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1.5">
              <li>KYC verification service providers (under strict data processing agreements).</li>
              <li>Payment processors and banking partners for transaction processing.</li>
              <li>Regulatory authorities when required by law.</li>
              <li>Farmers, only to the extent necessary to manage your investment (e.g., investor count, not personal details).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Data Security</h2>
            <p className="leading-relaxed">
              We implement industry-standard security measures including AES-256 encryption at
              rest, TLS 1.3 in transit, bcrypt password hashing, and regular security audits. Access
              to personal data is restricted to authorized personnel on a need-to-know basis.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Data Retention</h2>
            <p className="leading-relaxed">
              We retain your personal data for as long as your account is active and for a minimum
              of 7 years after account closure to comply with financial record-keeping requirements
              under Bangladesh law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">7. Your Rights</h2>
            <p className="mb-2 leading-relaxed">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (subject to legal retention requirements).</li>
              <li>Withdraw consent for marketing communications at any time.</li>
            </ul>
            <p className="mt-2 leading-relaxed">
              To exercise these rights, contact us at privacy@biniyog.club.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">8. Cookies</h2>
            <p className="leading-relaxed">
              We use essential cookies for session management and security. We do not use
              third-party advertising cookies. You can control cookie preferences through your
              browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">9. Changes to This Policy</h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy periodically. We will notify you of material changes
              via email and a prominent notice on the platform at least 14 days before changes take
              effect.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">10. Contact</h2>
            <p className="leading-relaxed">
              For privacy-related inquiries, contact our Data Protection Officer at{" "}
              <a href="mailto:privacy@biniyog.club" className="text-primary hover:underline">
                privacy@biniyog.club
              </a>{" "}
              or write to: Biniyog Club Ltd., Gulshan-2, Dhaka 1212, Bangladesh.
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
