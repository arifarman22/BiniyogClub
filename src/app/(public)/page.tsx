import type { Metadata } from "next";
import { getPlatformStats, getFeaturedProjects, getGroupsWithProjects } from "@/server/data/public.data";
import { getAllGroups } from "@/server/data/groups.data";
import { JsonLd, organizationSchema, websiteSchema } from "@/components/shared/json-ld";

import { HeroSection } from "@/components/home/hero-section";
import { AboutSection } from "@/components/home/about-section";
import { HierarchySection } from "@/components/home/hierarchy-section";
import { FeaturedProjectsSection } from "@/components/home/featured-projects-section";
import { HowItWorksSection } from "@/components/home/how-it-works-section";
import { BusinessGroupsSection } from "@/components/home/business-groups-section";
import { SecuritySection } from "@/components/home/security-section";
import { FinalCtaSection } from "@/components/home/final-cta-section";

export const metadata: Metadata = {
  title: "Biniyog Club — Bangladesh's Premier Direct Investment Platform",
  description:
    "Join Bangladesh's premier investment platform. Invest directly in vetted business groups & commercial projects, earn competitive returns with complete legal security. Start from ৳5,000.",
};

export default async function HomePage() {
  const [stats, rawGroups, rawProjects, rawHierarchy] = await Promise.all([
    getPlatformStats(),
    getAllGroups(),
    getFeaturedProjects(6),
    getGroupsWithProjects(),
  ]);

  const groups = JSON.parse(JSON.stringify(rawGroups));
  const featuredProjects = JSON.parse(JSON.stringify(rawProjects));
  const hierarchyGroups = JSON.parse(JSON.stringify(rawHierarchy));

  const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

  // Section backgrounds alternate plain → tinted, closing on the two dark
  // sections (Transparency, Registration). Keep that rhythm when reordering.
  return (
    <>
      <JsonLd data={[organizationSchema(BASE_URL), websiteSchema(BASE_URL)]} />

      {/* ── 01 HERO — Your Gateway to Real Business Opportunities ── */}
      <HeroSection />

      {/* ── 02 ABOUT — Discover the Power of Collective Opportunities (plain) ── */}
      <AboutSection />

      {/* ── 03 BUSINESS SEGMENTS — One Platform. Six Business Segments. (tinted) ── */}
      <HierarchySection groups={hierarchyGroups} />

      {/* ── 04 INVESTMENT OPPORTUNITIES — Explore Businesses You Can Be Part Of (plain) ── */}
      <FeaturedProjectsSection featuredProjects={featuredProjects} />

      {/* ── 05 HOW IT WORKS — Your Investment Journey, Simplified (tinted) ── */}
      <HowItWorksSection />

      {/* ── 06 OUR PORTFOLIO — Explore the Businesses Behind the Opportunities (plain) ── */}
      <BusinessGroupsSection groups={groups} />

      {/* ── 07 TRANSPARENCY — Clarity, Accountability & Informed Decisions (dark) ── */}
      <SecuritySection />

      {/* ── 08 REGISTRATION — Join the Biniyog Club Ecosystem (dark) ── */}
      <FinalCtaSection totalInvestors={stats.totalInvestors} />
    </>
  );
}
