import type { Metadata } from "next";
import { getPlatformStats, getRecentUpdates, getFeaturedProjects } from "@/server/data/public.data";
import { getAllGroups } from "@/server/data/groups.data";
import { JsonLd, organizationSchema, websiteSchema, faqSchema } from "@/components/shared/json-ld";

import { HeroSection } from "@/components/home/hero-section";
import { MetricsDock } from "@/components/home/metrics-dock";
import { AboutSection } from "@/components/home/about-section";
import { WhyChooseSection } from "@/components/home/why-choose-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { FeaturedProjectsSection } from "@/components/home/featured-projects-section";
import { BusinessGroupsSection } from "@/components/home/business-groups-section";
import { PlatformFeaturesSection } from "@/components/home/platform-features-section";
import { SecuritySection } from "@/components/home/security-section";
import { DashboardPreviewSection } from "@/components/home/dashboard-preview-section";
import { CommunitySection } from "@/components/home/community-section";
import { CalculatorSection } from "@/components/home/calculator-section";
import { UpdatesSection } from "@/components/home/updates-section";
import { FaqSection } from "@/components/home/faq-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";

export const metadata: Metadata = {
  title: "Biniyog Club — Bangladesh's Premier Direct Investment Platform",
  description:
    "Join Bangladesh's premier investment platform. Invest directly in vetted business groups & commercial projects, earn competitive returns with complete legal security. Start from ৳5,000.",
};

const FAQS = [
  {
    q: "What is the minimum investment amount?",
    a: "You can start investing from as little as ৳5,000. Each project sets its own entry threshold, which is prominently displayed on the project card.",
  },
  {
    q: "How are projects verified and approved?",
    a: "All projects are curated and vetted by our finance and compliance teams. They undergo rigorous financial due diligence, physical site checks, and risk analysis before public listing.",
  },
  {
    q: "What returns can I expect?",
    a: "Returns vary depending on the sector, duration, and tier. Expected returns typically range from 14% to 26% annually. All projected returns and formulas are presented upfront.",
  },
  {
    q: "How do I withdraw my earnings?",
    a: "Returns and principal are credited to your Biniyog Club wallet upon milestone completion or maturity. You can withdraw directly to your verified Bangladeshi bank account or mobile wallet anytime.",
  },
  {
    q: "Is my investment legally protected?",
    a: "Yes. Every investment is executed with a digital agreement signed between you and the operating entity, complete with timestamps and legal enforceability under the Contract Act of Bangladesh.",
  },
  {
    q: "How does the payment and settlement process work?",
    a: "Investments can be deposited via instant bank transfer or mobile banking (bKash/Nagad). Our finance officers verify the transaction receipt before confirming your allocation.",
  },
];

export default async function HomePage() {
  const [stats, rawUpdates, rawGroups, rawProjects] = await Promise.all([
    getPlatformStats(),
    getRecentUpdates(3),
    getAllGroups(),
    getFeaturedProjects(6),
  ]);

  const groups = JSON.parse(JSON.stringify(rawGroups));
  const featuredProjects = JSON.parse(JSON.stringify(rawProjects));
  const recentUpdates = JSON.parse(JSON.stringify(rawUpdates));

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

  return (
    <>
      <JsonLd data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL), faqSchema(FAQS)]} />

      {/* ── SECTION 02 — HERO SECTION ── */}
      <HeroSection />

      {/* ── SECTION 03 — TRUST / STATISTICS BAR ── */}
      <MetricsDock stats={stats} />

      {/* ── SECTION 04 — ABOUT BINIYOGCLUB ── */}
      <AboutSection />

      {/* ── SECTION 05 — INVESTMENT PROJECTS ── */}
      <FeaturedProjectsSection featuredProjects={featuredProjects} />

      {/* ── SECTION 06 — BUSINESS GROUPS ── */}
      <BusinessGroupsSection groups={groups} />

      {/* ── SECTION 07 — WHY CHOOSE BINIYOGCLUB ── */}
      <WhyChooseSection />

      {/* ── SECTION 08 — HOW IT WORKS ── */}
      <HowItWorksSection />

      {/* ── SECTION 08 — PLATFORM FEATURES ── */}
      <PlatformFeaturesSection />

      {/* ── SECTION 09 — SECURITY & TRUST ── */}
      <SecuritySection />

      {/* ── SECTION 10 — DASHBOARD PREVIEW ── */}
      <DashboardPreviewSection />

      {/* ── SECTION 11 — COMMUNITY / REFERRAL / NETWORK ── */}
      <CommunitySection />

      {/* ── SECTION 12 — INTERACTIVE RETURN SIMULATOR ── */}
      <CalculatorSection />

      {/* ── SECTION 13 — LIVE PROJECT DISCLOSURES ── */}
      <UpdatesSection recentUpdates={recentUpdates} />

      {/* ── SECTION 14 — FREQUENTLY ASKED QUESTIONS ── */}
      <FaqSection />

      {/* ── SECTION 15 — ENTERPRISE FINAL CTA ── */}
      <FinalCtaSection totalInvestors={stats.totalInvestors} />
    </>
  );
}
