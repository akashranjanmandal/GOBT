import "server-only";
import { CHANNEL_IDS } from "./channels";
import { db, now } from "./db";

/* Everything that gets recorded: link clicks, share-button presses and
   a readable activity timeline. */

export async function logActivity(userId: number | null, actor: string, kind: string, detail: string) {
  try {
    const c = await db();
    await c.execute({
      sql: "INSERT INTO activity (user_id, actor, kind, detail, created_at) VALUES (?, ?, ?, ?, ?)",
      args: [userId, actor, kind, detail.slice(0, 300), now()],
    });
  } catch (error) {
    console.error("[referral] could not log activity:", error);
  }
}

/* link previews, crawlers and scripts aren't real people */
const BOT_RE =
  /bot|crawl|spider|slurp|preview|facebookexternalhit|facebot|whatsapp|curl|wget|python-requests|headless|monitor|uptime|lighthouse|go-http|axios|node-fetch|scanner/i;
export const isBot = (ua: string) => !ua || BOT_RE.test(ua);

export const deviceOf = (ua: string) => (/ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : "desktop");

export const cleanChannel = (value: string | null | undefined) => (value && CHANNEL_IDS.includes(value) ? value : null);

/* Netlify sends visitor geography in x-nf-geo (base64 JSON); other hosts
   send a country header. All best-effort. */
export function geoOf(headers: Headers) {
  const out: { country: string | null; region: string | null; city: string | null } = { country: null, region: null, city: null };
  try {
    const raw = headers.get("x-nf-geo");
    if (raw) {
      const g = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
      out.country = g.country?.name ?? g.country?.code ?? null;
      out.region = g.subdivision?.name ?? g.subdivision?.code ?? null;
      out.city = g.city ?? null;
      return out;
    }
  } catch {
    /* ignore a malformed header */
  }
  out.country = headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry") ?? headers.get("x-country") ?? null;
  return out;
}

export async function recordClick(input: {
  userId: number;
  channel: string | null;
  referer: string | null;
  ua: string;
  headers: Headers;
  visitor: string;
}) {
  const c = await db();
  const t = now();
  /* one person counts once per referrer, ever: the same link sent to the
     same person again (or through another app) adds nothing */
  const seen = (await c.execute({ sql: "SELECT 1 FROM clicks WHERE visitor = ? AND user_id = ? LIMIT 1", args: [input.visitor, input.userId] })).rows[0];
  if (seen) return;

  let host: string | null = null;
  try {
    if (input.referer) host = new URL(input.referer).hostname.replace(/^www\./, "");
  } catch {
    /* no usable referer */
  }
  if (host === "gobt.in") host = null;
  const geo = geoOf(input.headers);

  await c.execute({
    sql: `INSERT INTO clicks (user_id, channel, source_host, device, country, region, city, visitor, is_unique, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [input.userId, input.channel, host, deviceOf(input.ua), geo.country, geo.region, geo.city, input.visitor, 1, t],
  });
}

const SHARES_PER_DAY = 200;

export async function recordShare(userId: number, channel: string): Promise<boolean> {
  if (!CHANNEL_IDS.includes(channel)) return false;
  const c = await db();
  const t = now();
  /* pressing share on the same app again within a day counts once */
  const again = (
    await c.execute({
      sql: "SELECT 1 FROM shares WHERE user_id = ? AND channel = ? AND created_at > ? LIMIT 1",
      args: [userId, channel, t - 86_400_000],
    })
  ).rows[0];
  if (again) return false;
  const today = (await c.execute({ sql: "SELECT COUNT(*) n FROM shares WHERE user_id = ? AND created_at > ?", args: [userId, t - 86_400_000] })).rows[0];
  if (Number(today.n) >= SHARES_PER_DAY) return false;
  await c.execute({ sql: "INSERT INTO shares (user_id, channel, created_at) VALUES (?, ?, ?)", args: [userId, channel, t] });
  return true;
}
