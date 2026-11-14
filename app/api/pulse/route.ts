import { cookies } from "next/headers";
import { collect, type Beacon } from "@/lib/analytics/collect";
import { SITE } from "@/lib/seo";

export const dynamic = "force-dynamic";

const SITE_HOST = new URL(SITE.url).hostname.replace(/^www\./, "");

/* page views, time on page and clicks from the site's own tracker */
export async function POST(req: Request) {
  try {
    /* the team's own browsing doesn't count */
    if ((await cookies()).get("gobt_admin")?.value) return new Response(null, { status: 204 });
    const text = await req.text();
    if (text.length > 4000) return new Response(null, { status: 413 });
    const body = JSON.parse(text) as Beacon | Beacon[];
    for (const b of (Array.isArray(body) ? body : [body]).slice(0, 10)) await collect(b, req.headers, SITE_HOST);
  } catch (e) {
    console.error("[pulse]", e);
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
