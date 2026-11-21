import "server-only";
import { db } from "@/lib/referral/db";
import { istDay } from "./collect";

/* Reports for the admin panel, read straight from site_views / site_events.
   Every report takes the same filter: a date range (preset or custom) and
   optionally one page, source, device or country. */

export const A_RANGES = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7", label: "7 days" },
  { id: "28", label: "28 days" },
  { id: "90", label: "90 days" },
  { id: "365", label: "12 months" },
] as const;
export type RangeId = (typeof A_RANGES)[number]["id"] | "custom";

const DAY = 86_400_000;
const IST = 5.5 * 3600_000;
/* midnight in India, as a timestamp */
const istMidnight = (t: number) => Math.floor((t + IST) / DAY) * DAY - IST;
const fromIstDate = (d: string) => Date.parse(`${d}T00:00:00+05:30`);
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export type AFilter = {
  range: RangeId;
  from: number;
  to: number;
  prevFrom: number;
  prevTo: number;
  days: number;
  label: string;
  fromDay: string;
  toDay: string;
  page?: string;
  source?: string;
  device?: string;
  country?: string;
};

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || undefined;

export function parseFilter(sp: SP, at = Date.now()): AFilter {
  const today = istMidnight(at);
  let range = (one(sp.range) ?? "28") as RangeId;
  let from: number;
  let to: number;
  const cf = one(sp.from);
  const ct = one(sp.to);
  if (cf && ct && DATE.test(cf) && DATE.test(ct) && cf <= ct) {
    range = "custom";
    from = fromIstDate(cf);
    to = Math.min(fromIstDate(ct) + DAY, at);
  } else if (range === "today") {
    from = today;
    to = at;
  } else if (range === "yesterday") {
    from = today - DAY;
    to = today;
  } else {
    if (!A_RANGES.some((r) => r.id === range)) range = "28";
    const days = Number(range);
    from = today - (days - 1) * DAY;
    to = at;
  }
  const days = Math.max(1, Math.round((Math.max(to, from + 1) - from) / DAY + 0.49));
  const span = range === "today" ? DAY : to - from;
  const label =
    range === "custom" ? `${cf!.split("-").reverse().join("-")} to ${ct!.split("-").reverse().join("-")}` : (A_RANGES.find((r) => r.id === range)?.label ?? "");
  return {
    range,
    from,
    to,
    prevFrom: from - span,
    prevTo: to - span,
    days,
    label,
    fromDay: istDay(from),
    toDay: istDay(to - 1),
    page: one(sp.page)?.slice(0, 300),
    source: one(sp.source)?.slice(0, 80),
    device: one(sp.device)?.slice(0, 20),
    country: one(sp.country)?.slice(0, 60),
  };
}

/* the same filter as URL parameters (to keep it when moving between tabs) */
export function filterQuery(f: AFilter, extra: Record<string, string | undefined> = {}) {
  const p = new URLSearchParams();
  if (f.range === "custom") {
    p.set("from", f.fromDay);
    p.set("to", f.toDay);
  } else p.set("range", f.range);
  for (const k of ["page", "source", "device", "country"] as const) if (f[k]) p.set(k, f[k]!);
  for (const [k, v] of Object.entries(extra)) {
    if (v === undefined) p.delete(k);
    else p.set(k, v);
  }
  return p.toString();
}

type Args = (string | number)[];
async function rows(sql: string, args: Args) {
  const c = await db();
  return (await c.execute({ sql, args })).rows;
}

/* WHERE for site_views; prev = the comparison period */
function where(f: AFilter, opts: { prev?: boolean; alias?: string; skipPage?: boolean } = {}) {
  const a = opts.alias ? `${opts.alias}.` : "";
  const parts = [`${a}created_at >= ?`, `${a}created_at < ?`];
  const args: Args = [opts.prev ? f.prevFrom : f.from, opts.prev ? f.prevTo : f.to];
  if (f.page && !opts.skipPage) {
    parts.push(`${a}path = ?`);
    args.push(f.page);
  }
  if (f.source) {
    parts.push(`${a}source = ?`);
    args.push(f.source);
  }
  if (f.device) {
    parts.push(`${a}device = ?`);
    args.push(f.device);
  }
  if (f.country) {
    parts.push(`COALESCE(${a}country, 'Unknown') = ?`);
    args.push(f.country);
  }
  return { sql: parts.join(" AND "), args };
}

/* WHERE for site_events (source/device/country come from the session's views) */
function eventWhere(f: AFilter, opts: { prev?: boolean; alias?: string } = {}) {
  const a = opts.alias ? `${opts.alias}.` : "";
  const parts = [`${a}created_at >= ?`, `${a}created_at < ?`];
  const args: Args = [opts.prev ? f.prevFrom : f.from, opts.prev ? f.prevTo : f.to];
  if (f.page) {
    parts.push(`${a}path = ?`);
    args.push(f.page);
  }
  if (f.source || f.device || f.country) {
    const w = where({ ...f, page: undefined }, { prev: opts.prev });
    parts.push(`${a}session IN (SELECT session FROM site_views WHERE ${w.sql})`);
    args.push(...w.args);
  }
  return { sql: parts.join(" AND "), args };
}

/* ── headline numbers ── */

export async function totals(f: AFilter, prev = false) {
  const w = where(f, { prev });
  const [a] = await rows(
    `SELECT COUNT(*) views, COUNT(DISTINCT visitor) visitors, COUNT(DISTINCT session) sessions,
            COUNT(DISTINCT CASE WHEN is_new_visitor = 1 THEN visitor END) new_visitors,
            COALESCE(SUM(duration_ms), 0) time_ms
       FROM site_views WHERE ${w.sql}`,
    w.args
  );
  const [b] = await rows(
    `SELECT COUNT(*) bounced FROM (SELECT session FROM site_views WHERE ${w.sql} GROUP BY session HAVING COUNT(*) = 1 AND MAX(duration_ms) < 10000)`,
    w.args
  );
  const e = eventWhere(f, { prev });
  const [l] = await rows(`SELECT COUNT(*) n, COUNT(DISTINCT session) s FROM site_events WHERE ${e.sql} AND name IN ${LEAD_IN}`, e.args);
  const sessions = Number(a.sessions);
  return {
    views: Number(a.views),
    visitors: Number(a.visitors),
    newVisitors: Number(a.new_visitors),
    sessions,
    viewsPerSession: sessions ? Number(a.views) / sessions : 0,
    avgEngagementMs: sessions ? Number(a.time_ms) / sessions : 0,
    bounceRate: sessions ? Number(b.bounced) / sessions : 0,
    leads: Number(l.n),
    leadSessions: Number(l.s),
    conversionRate: sessions ? Number(l.s) / sessions : 0,
  };
}
export type Totals = Awaited<ReturnType<typeof totals>>;

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* buckets for the chart: hours (one day), days (≤ 92 days) or months */
function buckets(f: AFilter) {
  if (f.days <= 1) return { kind: "hour" as const };
  if (f.days <= 92) return { kind: "day" as const };
  return { kind: "month" as const };
}

/* visitors, views and lead actions over time */
export async function trend(f: AFilter) {
  const b = buckets(f);
  const w = where(f);
  const e = eventWhere(f);
  const key = b.kind === "hour" ? `CAST((created_at - ${f.from}) / 3600000 AS INTEGER)` : b.kind === "day" ? "day" : "substr(day, 1, 7)";
  const [v, l] = await Promise.all([
    rows(`SELECT ${key} k, COUNT(*) views, COUNT(DISTINCT visitor) visitors FROM site_views WHERE ${w.sql} GROUP BY k`, w.args),
    rows(`SELECT ${key} k, COUNT(*) n FROM site_events WHERE ${e.sql} AND name IN ${LEAD_IN} GROUP BY k`, e.args),
  ]);
  const vm = new Map(v.map((x) => [String(x.k), x]));
  const lm = new Map(l.map((x) => [String(x.k), Number(x.n)]));
  const out: { key: string; label: string; views: number; visitors: number; leads: number }[] = [];
  const push = (k: string, label: string) =>
    out.push({ key: k, label, views: Number(vm.get(k)?.views ?? 0), visitors: Number(vm.get(k)?.visitors ?? 0), leads: lm.get(k) ?? 0 });
  if (b.kind === "hour") {
    const hours = Math.max(1, Math.min(24, Math.ceil((f.to - f.from) / 3600_000)));
    for (let h = 0; h < hours; h++) push(String(h), `${h % 12 || 12}${h < 12 ? "am" : "pm"}`);
  } else if (b.kind === "day") {
    for (let t = f.from; t < f.to; t += DAY) {
      const k = istDay(t);
      const [, mm, dd] = k.split("-").map(Number);
      push(k, `${dd} ${MON[mm - 1]}`);
    }
  } else {
    let [y, m] = f.fromDay.split("-").map(Number);
    while (`${y}-${String(m).padStart(2, "0")}` <= f.toDay.slice(0, 7)) {
      push(`${y}-${String(m).padStart(2, "0")}`, `${MON[m - 1]} ${String(y).slice(2)}`);
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
  }
  return out;
}

export const CHANNELS: Record<string, string> = {
  organic: "Organic search",
  direct: "Direct",
  social: "Social",
  referral: "Referral",
  email: "Email",
  paid: "Paid ads",
  ai: "AI assistants",
};
export const channelOf = (medium: string) => CHANNELS[medium] ?? "Campaigns";

export const LEAD_EVENTS = ["whatsapp_click", "call_click", "email_click", "form_submit"] as const;
const LEAD_IN = `(${LEAD_EVENTS.map((e) => `'${e}'`).join(", ")})`;

export const EVENT_LABELS: Record<string, string> = {
  whatsapp_click: "WhatsApp clicks",
  call_click: "Call clicks",
  email_click: "Email clicks",
  form_submit: "Form submits",
  outbound_click: "Outbound links",
  cta_click: "Button clicks",
  download: "Downloads",
  not_found: "Broken links (404)",
};

/* sessions and the leads they produced, grouped by where they came from or where they landed */
export async function conversions(f: AFilter, by: "source" | "landing" | "campaign" | "channel") {
  const w = where({ ...f, page: undefined });
  const group = by === "landing" ? "s.path" : by === "campaign" ? "s.campaign" : by === "channel" ? "s.medium" : "s.source || ' / ' || s.medium";
  const cond: string[] = [];
  const extra: Args = [];
  if (by === "campaign") cond.push("s.campaign IS NOT NULL");
  if (f.page) {
    cond.push("s.path = ?");
    extra.push(f.page);
  }
  /* a visit's lead actions can come a little after the period ends; allow an hour */
  const r = await rows(
    `WITH s AS (SELECT session, source, medium, path, campaign FROM site_views WHERE is_entry = 1 AND ${w.sql}),
          e AS (SELECT session, name, COUNT(*) n FROM site_events WHERE created_at >= ? AND created_at < ? AND name IN ${LEAD_IN} GROUP BY session, name)
     SELECT ${group} k, COUNT(DISTINCT s.session) sessions, COUNT(DISTINCT e.session) converted,
            COALESCE(SUM(CASE WHEN e.name = 'whatsapp_click' THEN e.n END), 0) wa,
            COALESCE(SUM(CASE WHEN e.name = 'call_click' THEN e.n END), 0) calls,
            COALESCE(SUM(CASE WHEN e.name = 'email_click' THEN e.n END), 0) emails,
            COALESCE(SUM(CASE WHEN e.name = 'form_submit' THEN e.n END), 0) forms
       FROM s LEFT JOIN e ON e.session = s.session
      ${cond.length ? `WHERE ${cond.join(" AND ")}` : ""}
      GROUP BY k ORDER BY converted DESC, sessions DESC LIMIT 25`,
    [...w.args, f.from, f.to + 3600_000, ...extra]
  );
  const merged = new Map<string, { key: string; sessions: number; converted: number; whatsapp: number; calls: number; emails: number; forms: number }>();
  for (const x of r) {
    const raw = String(x.k ?? "(none)");
    const key = by === "channel" ? channelOf(raw) : raw;
    const m = merged.get(key) ?? { key, sessions: 0, converted: 0, whatsapp: 0, calls: 0, emails: 0, forms: 0 };
    m.sessions += Number(x.sessions);
    m.converted += Number(x.converted);
    m.whatsapp += Number(x.wa);
    m.calls += Number(x.calls);
    m.emails += Number(x.emails);
    m.forms += Number(x.forms);
    merged.set(key, m);
  }
  return [...merged.values()].map((m) => ({ ...m, rate: m.sessions ? m.converted / m.sessions : 0 }));
}

/* the latest lead actions, with where that visitor came from */
export async function recentLeads(f: AFilter, limit = 40) {
  const e = eventWhere(f, { alias: "e" });
  const r = await rows(
    `SELECT e.name, e.label, e.path, e.created_at,
            (SELECT source FROM site_views v WHERE v.session = e.session ORDER BY v.id LIMIT 1) source,
            (SELECT path FROM site_views v WHERE v.session = e.session ORDER BY v.id LIMIT 1) landing,
            (SELECT device FROM site_views v WHERE v.session = e.session ORDER BY v.id LIMIT 1) device,
            (SELECT COALESCE(city, country) FROM site_views v WHERE v.session = e.session ORDER BY v.id LIMIT 1) place
       FROM site_events e WHERE ${e.sql} AND e.name IN ${LEAD_IN} ORDER BY e.id DESC LIMIT ${limit}`,
    e.args
  );
  return r.map((x) => ({
    name: String(x.name),
    label: String(x.label ?? ""),
    path: String(x.path),
    at: Number(x.created_at),
    source: String(x.source ?? "—"),
    landing: String(x.landing ?? "—"),
    device: String(x.device ?? ""),
    place: String(x.place ?? ""),
  }));
}

/* sessions by where they came from (counted on each session's first view) */
export async function acquisition(f: AFilter) {
  const w = where(f);
  const src = await rows(
    `SELECT source, medium, COUNT(DISTINCT session) sessions, COUNT(DISTINCT visitor) visitors
       FROM site_views WHERE ${w.sql} AND is_entry = 1 GROUP BY source, medium ORDER BY sessions DESC LIMIT 25`,
    w.args
  );
  const channels = new Map<string, number>();
  for (const r of src) channels.set(channelOf(String(r.medium)), (channels.get(channelOf(String(r.medium))) ?? 0) + Number(r.sessions));
  const camp = await rows(
    `SELECT campaign, source, COUNT(DISTINCT session) sessions FROM site_views
      WHERE ${w.sql} AND is_entry = 1 AND campaign IS NOT NULL GROUP BY campaign, source ORDER BY sessions DESC LIMIT 15`,
    w.args
  );
  const terms = await rows(
    `SELECT term, COUNT(DISTINCT session) sessions FROM site_views WHERE ${w.sql} AND is_entry = 1 AND term IS NOT NULL GROUP BY term ORDER BY sessions DESC LIMIT 15`,
    w.args
  );
  return {
    sources: src.map((r) => ({ source: String(r.source), medium: String(r.medium), sessions: Number(r.sessions), visitors: Number(r.visitors) })),
    channels: [...channels.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value),
    campaigns: camp.map((r) => ({ campaign: String(r.campaign), source: String(r.source), sessions: Number(r.sessions) })),
    terms: terms.map((r) => ({ key: String(r.term), value: Number(r.sessions) })),
  };
}

/* pages: views, time, scroll, entries and exits */
export async function pages(f: AFilter, limit = 40) {
  const w = where(f);
  const [r, ex] = await Promise.all([
    rows(
      `SELECT path, MAX(title) title, COUNT(*) views, COUNT(DISTINCT visitor) visitors, AVG(duration_ms) avg_ms,
              AVG(scroll) avg_scroll, SUM(is_entry) entries
         FROM site_views WHERE ${w.sql} GROUP BY path ORDER BY views DESC LIMIT ${limit}`,
      w.args
    ),
    rows(`SELECT path, COUNT(*) n FROM site_views WHERE id IN (SELECT MAX(id) FROM site_views WHERE ${w.sql} GROUP BY session) GROUP BY path`, w.args),
  ]);
  const exits = new Map(ex.map((x) => [String(x.path), Number(x.n)]));
  return r.map((x) => {
    const views = Number(x.views);
    const exitsN = exits.get(String(x.path)) ?? 0;
    return {
      path: String(x.path),
      title: String(x.title ?? ""),
      views,
      visitors: Number(x.visitors),
      avgMs: Number(x.avg_ms ?? 0),
      avgScroll: Number(x.avg_scroll ?? 0),
      entries: Number(x.entries ?? 0),
      exits: exitsN,
      exitRate: views ? exitsN / views : 0,
    };
  });
}

/* the most common routes through the site (first four pages of a visit) */
export async function journeys(f: AFilter) {
  const w = where({ ...f, page: undefined });
  const r = await rows(`SELECT session, path FROM site_views WHERE ${w.sql} ORDER BY session, id LIMIT 30000`, w.args);
  const bySession = new Map<string, string[]>();
  for (const x of r) {
    const list = bySession.get(String(x.session)) ?? [];
    const p = String(x.path);
    if (list[list.length - 1] !== p) list.push(p);
    bySession.set(String(x.session), list);
  }
  const counts = new Map<string, number>();
  for (const list of bySession.values()) {
    if (f.page && !list.includes(f.page)) continue;
    const key = list.slice(0, 4).join(" → ") + (list.length > 4 ? " → …" : "");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, sessions]) => ({ path, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 15);
}

/* for one page: where people were just before, and where they went next */
export async function pageFlow(f: AFilter) {
  if (!f.page) return null;
  const w = where({ ...f, page: undefined });
  const r = await rows(
    `SELECT prev, next FROM (
       SELECT path, LAG(path) OVER (PARTITION BY session ORDER BY id) prev, LEAD(path) OVER (PARTITION BY session ORDER BY id) next
         FROM site_views WHERE ${w.sql}) WHERE path = ?`,
    [...w.args, f.page]
  );
  const tally = (pick: (x: (typeof r)[number]) => unknown, none: string) => {
    const m = new Map<string, number>();
    for (const x of r) {
      const k = pick(x) == null ? none : String(pick(x));
      m.set(k, (m.get(k) ?? 0) + 1);
    }
    return [...m.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value).slice(0, 8);
  };
  return { before: tally((x) => x.prev, "(started here)"), after: tally((x) => x.next, "(left the site)") };
}

/* visitors split by one column */
export async function breakdown(col: "country" | "city" | "region" | "device" | "browser" | "os" | "lang" | "screen", f: AFilter, limit = 10) {
  const w = where(f);
  const expr =
    col === "screen"
      ? `CASE WHEN CAST(screen AS INTEGER) < 480 THEN 'Phone (under 480px)' WHEN CAST(screen AS INTEGER) < 768 THEN 'Large phone (480–767px)' WHEN CAST(screen AS INTEGER) < 1024 THEN 'Tablet (768–1023px)' WHEN CAST(screen AS INTEGER) < 1440 THEN 'Laptop (1024–1439px)' WHEN screen IS NULL THEN 'Unknown' ELSE 'Large screen (1440px+)' END`
      : col === "lang"
        ? "COALESCE(lower(substr(lang, 1, 2)), 'unknown')"
        : `COALESCE(${col}, 'Unknown')`;
  const r = await rows(`SELECT ${expr} k, COUNT(DISTINCT visitor) n FROM site_views WHERE ${w.sql} GROUP BY k ORDER BY n DESC LIMIT ${limit}`, w.args);
  const LANG: Record<string, string> = { en: "English", hi: "Hindi", bn: "Bengali", ta: "Tamil", te: "Telugu", mr: "Marathi", gu: "Gujarati", kn: "Kannada", ml: "Malayalam", ur: "Urdu", or: "Odia", pa: "Punjabi" };
  return r.map((x) => ({ key: col === "lang" ? (LANG[String(x.k)] ?? String(x.k)) : String(x.k), value: Number(x.n) }));
}

/* every event type, and where on the site they happen */
export async function events(f: AFilter) {
  const e = eventWhere(f);
  const byName = await rows(`SELECT name, COUNT(*) n, COUNT(DISTINCT visitor) people FROM site_events WHERE ${e.sql} GROUP BY name ORDER BY n DESC`, e.args);
  const byPage = await rows(
    `SELECT path, name, label, COUNT(*) n FROM site_events WHERE ${e.sql} AND name <> 'not_found' GROUP BY path, name, label ORDER BY n DESC LIMIT 25`,
    e.args
  );
  return {
    totals: byName.map((r) => ({ name: String(r.name), label: EVENT_LABELS[String(r.name)] ?? String(r.name), count: Number(r.n), people: Number(r.people) })),
    detail: byPage.map((r) => ({ path: String(r.path), name: String(r.name), label: String(r.label ?? ""), count: Number(r.n) })),
  };
}

/* broken links people actually hit, and where the link was */
export async function notFound(f: AFilter) {
  const e = eventWhere({ ...f, page: undefined });
  const r = await rows(
    `SELECT path, label, COUNT(*) n, MAX(created_at) last FROM site_events WHERE ${e.sql} AND name = 'not_found' GROUP BY path, label ORDER BY n DESC LIMIT 40`,
    e.args
  );
  return r.map((x) => ({ path: String(x.path), from: String(x.label ?? ""), hits: Number(x.n), last: Number(x.last) }));
}

/* ── page speed from real visitors (Core Web Vitals) ── */

export const VITALS = [
  { id: "lcp", name: "LCP", label: "Largest content shown", good: 2500, poor: 4000, unit: "ms", help: "How long until the main content is visible" },
  { id: "inp", name: "INP", label: "Response to taps/clicks", good: 200, poor: 500, unit: "ms", help: "How quickly the page reacts when someone taps or clicks" },
  { id: "cls", name: "CLS", label: "Layout jumping", good: 0.1, poor: 0.25, unit: "", help: "How much things move around while loading (lower is better)" },
  { id: "fcp", name: "FCP", label: "First content", good: 1800, poor: 3000, unit: "ms", help: "How long until anything appears" },
  { id: "ttfb", name: "TTFB", label: "Server response", good: 800, poor: 1800, unit: "ms", help: "How long the server takes to start answering" },
] as const;
export type VitalId = (typeof VITALS)[number]["id"];

const p75 = (vals: number[]) => {
  if (!vals.length) return null;
  const s = [...vals].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil(s.length * 0.75) - 1)];
};
export const rating = (id: VitalId, v: number | null) => {
  if (v == null) return "none";
  const m = VITALS.find((x) => x.id === id)!;
  return v <= m.good ? "good" : v <= m.poor ? "ok" : "poor";
};

export async function vitals(f: AFilter) {
  const w = where(f);
  const r = await rows(`SELECT path, device, lcp, inp, cls, fcp, ttfb FROM site_views WHERE ${w.sql} AND (lcp IS NOT NULL OR fcp IS NOT NULL OR ttfb IS NOT NULL) LIMIT 20000`, w.args);
  const summarise = (list: typeof r) => {
    const out = {} as Record<VitalId, { p75: number | null; n: number; good: number }>;
    for (const v of VITALS) {
      const vals = list.map((x) => x[v.id]).filter((x) => x != null).map(Number);
      out[v.id] = { p75: p75(vals), n: vals.length, good: vals.length ? vals.filter((x) => x <= v.good).length / vals.length : 0 };
    }
    return out;
  };
  const byPath = new Map<string, typeof r>();
  for (const x of r) byPath.set(String(x.path), [...(byPath.get(String(x.path)) ?? []), x]);
  const perPage = [...byPath.entries()]
    .map(([path, list]) => ({ path, samples: list.length, ...summarise(list) }))
    .sort((a, b) => b.samples - a.samples)
    .slice(0, 25);
  return {
    samples: r.length,
    all: summarise(r),
    mobile: summarise(r.filter((x) => x.device === "Mobile")),
    desktop: summarise(r.filter((x) => x.device === "Desktop")),
    perPage,
  };
}

/* ── who's on the site right now ── */
export async function realtime(at = Date.now()) {
  const since30 = at - 30 * 60_000;
  const [now5] = await rows(`SELECT COUNT(DISTINCT visitor) n FROM site_views WHERE created_at >= ?`, [at - 5 * 60_000]);
  const [last30] = await rows(`SELECT COUNT(DISTINCT visitor) n, COUNT(*) views FROM site_views WHERE created_at >= ?`, [since30]);
  const perMin = await rows(`SELECT CAST((? - created_at) / 60000 AS INTEGER) m, COUNT(*) n FROM site_views WHERE created_at >= ? GROUP BY m`, [at, since30]);
  const mins = new Array(30).fill(0);
  for (const r of perMin) {
    const m = Number(r.m);
    if (m >= 0 && m < 30) mins[29 - m] = Number(r.n);
  }
  const top = await rows(`SELECT path, COUNT(*) n FROM site_views WHERE created_at >= ? GROUP BY path ORDER BY n DESC LIMIT 5`, [since30]);
  const recent = await rows(`SELECT path, source, device, city, country, created_at FROM site_views WHERE created_at >= ? ORDER BY id DESC LIMIT 12`, [since30]);
  const leads = await rows(`SELECT COUNT(*) n FROM site_events WHERE created_at >= ? AND name IN ${LEAD_IN}`, [since30]);
  return {
    activeNow: Number(now5.n),
    last30: Number(last30.n),
    views30: Number(last30.views),
    leads30: Number(leads[0].n),
    perMinute: mins,
    topPages: top.map((r) => ({ path: String(r.path), views: Number(r.n) })),
    recent: recent.map((r) => ({
      path: String(r.path),
      source: String(r.source),
      device: String(r.device ?? ""),
      place: [r.city, r.country].filter(Boolean).join(", "),
      at: Number(r.created_at),
    })),
  };
}
export type Realtime = Awaited<ReturnType<typeof realtime>>;

export async function anyViews() {
  const [r] = await rows("SELECT COUNT(*) n FROM site_views", []);
  return Number(r.n);
}

/* filter choices: the sources, devices and countries seen recently */
export async function filterOptions(f: AFilter) {
  const args = [f.from - 90 * DAY, f.to];
  const [src, dev, cty] = await Promise.all([
    rows("SELECT source k, COUNT(*) n FROM site_views WHERE created_at >= ? AND created_at < ? GROUP BY k ORDER BY n DESC LIMIT 30", args),
    rows("SELECT device k, COUNT(*) n FROM site_views WHERE created_at >= ? AND created_at < ? AND device IS NOT NULL GROUP BY k ORDER BY n DESC", args),
    rows("SELECT COALESCE(country, 'Unknown') k, COUNT(*) n FROM site_views WHERE created_at >= ? AND created_at < ? GROUP BY k ORDER BY n DESC LIMIT 40", args),
  ]);
  return { sources: src.map((x) => String(x.k)), devices: dev.map((x) => String(x.k)), countries: cty.map((x) => String(x.k)) };
}

/* raw page views for CSV export */
export async function rawViews(f: AFilter, limit = 50000) {
  const w = where(f);
  return rows(
    `SELECT created_at, day, path, title, source, medium, campaign, term, device, browser, os, country, region, city, lang, screen, duration_ms, scroll, is_entry, is_new_visitor, not_found, lcp, inp, cls, fcp, ttfb, visitor, session
       FROM site_views WHERE ${w.sql} ORDER BY id DESC LIMIT ${limit}`,
    w.args
  );
}
export async function rawEvents(f: AFilter, limit = 50000) {
  const e = eventWhere(f);
  return rows(`SELECT created_at, day, name, label, path, visitor, session FROM site_events WHERE ${e.sql} ORDER BY id DESC LIMIT ${limit}`, e.args);
}
