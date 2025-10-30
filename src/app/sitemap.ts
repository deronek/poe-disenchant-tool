import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/constants";
import { DEFAULT_LEAGUE, LEAGUE_SLUGS } from "@/lib/leagues";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString();

  return LEAGUE_SLUGS.map((slug) => {
    const isDefault = slug === DEFAULT_LEAGUE;

    return {
      url: `${BASE_URL}/${slug}`,
      lastModified: lastModified,
      changeFrequency: "hourly",
      priority: isDefault ? 1.0 : 0.8,
    };
  });
}
