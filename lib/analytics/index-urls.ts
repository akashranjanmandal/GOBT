import "server-only";
import sitemap from "@/app/sitemap";

/* every page we want in Google: the URLs in gobt.in/sitemap.xml */
export async function indexUrls() {
  const entries = await sitemap();
  return [...new Set(entries.map((e) => e.url))];
}
