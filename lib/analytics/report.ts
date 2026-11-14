import "server-only";
import { db } from "@/lib/referral/db";
import { istDay } from "./collect";

/* Reports for the admin panel, read straight from site_views / site_events. */

export const A_RANGES = [
  { id: "today", label: "Today" },
  { id: "7", label: "7 days" },
  { id: "28", label: "28 days" },
  { id: "90", label: "90 days" },
  { id: "365", label: "12 months" },
] as const;
export type RangeId = (typeof A_RANGES)[number]["id"];
export const parseARange = (v?: string): RangeId => (A_RANGES.some((r) => r.id === v) ? (v as RangeId) : "28");

const DAY = 86_400_000;
const IST = 5.5 * 3600_000;
/* midnight in India, as a timestamp */
const istMidnight = (t: number) => Math.floor((t + IST) / DAY) * DAY - IST;

export function rangeBounds(id: RangeId, at = Date.now()) {
  const today = istMidnight(at);
  const days = id === "today" ? 1 : Number(id);
  const from = id === "today" ? today : today - (days - 1) * DAY;
  const to = at;
  /* the same stretch of time one period earlier (today so far vs yesterday until this time) */
  return { from, to, prevFrom: from - days * DAY, prevTo: to - days * DAY, days, hourly: id === "today" };
}

type Args = (string | number)[];
async function rows(sql: string, args: Args) {
  const c = await db();
  return (await c.execute({ sql, args })).rows;
}

/* the headline numbers for a period */
export async function totals(from: number, to: number) {
  const [a] = await rows(
    `SELECT COUNT(*) views, COUNT(DISTINCT visitor) visitors, COUNT(DISTINCT session) sessions,
            COUNT(DISTINCT CASE WHEN is_new_visitor = 1 THEN visitor END) new_visitors,
            COALESCE(SUM(duration_ms), 0) time_ms
       FROM site_views WHERE created_at >= ? AND created_at < ?`,
    [from, to]
  );
  const [b] = await rows(
    `SELECT COUNT(*) bounced FROM (
       SELECT session FROM site_views WHERE created_at >= ? AND created_at < ?
       GROUP BY session HAVING COUNT(*) = 1 AND MAX(duration_ms) < 10000)`,
    [from, to]
  );
  const sessions = Number(a.sessions);
  return {
    views: Number(a.views),
    visitors: Number(a.visitors),
    newVisitors: Number(a.new_visitors),
    sessions,
    viewsPerSession: sessions ? Number(a.views) / sessions : 0,
    avgEngagementMs: sessions ? Number(a.time_ms) / sessions : 0,
    bounceRate: sessions ? Number(b.bounced) / sessions : 0,
  };
}
export type Totals = Awaited<ReturnType<typeof totals>>;

/* visitors and views per day (or per hour today) */
export async function trend(id: RangeId, from: number, to: number) {
  if (id === "today") {
    const r = await rows(
      `SELECT CAST((created_at - ?) / 3600000 AS INTEGER) h, COUNT(*) views, COUNT(DISTINCT visitor) visitors
         FROM site_views WHERE created_at >= ? AND created_at < ? GROUP BY h`,
      [from, from, to]
    );
    const map = new Map(r.map((x) => [Number(x.h), x]));
    const hours = Math.min(24, Math.ceil((to - from) / 3600_000));
    return Array.from({ length: Math.max(1, hours) }, (_, h) => ({
      key: String(h),
      label: `${h % 12 || 12}${h < 12 ? "am" : "pm"}`,
      views: Number(map.get(h)?.views ?? 0),
      visitors: Number(map.get(h)?.visitors ?? 0),
    }));
  }
  const monthly = id === "365";
  const r = await rows(
    `SELECT ${monthly ? "substr(day, 1, 7)" : "day"} k, COUNT(*) views, COUNT(DISTINCT visitor) visitors
       FROM site_views WHERE created_at >= ? AND created_at < ? GROUP BY k`,
    [from, to]
  );
  const map = new Map(r.map((x) => [String(x.k), x]));
  const out: { key: string; label: string; views: number; visitors: number }[] = [];
  const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  if (monthly) {
    const end = istDay(to);
    let [y, m] = istDay(from).split("-").map(Number);
    while (`${y}-${String(m).padStart(2, "0")}` <= end.slice(0, 7)) {
      const k = `${y}-${String(m).padStart(2, "0")}`;
      out.push({ key: k, label: `${MON[m - 1]} ${String(y).slice(2)}`, views: Number(map.get(k)?.views ?? 0), visitors: Number(map.get(k)?.visitors ?? 0) });
      if (++m > 12) {
        m = 1;
        y++;
      }
    }
    return out;
  }
  for (let t = from; t < to; t += DAY) {
    const k = istDay(t);
    const [, mm, dd] = k.split("-").map(Number);
    out.push({ key: k, label: `${dd} ${MON[mm - 1]}`, views: Number(map.get(k)?.views ?? 0), visitors: Number(map.get(k)?.visitors ?? 0) });
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

/* sessions by where they came from (counted on each session's first view) */
export async function acquisition(from: number, to: number) {
  const src = await rows(
    `SELECT source, medium, COUNT(DISTINCT session) sessions, COUNT(DISTINCT visitor) visitors
       FROM site_views WHERE created_at >= ? AND created_at < ? AND is_entry = 1
      GROUP BY source, medium ORDER BY sessions DESC LIMIT 25`,
    [from, to]
  );
  const channels = new Map<string, number>();
  for (const r of src) channels.set(channelOf(String(r.medium)), (channels.get(channelOf(String(r.medium))) ?? 0) + Number(r.sessions));
  const camp = await rows(
    `SELECT campaign, source, COUNT(DISTINCT session) sessions FROM site_views
      WHERE created_at >= ? AND created_at < ? AND is_entry = 1 AND campaign IS NOT NULL
      GROUP BY campaign, source ORDER BY sessions DESC LIMIT 15`,
    [from, to]
  );
  return {
    sources: src.map((r) => ({ source: String(r.source), medium: String(r.medium), sessions: Number(r.sessions), visitors: Number(r.visitors) })),
    channels: [...channels.entries()].map(([key, value]) => ({ key, value })).sort((a, b) => b.value - a.value),
    campaigns: camp.map((r) => ({ campaign: String(r.campaign), source: String(r.source), sessions: Number(r.sessions) })),
  };
}

/* the pages people look at, how long and how far down */
export async function pages(from: number, to: number) {
  const r = await rows(
    `SELECT path, MAX(title) title, COUNT(*) views, COUNT(DISTINCT visitor) visitors, AVG(duration_ms) avg_ms,
            AVG(scroll) avg_scroll, SUM(is_entry) entries
       FROM site_views WHERE created_at >= ? AND created_at < ?
      GROUP BY path ORDER BY views DESC LIMIT 30`,
    [from, to]
  );
  return r.map((x) => ({
    path: String(x.path),
    title: String(x.title ?? ""),
    views: Number(x.views),
    visitors: Number(x.visitors),
    avgMs: Number(x.avg_ms ?? 0),
    avgScroll: Number(x.avg_scroll ?? 0),
    entries: Number(x.entries ?? 0),
  }));
}

/* visitors split by one column: country, city, device… */
export async function breakdown(col: "country" | "city" | "device" | "browser" | "os" | "lang", from: number, to: number, limit = 10) {
  const r = await rows(
    `SELECT COALESCE(${col}, 'Unknown') k, COUNT(DISTINCT visitor) n FROM site_views
      WHERE created_at >= ? AND created_at < ? GROUP BY k ORDER BY n DESC LIMIT ${limit}`,
    [from, to]
  );
  return r.map((x) => ({ key: String(x.k), value: Number(x.n) }));
}

export const EVENT_LABELS: Record<string, string> = {
  whatsapp_click: "WhatsApp clicks",
  call_click: "Call clicks",
  email_click: "Email clicks",
  form_submit: "Form submits",
  outbound_click: "Outbound links",
  cta_click: "Button clicks",
  download: "Downloads",
};

/* the actions that lead to business */
export async function events(from: number, to: number) {
  const byName = await rows(
    `SELECT name, COUNT(*) n, COUNT(DISTINCT visitor) people FROM site_events WHERE created_at >= ? AND created_at < ? GROUP BY name ORDER BY n DESC`,
    [from, to]
  );
  const byPage = await rows(
    `SELECT path, name, label, COUNT(*) n FROM site_events WHERE created_at >= ? AND created_at < ?
      GROUP BY path, name, label ORDER BY n DESC LIMIT 20`,
    [from, to]
  );
  return {
    totals: byName.map((r) => ({ name: String(r.name), label: EVENT_LABELS[String(r.name)] ?? String(r.name), count: Number(r.n), people: Number(r.people) })),
    detail: byPage.map((r) => ({ path: String(r.path), name: String(r.name), label: String(r.label ?? ""), count: Number(r.n) })),
  };
}

/* who's on the site right now */
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
  const recent = await rows(
    `SELECT path, source, device, city, country, created_at FROM site_views WHERE created_at >= ? ORDER BY id DESC LIMIT 12`,
    [since30]
  );
  return {
    activeNow: Number(now5.n),
    last30: Number(last30.n),
    views30: Number(last30.views),
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

/* how many visits there have ever been (for the "no data yet" message) */
export async function anyViews() {
  const [r] = await rows("SELECT COUNT(*) n FROM site_views", []);
  return Number(r.n);
}
