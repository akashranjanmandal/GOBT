import { currentAdmin } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";
import { acquisition, conversions, notFound, pages, parseFilter, rawEvents, rawViews, vitals } from "@/lib/analytics/report";
import { savedInspections, searchReport } from "@/lib/analytics/gsc";

export const dynamic = "force-dynamic";

const cell = (v: unknown) => {
  if (v == null) return "";
  const s = typeof v === "number" ? String(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (head: string[], rows: unknown[][]) => "﻿" + [head, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
const ist = (t: unknown) => (t == null ? "" : new Date(Number(t) + 5.5 * 3600_000).toISOString().replace("T", " ").slice(0, 19));

/* CSV downloads of every analytics table, with the same filters as the page */
export async function GET(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return new Response("Not logged in", { status: 401 });
  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams.entries());
  const report = sp.report ?? "";
  const f = parseFilter(sp);
  let body: string;

  switch (report) {
    case "views": {
      const r = await rawViews(f);
      const cols = ["created_at", "day", "path", "title", "source", "medium", "campaign", "term", "device", "browser", "os", "country", "region", "city", "lang", "screen", "duration_ms", "scroll", "is_entry", "is_new_visitor", "not_found", "lcp", "inp", "cls", "fcp", "ttfb", "visitor", "session"];
      body = csv(["time (IST)", ...cols.slice(1)], r.map((x) => cols.map((c) => (c === "created_at" ? ist(x[c]) : x[c]))));
      break;
    }
    case "events": {
      const r = await rawEvents(f);
      body = csv(["time (IST)", "day", "event", "detail", "page", "visitor", "session"], r.map((x) => [ist(x.created_at), x.day, x.name, x.label, x.path, x.visitor, x.session]));
      break;
    }
    case "sources": {
      const a = await acquisition(f);
      body = csv(["source", "medium", "sessions", "visitors"], a.sources.map((s) => [s.source, s.medium, s.sessions, s.visitors]));
      break;
    }
    case "pages": {
      const r = await pages(f, 500);
      body = csv(["page", "title", "views", "visitors", "avg seconds", "avg scroll %", "entries", "exits", "exit rate %"], r.map((p) => [p.path, p.title, p.views, p.visitors, Math.round(p.avgMs / 1000), Math.round(p.avgScroll), p.entries, p.exits, Math.round(p.exitRate * 100)]));
      break;
    }
    case "leads-source":
    case "leads-landing": {
      const r = await conversions(f, report === "leads-source" ? "source" : "landing");
      body = csv([report === "leads-source" ? "source / medium" : "landing page", "sessions", "sessions with a lead", "conversion %", "whatsapp", "calls", "emails", "forms"], r.map((x) => [x.key, x.sessions, x.converted, (x.rate * 100).toFixed(1), x.whatsapp, x.calls, x.emails, x.forms]));
      break;
    }
    case "notfound": {
      const r = await notFound(f);
      body = csv(["missing address", "came from", "times", "last (IST)"], r.map((m) => [m.path, m.from, m.hits, ist(m.last)]));
      break;
    }
    case "vitals": {
      const v = await vitals(f);
      body = csv(["page", "visits measured", "LCP ms (p75)", "INP ms (p75)", "CLS (p75)", "FCP ms (p75)", "TTFB ms (p75)"], v.perPage.map((p) => [p.path, p.samples, p.lcp.p75, p.inp.p75, p.cls.p75, p.fcp.p75, p.ttfb.p75]));
      break;
    }
    case "gsc-queries":
    case "gsc-pages":
    case "gsc-opportunities": {
      const r = await searchReport({
        range: sp.range,
        from: sp.from,
        to: sp.to,
        type: sp.type,
        filters: { query: sp.q, queryExact: sp.qx, page: sp.p, pageExact: sp.px, country: sp.country, device: sp.device },
      });
      if (!r.ok) return new Response("Search Console isn't connected", { status: 400 });
      const rows = report === "gsc-pages" ? r.data.pages : report === "gsc-queries" ? r.data.queries : [...r.data.opportunities.striking, ...r.data.opportunities.lowCtr];
      body = csv([report === "gsc-pages" ? "page" : "search", "clicks", "impressions", "ctr %", "position"], rows.map((x) => [x.key, x.clicks, x.impressions, (x.ctr * 100).toFixed(2), x.position.toFixed(1)]));
      break;
    }
    case "index": {
      const m = await savedInspections();
      body = csv(["page", "verdict", "status", "last crawl", "google canonical", "your canonical", "mobile", "rich results", "checked (IST)"], [...m.values()].map((i) => [i.url, i.verdict, i.coverage, i.lastCrawl, i.googleCanonical, i.userCanonical, i.mobile, i.richItems.join(" "), ist(i.checkedAt)]));
      break;
    }
    default:
      return new Response("Unknown report", { status: 400 });
  }
  await audit(admin, "account.export", `Downloaded the “${report}” analytics CSV (${f.fromDay} to ${f.toDay})`);
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="gobt-${report}-${f.fromDay}-to-${f.toDay}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
