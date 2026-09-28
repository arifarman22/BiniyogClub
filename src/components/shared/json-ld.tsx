type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Biniyog Club",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "Bangladesh's agricultural investment platform connecting investors with verified farmers.",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dhaka",
      addressCountry: "BD",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@biniyog.club",
      availableLanguage: ["English", "Bengali"],
    },
    sameAs: [
      "https://facebook.com/biniyogclub",
      "https://twitter.com/biniyogclub",
      "https://linkedin.com/company/biniyogclub",
    ],
  };
}

export function websiteSchema(baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Biniyog Club",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${baseUrl}/projects?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function projectSchema(project: {
  title: string;
  description: string;
  slug: string;
  coverImageUrl?: string | null;
  fundingGoalBdt: string | number;
  fundedAmountBdt: string | number;
  expectedReturnPct: string | number;
  fundingDeadline: Date | string;
  baseUrl: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: project.title,
    description: project.description,
    url: `${project.baseUrl}/projects/${project.slug}`,
    image: project.coverImageUrl ?? undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: Number(project.fundingGoalBdt),
      availability: "https://schema.org/InStock",
      validThrough: new Date(project.fundingDeadline).toISOString(),
    },
  };
}
