import "server-only";
import { SignJWT, importPKCS8 } from "jose";

/* Google Search Console: the searches people type before they reach
   gobt.in (queries, impressions, clicks, position). Google only shares this
   through its API, so it needs a service account added to the property:
     GSC_CREDENTIALS  the service account's JSON key (raw or base64)
     GSC_SITE         "sc-domain:gobt.in" (Domain property, the default)
                      or "https://gobt.in/" (URL-prefix property) */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const API = "https://searchconsole.googleapis.com/webmasters/v3/sites";
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

async function call<T>(c: Config, path: string, init?: { body?: object }): Promise<T> {
  const res = await fetch(`${API}/${encodeURIComponent(c.site)}${path}`, {
    method: init?.body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${await accessToken(c)}`, "Content-Type": "application/json" },
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!res.ok) {
    const msg = body.error?.message ?? `HTTP ${res.status}`;
    if (res.status === 403) throw new Error(`Google refused access (${msg}). Add ${c.email} as a user of the Search Console property ${c.site}.`);
    throw new Error(msg);
  }
  return body;
}

type Row = { keys?: string[]; clicks: number; impressions: number; ctr: number; position: number };
const query = (c: Config, start: string, end: string, dimensions: string[], rowLimit = 25) =>
  call<{ rows?: Row[] }>(c, "/searchAnalytics/query", { body: { startDate: start, endDate: end, dimensions, rowLimit, dataState: "all" } }).then((r) => r.rows ?? []);

const ymd = (t: number) => new Date(t + 5.5 * 3600_000).toISOString().slice(0, 10);
const DAY = 86_400_000;

const sum = (rows: Row[]) => {
  const r = rows[0];
  return r ? { clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position } : { clicks: 0, impressions: 0, ctr: 0, position: 0 };
};

export type SearchReport = Awaited<ReturnType<typeof build>>;

async function build(c: Config, days: number) {
  /* Search Console data arrives about two days late */
  const end = Date.now() - 2 * DAY;
  const start = end - (days - 1) * DAY;
  const pEnd = start - DAY;
  const pStart = pEnd - (days - 1) * DAY;
  const [cur, prev, byDate, queries, pages, countries, devices, sitemaps] = await Promise.all([
    query(c, ymd(start), ymd(end), [], 1),
    query(c, ymd(pStart), ymd(pEnd), [], 1),
    query(c, ymd(start), ymd(end), ["date"], 500),
    query(c, ymd(start), ymd(end), ["query"], 50),
    query(c, ymd(start), ymd(end), ["page"], 25),
    query(c, ymd(start), ymd(end), ["country"], 10),
    query(c, ymd(start), ymd(end), ["device"], 5),
    call<{ sitemap?: { path: string; lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean; errors?: string; warnings?: string; contents?: { type: string; submitted?: string; indexed?: string }[] }[] }>(c, "/sitemaps").then((r) => r.sitemap ?? []).catch(() => []),
  ]);
  const dates = new Map(byDate.map((r) => [r.keys?.[0] ?? "", r]));
  const series: { date: string; clicks: number; impressions: number }[] = [];
  for (let t = start; t <= end; t += DAY) {
    const d = ymd(t);
    series.push({ date: d, clicks: dates.get(d)?.clicks ?? 0, impressions: dates.get(d)?.impressions ?? 0 });
  }
  const list = (rows: Row[]) => rows.map((r) => ({ key: r.keys?.[0] ?? "", clicks: r.clicks, impressions: r.impressions, ctr: r.ctr, position: r.position }));
  return {
    site: c.site,
    start: ymd(start),
    end: ymd(end),
    totals: sum(cur),
    previous: sum(prev),
    series,
    queries: list(queries),
    pages: list(pages),
    countries: list(countries),
    devices: list(devices),
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

const cache = new Map<number, { at: number; data: SearchReport }>();

export async function searchReport(days: number): Promise<{ ok: true; data: SearchReport; cachedAt: number } | { ok: false; reason: "missing" | "invalid" | "error"; message?: string; email?: string }> {
  const cfg = gscConfig();
  if (!cfg.ok) return { ok: false, reason: cfg.reason };
  const hit = cache.get(days);
  if (hit && Date.now() - hit.at < 30 * 60_000) return { ok: true, data: hit.data, cachedAt: hit.at };
  try {
    const data = await build(cfg.config, days);
    cache.set(days, { at: Date.now(), data });
    return { ok: true, data, cachedAt: Date.now() };
  } catch (e) {
    return { ok: false, reason: "error", message: e instanceof Error ? e.message : String(e), email: cfg.config.email };
  }
}
