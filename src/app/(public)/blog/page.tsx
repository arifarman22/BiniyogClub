import type { Metadata } from "next";
import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/shared/button-link";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on agricultural investment, farming in Bangladesh, agritech trends, and financial literacy for investors and farmers.",
  openGraph: {
    title: "Blog — Biniyog Club",
    description: "Agricultural investment insights and farming stories from Bangladesh.",
  },
};

const POSTS = [
  {
    slug: "understanding-crop-cycle-returns",
    category: "Investor Guide",
    title: "Understanding Crop Cycle Returns: What Every New Investor Should Know",
    excerpt:
      "Agricultural investments follow seasonal rhythms. Learn how crop cycles affect your return timeline and why patience is the most valuable tool in agri-investing.",
    readTime: "6 min read",
    date: "January 15, 2025",
    featured: true,
  },
  {
    slug: "boro-rice-investment-guide",
    category: "Crop Guide",
    title: "Boro Rice Season: Why It's Bangladesh's Most Reliable Investment Window",
    excerpt:
      "Boro rice accounts for over 55% of Bangladesh's annual rice production. We break down why the November–April season consistently delivers strong investor returns.",
    readTime: "5 min read",
    date: "January 8, 2025",
    featured: false,
  },
  {
    slug: "kyc-why-it-matters",
    category: "Platform",
    title: "Why KYC Protects Both Investors and Farmers",
    excerpt:
      "Identity verification isn't just a regulatory checkbox. Here's how Biniyog Club's KYC process creates a foundation of trust that benefits everyone on the platform.",
    readTime: "4 min read",
    date: "December 22, 2024",
    featured: false,
  },
  {
    slug: "aquaculture-rising-sector",
    category: "Sector Spotlight",
    title: "Aquaculture: Bangladesh's Fastest-Growing Agricultural Investment Sector",
    excerpt:
      "Fish farming now contributes 3.5% of Bangladesh's GDP. We explore why shrimp and tilapia projects are attracting a new generation of agri-investors.",
    readTime: "7 min read",
    date: "December 10, 2024",
    featured: false,
  },
  {
    slug: "diversifying-agri-portfolio",
    category: "Investor Guide",
    title: "How to Diversify Your Agricultural Investment Portfolio",
    excerpt:
      "Spreading investments across crop types, regions, and seasons reduces risk and smooths your return curve. A practical guide to agri-portfolio construction.",
    readTime: "8 min read",
    date: "November 28, 2024",
    featured: false,
  },
  {
    slug: "farmer-success-rajshahi-mango",
    category: "Farmer Story",
    title: "From 2 Acres to 12: How Karim Funded His Mango Orchard Expansion",
    excerpt:
      "Abdur Karim from Rajshahi used three consecutive Biniyog Club projects to grow his mango farm from a small plot to a thriving 12-acre orchard.",
    readTime: "5 min read",
    date: "November 15, 2024",
    featured: false,
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  "Investor Guide": "bg-finance-100 text-finance-600",
  "Crop Guide": "bg-brand-100 text-brand-700",
  Platform: "bg-muted text-muted-foreground",
  "Sector Spotlight": "bg-harvest-100 text-harvest-600",
  "Farmer Story": "bg-brand-100 text-brand-700",
};

export default function BlogPage() {
  const [featured, ...rest] = POSTS;

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 to-brand-700 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-4 border-brand-400/40 bg-brand-700/60 text-brand-100">Insights & Stories</Badge>
          <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">The Biniyog Blog</h1>
          <p className="text-brand-100/90">
            Agricultural investment insights, farming stories, and platform updates.
          </p>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Featured post */}
          <div className="mb-10 rounded-xl border border-border bg-card p-8">
            <div className="mb-3 flex items-center gap-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[featured.category] ?? "bg-muted text-muted-foreground"}`}>
                {featured.category}
              </span>
              <Badge variant="secondary" className="text-xs">Featured</Badge>
            </div>
            <h2 className="mb-3 text-2xl font-bold sm:text-3xl">{featured.title}</h2>
            <p className="mb-4 text-muted-foreground leading-relaxed max-w-2xl">{featured.excerpt}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{featured.date}</span>
                <span>·</span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {featured.readTime}
                </span>
              </div>
              <ButtonLink href={`/blog/${featured.slug}`} variant="outline" size="sm">
                  Read Article →
                </ButtonLink>
            </div>
          </div>

          {/* Post grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-sm"
              >
                <span
                  className={`mb-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground"}`}
                >
                  {post.category}
                </span>
                <h3 className="mb-2 text-sm font-semibold leading-snug group-hover:text-primary line-clamp-2">
                  {post.title}
                </h3>
                <p className="mb-4 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                  {post.excerpt}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{post.date}</span>
                  <span>·</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {post.readTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
