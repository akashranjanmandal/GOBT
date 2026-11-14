import "server-only";
import { db, now } from "@/lib/referral/db";
import { geoOf, isBot } from "@/lib/referral/track";

/* In-house website analytics: what GA4 would tell us, stored in our own
   database. No IP address is kept; a visitor is a random id in their browser. */

export const istDay = (t: number) => new Date(t + 5.5 * 3600_000).toISOString().slice(0, 10);

const SEARCH: [RegExp, string][] = [
  [/(^|\.)google\./, "Google"],
  [/(^|\.)bing\.com$/, "Bing"],
  [/(^|\.)duckduckgo\.com$/, "DuckDuckGo"],
  [/(^|\.)yahoo\./, "Yahoo"],
  [/(^|\.)yandex\./, "Yandex"],
  [/(^|\.)baidu\.com$/, "Baidu"],
  [/(^|\.)ecosia\.org$/, "Ecosia"],
  [/(^|\.)perplexity\.ai$/, "Perplexity"],
  [/(^|\.)chatgpt\.com$|(^|\.)openai\.com$/, "ChatGPT"],
];
const SOCIAL: [RegExp, string][] = [
  [/(^|\.)(facebook|fb)\.com$|^fb\.me$|^l\.facebook\.com$|^m\.facebook\.com$/, "Facebook"],
  [/(^|\.)instagram\.com$/, "Instagram"],
  [/(^|\.)linkedin\.com$|^lnkd\.in$/, "LinkedIn"],
  [/^t\.co$|(^|\.)twitter\.com$|(^|\.)x\.com$/, "X (Twitter)"],
  [/(^|\.)youtube\.com$|^youtu\.be$/, "YouTube"],
  [/(^|\.)whatsapp\.(com|net)$|^wa\.me$/, "WhatsApp"],
  [/(^|\.)reddit\.com$/, "Reddit"],
  [/(^|\.)pinterest\./, "Pinterest"],
  [/(^|\.)quora\.com$/, "Quora"],
  [/(^|\.)t\.me$|(^|\.)telegram\.org$/, "Telegram"],
];
const EMAIL = /(^|\.)mail\.google\.com$|(^|\.)outlook\.(live|office)\.com$|(^|\.)mail\.yahoo\.com$|(^|\.)mail\./;

/* where a visit came from: GA-style source / medium */
export function classify(input: { referrer?: string; params: URLSearchParams; siteHost: string }) {
  const p = input.params;
  const utmSource = p.get("utm_source")?.trim().slice(0, 80);
  const utmMedium = p.get("utm_medium")?.trim().toLowerCase().slice(0, 40);
  const campaign = p.get("utm_campaign")?.trim().slice(0, 120) || null;
  const term = p.get("utm_term")?.trim().slice(0, 120) || null;
  let host: string | null = null;
  try {
    if (input.referrer) host = new URL(input.referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    host = null;
  }
  if (host && (host === input.siteHost || host.endsWith(`.${input.siteHost}`))) host = null;

  if (p.get("gclid") || p.get("gbraid") || p.get("wbraid")) return { source: "Google Ads", medium: "paid", host, campaign, term };
  if (utmSource) {
    const m = utmMedium || "campaign";
    const medium = /cpc|ppc|paid|ads?$/.test(m) ? "paid" : /social|sm/.test(m) ? "social" : /mail/.test(m) ? "email" : m.slice(0, 40);
    return { source: utmSource, medium, host, campaign, term };
  }
  if (p.get("fbclid")) return { source: "Facebook", medium: "social", host, campaign, term };
  if (!host) return { source: "Direct", medium: "direct", host: null, campaign, term };
  for (const [re, name] of SEARCH) if (re.test(host)) return { source: name, medium: name === "ChatGPT" || name === "Perplexity" ? "ai" : "organic", host, campaign, term };
  for (const [re, name] of SOCIAL) if (re.test(host)) return { source: name, medium: "social", host, campaign, term };
  if (EMAIL.test(host)) return { source: host, medium: "email", host, campaign, term };
  return { source: host, medium: "referral", host, campaign, term };
}

export function browserOf(ua: string) {
  if (/edg\//i.test(ua)) return "Edge";
  if (/opr\/|opera/i.test(ua)) return "Opera";
  if (/samsungbrowser/i.test(ua)) return "Samsung Internet";
  if (/ucbrowser/i.test(ua)) return "UC Browser";
  if (/fban|fbav|instagram/i.test(ua)) return "In-app (Facebook/Instagram)";
  if (/crios|chrome\//i.test(ua)) return "Chrome";
  if (/fxios|firefox\//i.test(ua)) return "Firefox";
  if (/safari\//i.test(ua)) return "Safari";
  return "Other";
}
export function osOf(ua: string) {
  if (/iphone|ipad|ipod/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/windows/i.test(ua)) return "Windows";
  if (/mac os x|macintosh/i.test(ua)) return "macOS";
  if (/cros/i.test(ua)) return "ChromeOS";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}
const deviceOf = (ua: string, width: number) =>
  /ipad|tablet/i.test(ua) || (width >= 600 && width < 1024 && /android/i.test(ua) && !/mobi/i.test(ua)) ? "Tablet" : /mobi|android|iphone/i.test(ua) ? "Mobile" : "Desktop";

const ID = /^[a-zA-Z0-9-]{8,64}$/;
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f]/g, "").trim().slice(0, max) : "");

/* paths we don't count: the admin panel and the API */
export const untracked = (path: string) => /^\/(referral\/admin|api\/|_next\/)/.test(path);

export type Beacon = {
  t: "pv" | "eng" | "ev";
  pv?: string;
  v?: string;
  s?: string;
  nv?: boolean; // first visit in this browser
  ns?: boolean; // first view of the session
  p?: string; // path
  q?: string; // query string (for utm_ parameters)
  ti?: string;
  r?: string;
  w?: number;
  lang?: string;
  ms?: number;
  sc?: number;
  n?: string; // event name
  l?: string; // event label
};

const EVENTS = new Set(["whatsapp_click", "call_click", "email_click", "outbound_click", "form_submit", "cta_click", "download"]);

export async function collect(b: Beacon, headers: Headers, siteHost: string) {
  const ua = headers.get("user-agent") ?? "";
  if (isBot(ua)) return "bot";
  if (!b.v || !ID.test(b.v) || !b.s || !ID.test(b.s)) return "bad";
  const c = await db();
  const t = now();

  if (b.t === "eng") {
    if (!b.pv || !ID.test(b.pv)) return "bad";
    const ms = Math.max(0, Math.min(Number(b.ms) || 0, 6 * 3600_000));
    const sc = Math.max(0, Math.min(Math.round(Number(b.sc) || 0), 100));
    await c.execute({ sql: "UPDATE site_views SET duration_ms = MAX(duration_ms, ?), scroll = MAX(scroll, ?) WHERE pv_id = ? AND visitor = ?", args: [ms, sc, b.pv, b.v] });
    return "ok";
  }

  const path = clean(b.p, 300).split("#")[0] || "/";
  if (!path.startsWith("/") || untracked(path)) return "skip";

  if (b.t === "ev") {
    const name = clean(b.n, 40);
    if (!EVENTS.has(name)) return "bad";
    await c.execute({
      sql: "INSERT INTO site_events (visitor, session, path, name, label, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      args: [b.v, b.s, path, name, clean(b.l, 200) || null, istDay(t), t],
    });
    return "ok";
  }

  if (!b.pv || !ID.test(b.pv)) return "bad";
  const params = new URLSearchParams(clean(b.q, 600).replace(/^\?/, ""));
  /* the source belongs to the session's first view; later views inherit it */
  let src: ReturnType<typeof classify>;
  if (b.ns) src = classify({ referrer: clean(b.r, 600), params, siteHost });
  else {
    const first = (await c.execute({ sql: "SELECT source, medium, referrer_host, campaign, term FROM site_views WHERE session = ? ORDER BY id LIMIT 1", args: [b.s] })).rows[0];
    src = first
      ? { source: String(first.source), medium: String(first.medium), host: first.referrer_host ? String(first.referrer_host) : null, campaign: first.campaign ? String(first.campaign) : null, term: first.term ? String(first.term) : null }
      : classify({ referrer: clean(b.r, 600), params, siteHost });
  }
  const geo = geoOf(headers);
  const width = Math.max(0, Math.min(Number(b.w) || 0, 10000));
  await c.execute({
    sql: `INSERT OR IGNORE INTO site_views (pv_id, visitor, session, is_new_visitor, is_entry, path, title, source, medium, referrer_host, campaign, term,
          device, browser, os, country, region, city, lang, screen, day, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      b.pv,
      b.v,
      b.s,
      b.nv ? 1 : 0,
      b.ns ? 1 : 0,
      path,
      clean(b.ti, 200) || null,
      src.source,
      src.medium,
      src.host,
      src.campaign,
      src.term,
      deviceOf(ua, width),
      browserOf(ua),
      osOf(ua),
      geo.country,
      geo.region,
      geo.city,
      clean(b.lang, 20) || null,
      width ? `${width}px` : null,
      istDay(t),
      t,
    ],
  });
  return "ok";
}
