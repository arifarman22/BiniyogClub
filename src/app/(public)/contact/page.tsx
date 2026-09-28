import type { Metadata } from "next";
import ContactPageClient from "./contact-form";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Biniyog Club. Investor support, farmer applications, partnerships, and general inquiries.",
  openGraph: {
    title: "Contact Biniyog Club",
    description: "Reach our team for support, farmer applications, or partnership inquiries.",
  },
};

export default function ContactPage() {
  return <ContactPageClient />;
}
