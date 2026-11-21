import "server-only";
import { SignJWT, importPKCS8 } from "jose";
import { db, now } from "@/lib/referral/db";

/* Google Search Console: the searches people type before they reach
   gobt.in (queries, impressions, clicks, position) and Google's view of
   each page (URL Inspection). Google only shares this through its API, so it
   needs a service account added to the property:
     GSC_CREDENTIALS  the service account's JSON key (raw or base64)
     GSC_SITE         "sc-domain:gobt.in" (Domain property, the default)
                      or "https://gobt.in/" (URL-prefix property) */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://searchconsole.googleapis.com/webmasters/v3/sites";
const INSPECT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect";
const SCOPE = "https://www.googleapis.com/auth/webmasters.readonly";

type Config = { email: string; key: string; site: string };

export function gscConfig(): { ok: true; config: Config } | { ok: false; reason: "missing" | "invalid" } {
  const raw = process.env.GSC_CREDENTIALS?.trim();
  if (!raw) return { ok: false, reason: "missing" };
  try {
    const json = raw.startsWith("{") ? raw : Buffer.from(raw, "base64").toString("utf8");
    const c = JSON.parse(json) as { client_email?: string; private_key?: string };
    if (!c.client_email || !c.private_key) return { ok: false, reason: "invalid" };
    return { ok: true, config: { email: c.client_email, key: c.private_key.replace(/\\n/g, "\n"), site: process.env.GSC_SITE?.trim() || "sc-domain:gobt.in" } };
  } catch {
    return { ok: false, reason: "invalid" };
  }
}

let token: { value: string; exp: number } | null = null;

async function accessToken(c: Config) {
  if (token && token.exp > Date.now() + 60_000) return token.value;
  const key = await importPKCS8(c.key, "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(c.email)
    .setAudience(TOKEN_URL)
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(key);
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !body.access_token) throw new Error(`Google sign-in failed: ${body.error_description ?? res.status}`);
  token = { value: body.access_token, exp: Date.now() + (body.expires_in ?? 3600) * 1000 };
  return token.value;
}

async function call<T>(c: Config, url: string, body?: object): Promise<T> {
  const res = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${await accessToken(c)}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const out = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    const msg = out.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 403) throw new Error(`Google refused access (${msg}). Add ${c.email} as a user of the Search Console property ${c.site}.`);
    throw new Error(msg);
  }
  return out;
}

/* ── search performance ── */

export const SEARCH_TYPES = [
  { id: "web", label: "Web" },
  { id: "image", label: "Images" },
  { id: "video", label: "Videos" },
  { id: "news", label: "News tab" },
  { id: "discover", label: "Discover" },
  { id: "googleNews", label: "Google News" },
] as const;
export type SearchType = (typeof SEARCH_TYPES)[number]["id"];

export const GSC_RANGES = [
  { id: "7", label: "7 days" },
  { id: "28", label: "28 days" },
  { id: "90", label: "3 months" },
  { id: "180", label: "6 months" },
  { id: "365", label: "12 months" },
  { id: "480", label: "16 months" },
] as const;

export type GscFilters = { query?: string; queryExact?: string; page?: string; pageExact?: string; country?: string; device?: string };

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
export type Metric = { key: string; clicks: number; impressions: number; ctr: number; position: number };

const DAY = 86_400_000;
const ymd = (t: number) => new Date(t + 5.5 * 3600_000).toISOString().slice(0, 10);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/* Search Console data arrives about two days late */
export function gscPeriod(range?: string, from?: string, to?: string) {
  const latest = Date.now() - 2 * DAY;
  if (from && to && DATE.test(from) && DATE.test(to) && from <= to) {
    const s = Date.parse(`${from}T00:00:00Z`);
    const e = Math.min(Date.parse(`${to}T00:00:00Z`), latest);
    const days = Math.max(1, Math.round((e - s) / DAY) + 1);
    return { range: "custom", start: from, end: ymd(e), pStart: ymd(s - days * DAY), pEnd: ymd(s - DAY), days };
  }
  const id = GSC_RANGES.some((r) => r.id === range) ? range! : "28";
  const days = Number(id);
  const s = latest - (days - 1) * DAY;
  return { range: id, start: ymd(s), end: ymd(latest), pStart: ymd(s - days * DAY), pEnd: ymd(s - DAY), days };
}

function filterGroups(f: GscFilters) {
  const filters: { dimension: string; operator: string; expression: string }[] = [];
  if (f.queryExact) filters.push({ dimension: "query", operator: "equals", expression: f.queryExact });
  else if (f.query) filters.push({ dimension: "query", operator: "contains", expression: f.query });
  if (f.pageExact) filters.push({ dimension: "page", operator: "equals", expression: f.pageExact });
  else if (f.page) filters.push({ dimension: "page", operator: "contains", expression: f.page });
  if (f.country) filters.push({ dimension: "country", operator: "equals", expression: f.country.toLowerCase() });
  if (f.device) filters.push({ dimension: "device", operator: "equals", expression: f.device.toUpperCase() });
  return filters.length ? [{ groupType: "and", filters }] : undefined;
}

async function query(c: Config, o: { start: string; end: string; dimensions: string[]; type: SearchType; filters: GscFilters; rowLimit?: number }): Promise<Metric[]> {
  const r = await call<{ rows?: Row[] }>(c, `${API}/${encodeURIComponent(c.site)}/searchAnalytics/query`, {
    startDate: o.start,
    endDate: o.end,
    dimensions: o.dimensions,
    type: o.type,
    dimensionFilterGroups: filterGroups(o.filters),
    rowLimit: o.rowLimit ?? 25,
    dataState: "all",
  });
  return (r.rows ?? []).map((x) => ({ key: (x.keys ?? []).join(" ‖ "), clicks: x.clicks ?? 0, impressions: x.impressions ?? 0, ctr: x.ctr ?? 0, position: x.position ?? 0 }));
}

/* some search types don't support some breakdowns (e.g. Discover has no queries) */
const soft = <T,>(p: Promise<T>, empty: T) => p.catch(() => empty);

/* typical click rates by position on page 1, used to spot titles that under-perform */
const EXPECTED_CTR = [0.28, 0.15, 0.11, 0.08, 0.06, 0.05, 0.04, 0.03, 0.025, 0.02];
export const expectedCtr = (pos: number) => EXPECTED_CTR[Math.min(9, Math.max(0, Math.round(pos) - 1))];

async function build(c: Config, period: ReturnType<typeof gscPeriod>, type: SearchType, filters: GscFilters) {
  const base = { type, filters };
  const cur = { start: period.start, end: period.end };
  const prev = { start: period.pStart, end: period.pEnd };
  const zero: Metric = { key: "", clicks: 0, impressions: 0, ctr: 0, position: 0 };
  const [now1, prev1, byDate, queries, prevQueries, pages, countries, devices, appearance, pairs, sitemaps] = await Promise.all([
    query(c, { ...cur, ...base, dimensions: [], rowLimit: 1 }),
    soft(query(c, { ...prev, ...base, dimensions: [], rowLimit: 1 }), []),
    query(c, { ...cur, ...base, dimensions: ["date"], rowLimit: 500 }),
    soft(query(c, { ...cur, ...base, dimensions: ["query"], rowLimit: 500 }), []),
    soft(query(c, { ...prev, ...base, dimensions: ["query"], rowLimit: 500 }), []),
    soft(query(c, { ...cur, ...base, dimensions: ["page"], rowLimit: 100 }), []),
    soft(query(c, { ...cur, ...base, dimensions: ["country"], rowLimit: 15 }), []),
    soft(query(c, { ...cur, ...base, dimensions: ["device"], rowLimit: 5 }), []),
    soft(query(c, { ...cur, ...base, dimensions: ["searchAppearance"], rowLimit: 20 }), []),
    soft(query(c, { ...cur, ...base, dimensions: ["query", "page"], rowLimit: 1000 }), []),
    soft(
      call<{ sitemap?: { path: string; lastDownloaded?: string; isPending?: boolean; errors?: string; warnings?: string; contents?: { submitted?: string }[] }[] }>(
        c,
        `${API}/${encodeURIComponent(c.site)}/sitemaps`
      ).then((r) => r.sitemap ?? []),
      []
    ),
  ]);

  const dates = new Map(byDate.map((r) => [r.key, r]));
  const series: { date: string; clicks: number; impressions: number; position: number }[] = [];
  for (let t = Date.parse(`${cur.start}T00:00:00Z`); t <= Date.parse(`${cur.end}T00:00:00Z`); t += DAY) {
    const d = new Date(t).toISOString().slice(0, 10);
    series.push({ date: d, clicks: dates.get(d)?.clicks ?? 0, impressions: dates.get(d)?.impressions ?? 0, position: dates.get(d)?.position ?? 0 });
  }

  /* the page that ranks best for each search */
  const bestPage = new Map<string, string>();
  for (const p of [...pairs].sort((a, b) => b.impressions - a.impressions)) {
    const [q, page] = p.key.split(" ‖ ");
    if (!bestPage.has(q)) bestPage.set(q, page);
  }

  /* opportunities */
  const lowCtr = queries
    .filter((q) => q.impressions >= 30 && q.position <= 10 && q.ctr < expectedCtr(q.position) * 0.6)
    .map((q) => ({ ...q, missed: Math.round(q.impressions * (expectedCtr(q.position) - q.ctr)), page: bestPage.get(q.key) ?? "" }))
    .sort((a, b) => b.missed - a.missed)
    .slice(0, 15);
  const striking = queries
    .filter((q) => q.position > 7.5 && q.position <= 20 && q.impressions >= 10)
    .map((q) => ({ ...q, page: bestPage.get(q.key) ?? "" }))
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 15);

  /* keywords that appeared, disappeared, rose and fell */
  const prevMap = new Map(prevQueries.map((q) => [q.key, q]));
  const curMap = new Map(queries.map((q) => [q.key, q]));
  const fresh = queries.filter((q) => !prevMap.has(q.key) && q.impressions >= 3).sort((a, b) => b.impressions - a.impressions).slice(0, 15);
  const lost = prevQueries.filter((q) => !curMap.has(q.key) && (q.clicks > 0 || q.impressions >= 10)).sort((a, b) => b.impressions - a.impressions).slice(0, 15);
  const moved = queries
    .filter((q) => prevMap.has(q.key) && q.impressions >= 10)
    .map((q) => ({ ...q, before: prevMap.get(q.key)!.position, change: prevMap.get(q.key)!.position - q.position }));
  const up = moved.filter((m) => m.change >= 1).sort((a, b) => b.change - a.change).slice(0, 10);
  const down = moved.filter((m) => m.change <= -1).sort((a, b) => a.change - b.change).slice(0, 10);

  return {
    site: c.site,
    type,
    filters,
    period,
    totals: now1[0] ?? zero,
    previous: prev1[0] ?? zero,
    series,
    queries: queries.slice(0, 100),
    pages: pages.map((p) => ({ ...p, path: p.key.replace(/^https?:\/\/(www\.)?gobt\.in/, "") || "/" })),
    countries,
    devices,
    appearance,
    opportunities: { lowCtr, striking },
    changes: { fresh, lost, up, down },
    sitemaps: sitemaps.map((s) => ({
      path: s.path,
      lastDownloaded: s.lastDownloaded ?? null,
      pending: Boolean(s.isPending),
      errors: Number(s.errors ?? 0),
      warnings: Number(s.warnings ?? 0),
      submitted: (s.contents ?? []).reduce((a, x) => a + Number(x.submitted ?? 0), 0),
    })),
  };
}
export type SearchReport = Awaited<ReturnType<typeof build>>;

const cache = new Map<string, { at: number; data: SearchReport }>();

export async function searchReport(opts: { range?: string; from?: string; to?: string; type?: string; filters?: GscFilters; fresh?: boolean }) {
  const cfg = gscConfig();
  if (!cfg.ok) return { ok: false as const, reason: cfg.reason };
  const period = gscPeriod(opts.range, opts.from, opts.to);
  const type = (SEARCH_TYPES.some((t) => t.id === opts.type) ? opts.type : "web") as SearchType;
  const filters = Object.fromEntries(Object.entries(opts.filters ?? {}).filter(([, v]) => v)) as GscFilters;
  const key = JSON.stringify([period.start, period.end, type, filters]);
  const hit = cache.get(key);
  if (!opts.fresh && hit && Date.now() - hit.at < 30 * 60_000) return { ok: true as const, data: hit.data, cachedAt: hit.at };
  try {
    const data = await build(cfg.config, period, type, filters);
    if (cache.size > 60) cache.clear();
    cache.set(key, { at: Date.now(), data });
    return { ok: true as const, data, cachedAt: Date.now() };
  } catch (e) {
    return { ok: false as const, reason: "error" as const, message: e instanceof Error ? e.message : String(e), email: cfg.config.email };
  }
}

/* ── Google's view of each page (URL Inspection API, 2,000 checks a day) ── */

export type Inspection = {
  url: string;
  verdict: string; // PASS / NEUTRAL / FAIL / VERDICT_UNSPECIFIED
  coverage: string; // e.g. "Submitted and indexed", "Crawled - currently not indexed"
  lastCrawl: string | null;
  robots: string;
  fetch: string;
  googleCanonical: string;
  userCanonical: string;
  crawledAs: string;
  mobile: string;
  rich: string;
  richItems: string[];
  checkedAt: number;
};

type InspectResponse = {
  inspectionResult?: {
    indexStatusResult?: {
      verdict?: string;
      coverageState?: string;
      robotsTxtState?: string;
      pageFetchState?: string;
      lastCrawlTime?: string;
      googleCanonical?: string;
      userCanonical?: string;
      crawledAs?: string;
    };
    mobileUsabilityResult?: { verdict?: string };
    richResultsResult?: { verdict?: string; detectedItems?: { richResultType?: string }[] };
  };
};

async function inspectOne(c: Config, url: string): Promise<Inspection> {
  const r = await call<InspectResponse>(c, INSPECT, { inspectionUrl: url, siteUrl: c.site, languageCode: "en-IN" });
  const i = r.inspectionResult ?? {};
  const s = i.indexStatusResult ?? {};
  return {
    url,
    verdict: s.verdict ?? "VERDICT_UNSPECIFIED",
    coverage: s.coverageState ?? "Unknown",
    lastCrawl: s.lastCrawlTime ?? null,
    robots: s.robotsTxtState ?? "",
    fetch: s.pageFetchState ?? "",
    googleCanonical: s.googleCanonical ?? "",
    userCanonical: s.userCanonical ?? "",
    crawledAs: s.crawledAs ?? "",
    mobile: i.mobileUsabilityResult?.verdict ?? "",
    rich: i.richResultsResult?.verdict ?? "",
    richItems: (i.richResultsResult?.detectedItems ?? []).map((d) => d.richResultType ?? "").filter(Boolean),
    checkedAt: now(),
  };
}

export async function savedInspections(): Promise<Map<string, Inspection>> {
  const c = await db();
  const rows = (await c.execute("SELECT url, data FROM gsc_inspections")).rows;
  const out = new Map<string, Inspection>();
  for (const r of rows) {
    try {
      out.set(String(r.url), JSON.parse(String(r.data)) as Inspection);
    } catch {
      /* skip a damaged row */
    }
  }
  return out;
}

/* checks pages with Google, a few at a time, within a time budget (serverless limits) */
export async function inspectUrls(urls: string[], budgetMs = 20_000) {
  const cfg = gscConfig();
  if (!cfg.ok) return { ok: false as const, error: "Search Console isn't connected." };
  const started = Date.now();
  const c = await db();
  let done = 0;
  const errors: string[] = [];
  for (let i = 0; i < urls.length; i += 6) {
    if (Date.now() - started > budgetMs) break;
    const batch = urls.slice(i, i + 6);
    const results = await Promise.allSettled(batch.map((u) => inspectOne(cfg.config, u)));
    for (const [k, r] of results.entries()) {
      if (r.status === "fulfilled") {
        await c.execute({
          sql: `INSERT INTO gsc_inspections (url, verdict, coverage, last_crawl, data, checked_at) VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(url) DO UPDATE SET verdict = excluded.verdict, coverage = excluded.coverage, last_crawl = excluded.last_crawl, data = excluded.data, checked_at = excluded.checked_at`,
          args: [r.value.url, r.value.verdict, r.value.coverage, r.value.lastCrawl, JSON.stringify(r.value), r.value.checkedAt],
        });
        done++;
      } else errors.push(`${batch[k]}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`);
    }
  }
  return { ok: true as const, done, remaining: urls.length - done - errors.length, errors };
}
