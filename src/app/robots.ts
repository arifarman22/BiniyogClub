import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://biniyog.club";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/projects", "/projects/", "/farmers", "/how-it-works", "/updates", "/about", "/blog", "/faq", "/contact", "/privacy", "/terms"],
        disallow: ["/investor/", "/farmer/", "/admin/", "/staff/", "/api/", "/design-system"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
