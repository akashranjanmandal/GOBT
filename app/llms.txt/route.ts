import { WORKS } from "@/lib/content";
import { HOME_FAQS, SERVICE_PAGES, SITE, servicePath, workPath } from "@/lib/seo";

export const dynamic = "force-static";

/* llms.txt — a plain summary of the site for AI assistants and answer engines */
export function GET() {
  const body = [
    `# ${SITE.legalName}`,
    "",
    `> ${SITE.description}`,
    "",
    `Based in ${SITE.city}, ${SITE.region}, India; works with clients across India. Contact: ${SITE.email}, ${SITE.phone}.`,
    "",
    "## Services",
    "",
    ...SERVICE_PAGES.map((s) => `- [${s.name}](${SITE.url}${servicePath(s.slug)}): ${s.metaDescription}`),
    "",
    "## Case studies",
    "",
    ...WORKS.map((w) => `- [${w.title} — ${w.tag}](${SITE.url}${workPath(w.title)}): ${w.desc}`),
    "",
    "## FAQ",
    "",
    ...HOME_FAQS.map((f) => `- ${f.q} ${f.a}`),
    "",
    "## More",
    "",
    `- [Software development in Kolkata](${SITE.url}/kolkata)`,
    `- [Contact](${SITE.url}/#contact)`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
