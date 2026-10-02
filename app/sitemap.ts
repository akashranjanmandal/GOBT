import type { MetadataRoute } from "next";
import { SERVICE_PAGES, SITE, servicePath } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    ...SERVICE_PAGES.map((s) => ({
      url: `${SITE.url}${servicePath(s.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
  ];
}
