import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Crawlers hit below URL often, which is not needed
      disallow: "/_vercel/insights/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
