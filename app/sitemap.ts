import type { MetadataRoute } from "next";
import { WORKS } from "@/lib/content";
import { SERVICE_PAGES, SITE, servicePath, workPath } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/kolkata`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/academy`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/academy/form`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/referral`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/referral/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/careers`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...SERVICE_PAGES.map((s) => ({
      url: `${SITE.url}${servicePath(s.slug)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    ...WORKS.map((w) => ({
      url: `${SITE.url}${workPath(w.title)}`,
      lastModified: now,
      changeFrequency: "yearly" as const,
      priority: 0.7,
      images: [`${SITE.url}${w.image}`],
    })),
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
