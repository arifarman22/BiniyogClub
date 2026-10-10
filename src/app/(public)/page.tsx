import type { Metadata } from "next";
import { getPlatformStats, getRecentUpdates, getFeaturedProjects, getGroupsWithProjects } from "@/server/data/public.data";
import { getAllGroups } from "@/server/data/groups.data";
import { JsonLd, organizationSchema, websiteSchema, faqSchema } from "@/components/shared/json-ld";
import { HOME_FAQS } from "@/components/shared/faq-data";

import { HeroSection } from "@/components/home/hero-section";
import { HierarchySection } from "@/components/home/hierarchy-section";
import { AboutSection } from "@/components/home/about-section";
import { WhyChooseSection } from "@/components/home/why-choose-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { FeaturedProjectsSection } from "@/components/home/featured-projects-section";
import { BusinessGroupsSection } from "@/components/home/business-groups-section";
import { PlatformFeaturesSection } from "@/components/home/platform-features-section";
import { SecuritySection } from "@/components/home/security-section";
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

export default async function HomePage() {
  const [stats, rawUpdates, rawGroups, rawProjects, rawHierarchy] = await Promise.all([
    getPlatformStats(),
    getRecentUpdates(3),
    getAllGroups(),
    getFeaturedProjects(6),
    getGroupsWithProjects(),
  ]);

  const groups = JSON.parse(JSON.stringify(rawGroups));
  const featuredProjects = JSON.parse(JSON.stringify(rawProjects));
  const recentUpdates = JSON.parse(JSON.stringify(rawUpdates));
  const hierarchyGroups = JSON.parse(JSON.stringify(rawHierarchy));

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

  // Section backgrounds alternate plain → tinted, with dark "anchor" sections
  // (Security, Final CTA) breaking up the page. Keep that rhythm when reordering.
  return (
    <>
      <JsonLd data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL), faqSchema(HOME_FAQS)]} />

      {/* ── SECTION 01 — HERO VIDEO ── */}
      <HeroSection />

      {/* ── SECTION 02 — PLATFORM HIERARCHY (tinted) ── */}
      <HierarchySection groups={hierarchyGroups} />

      {/* ── SECTION 03 — INVESTMENT PROJECTS (plain) ── */}
      <FeaturedProjectsSection featuredProjects={featuredProjects} />

      {/* ── SECTION 04 — HOW IT WORKS (tinted) ── */}
      <HowItWorksSection />

      {/* ── SECTION 05 — BUSINESS GROUPS (plain) ── */}
      <BusinessGroupsSection groups={groups} />

      {/* ── SECTION 06 — ABOUT BINIYOGCLUB (tinted) ── */}
      <AboutSection />

      {/* ── SECTION 07 — WHY CHOOSE BINIYOGCLUB (plain) ── */}
      <WhyChooseSection />

      {/* ── SECTION 08 — SECURITY & TRUST (dark) ── */}
      <SecuritySection />

      {/* ── SECTION 09 — PLATFORM FEATURES (plain) ── */}
      <PlatformFeaturesSection />

      {/* ── SECTION 11 — INTERACTIVE RETURN SIMULATOR (plain) ── */}
      <CalculatorSection />

      {/* ── SECTION 12 — COMMUNITY / REFERRAL / NETWORK (tinted) ── */}
      <CommunitySection />

      {/* ── SECTION 13 — LIVE PROJECT DISCLOSURES (plain) ── */}
      <UpdatesSection recentUpdates={recentUpdates} />

      {/* ── SECTION 14 — FREQUENTLY ASKED QUESTIONS (tinted) ── */}
      <FaqSection />

      {/* ── SECTION 15 — FINAL CTA (dark) ── */}
      <FinalCtaSection totalInvestors={stats.totalInvestors} />
    </>
  );
}
