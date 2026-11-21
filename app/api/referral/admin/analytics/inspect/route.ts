import { currentAdmin } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";
import { inspectUrls } from "@/lib/analytics/gsc";
import { indexUrls } from "@/lib/analytics/index-urls";

export const dynamic = "force-dynamic";

/* checks a handful of pages with Google per call (serverless time limits);
   the page calls this repeatedly and shows progress */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return Response.json({ error: "Not logged in" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { urls?: string[] };
  const allowed = new Set(await indexUrls());
  const urls = (body.urls ?? []).filter((u) => allowed.has(u)).slice(0, 6);
  if (!urls.length) return Response.json({ done: 0, errors: [] });
  const r = await inspectUrls(urls, 7000);
  if (!r.ok) return Response.json({ error: r.error }, { status: 400 });
  if (r.done) await audit(admin, "account.inspect", `Checked ${r.done} page${r.done === 1 ? "" : "s"} with Google URL Inspection`);
  return Response.json(r);
}
