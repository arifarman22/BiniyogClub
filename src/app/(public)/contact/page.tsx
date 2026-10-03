import type { Metadata } from "next";
import ContactPageClient from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Investor Relations — Biniyog Club",
  description:
    "Get in touch with Biniyog Club. Investor support, business group partnerships, corporate syndicates, and general inquiries at our Mohakhali, Dhaka headquarters.",
  openGraph: {
    title: "Contact Biniyog Club | Investor Relations",
    description: "Reach our Dhaka headquarters for investor support, business group listings, or corporate syndicates.",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
