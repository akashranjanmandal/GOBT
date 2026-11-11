import "server-only";
import { channelLabel } from "./channels";
import { db, now } from "./db";

/* Every number the dashboards show. `days = 0` means all time. Pass a
   userId to get one referrer's numbers instead of the whole programme. */

const DAY = 86_400_000;
const IST = 19_800; // seconds
const num = (v: unknown) => (v == null ? 0 : Number(v));
const str = (v: unknown) => (v == null ? null : String(v));

export const sinceOf = (days: number) => (days > 0 ? now() - days * DAY : 0);
export const RANGES = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 0, label: "All time" },
] as const;
export const parseRange = (v: string | undefined) => (RANGES.some((r) => String(r.days) === v) ? Number(v) : 30);

type Table = "clicks" | "shares" | "leads";
const userCol = (t: Table) => (t === "leads" ? "referrer_id" : "user_id");

/* ── time series ── */

function lastDays(n: number) {
  const out: string[] = [];
  const istNow = Date.now() + IST * 1000;
  for (let i = n - 1; i >= 0; i--) out.push(new Date(istNow - i * DAY).toISOString().slice(0, 10));
  return out;
}

export async function dailySeries(table: Table, days: number, userId?: number) {
  const n = days > 0 ? days : 90;
  const c = await db();
  const rows = (
    await c.execute({
      sql: `SELECT strftime('%Y-%m-%d', (created_at / 1000) + ${IST}, 'unixepoch') AS d, COUNT(*) AS n
            FROM ${table} WHERE created_at >= ? ${userId ? `AND ${userCol(table)} = ?` : ""} GROUP BY d`,
      args: userId ? [now() - n * DAY, userId] : [now() - n * DAY],
    })
  ).rows;
  const map = new Map(rows.map((r) => [String(r.d), num(r.n)]));
  return lastDays(n).map((date) => ({ date, value: map.get(date) ?? 0 }));
}

/* ── headline numbers ── */

export async function totals(days: number, userId?: number) {
  const c = await db();
  const since = sinceOf(days);
  const u = (col: string) => (userId ? ` AND ${col} = ${Number(userId)}` : "");
  const one = async (sql: string, args: unknown[] = [since]) => num((await c.execute({ sql, args: args as never })).rows[0]?.n);

  const [clicks, visitors, shares, leads, contacted, qualified, won, received, earned] = await Promise.all([
    one(`SELECT COUNT(*) n FROM clicks WHERE created_at >= ?${u("user_id")}`),
    one(`SELECT COUNT(*) n FROM clicks WHERE is_unique = 1 AND created_at >= ?${u("user_id")}`),
    one(`SELECT COUNT(*) n FROM shares WHERE created_at >= ?${u("user_id")}`),
    one(`SELECT COUNT(*) n FROM leads WHERE status <> 'rejected' AND created_at >= ?${u("referrer_id")}`),
    one(`SELECT COUNT(*) n FROM leads WHERE status IN ('contacted','qualified','won') AND created_at >= ?${u("referrer_id")}`),
    one(`SELECT COUNT(*) n FROM leads WHERE status IN ('qualified','won') AND created_at >= ?${u("referrer_id")}`),
    one(`SELECT COUNT(*) n FROM leads WHERE status = 'won' AND created_at >= ?${u("referrer_id")}`),
    one(`SELECT COALESCE(SUM(base),0) n FROM ledger WHERE kind='commission' AND status <> 'reversed' AND created_at >= ?${u("user_id")}`),
    one(`SELECT COALESCE(SUM(amount),0) n FROM ledger WHERE kind='commission' AND status <> 'reversed' AND created_at >= ?${u("user_id")}`),
  ]);
  return { clicks, visitors, shares, leads, contacted, qualified, won, received, earned };
}

/* money and points right now (not limited to a date range) */
export async function balances(userId?: number) {
  const c = await db();
  const f = userId ? ` AND user_id = ${Number(userId)}` : "";
  const g = userId ? ` WHERE user_id = ${Number(userId)}` : "";
  const l = (
    await c.execute(`SELECT
      COALESCE(SUM(CASE WHEN kind='commission' AND status='pending' THEN amount END),0) AS cpending,
      COALESCE(SUM(CASE WHEN kind='commission' AND status='paid' THEN amount END),0) AS cpaid,
      COALESCE(SUM(CASE WHEN kind='commission' AND status='pending' THEN 1 END),0) AS cpending_n,
      COALESCE(SUM(CASE WHEN kind='points' AND status='approved' THEN amount END),0) AS points
      FROM ledger WHERE 1=1${f}`)
  ).rows[0];
  const r = (
    await c.execute(`SELECT
      COALESCE(SUM(CASE WHEN status <> 'rejected' THEN points END),0) AS used,
      COALESCE(SUM(CASE WHEN status = 'paid' THEN amount_inr END),0) AS paid_inr,
      COALESCE(SUM(CASE WHEN status = 'requested' THEN amount_inr END),0) AS requested_inr,
      COALESCE(SUM(CASE WHEN status = 'requested' THEN 1 END),0) AS requested_n
      FROM redemptions${g}`)
  ).rows[0];
  const pointsEarned = num(l.points);
  return {
    commissionPending: num(l.cpending),
    commissionPendingCount: num(l.cpending_n),
    commissionPaid: num(l.cpaid),
    pointsEarned,
    pointsAvailable: pointsEarned - num(r.used),
    redeemedInr: num(r.paid_inr),
    requestedInr: num(r.requested_inr),
    requestedCount: num(r.requested_n),
  };
}

/* ── where links are shared, and what came of it ── */

export async function channelReport(days: number, userId?: number) {
  const c = await db();
  const since = sinceOf(days);
  const u = (col: string) => (userId ? ` AND ${col} = ${Number(userId)}` : "");
  const [s, k, l] = await Promise.all([
    c.execute({ sql: `SELECT channel, COUNT(*) n FROM shares WHERE created_at >= ?${u("user_id")} GROUP BY channel`, args: [since] }),
    c.execute({
      sql: `SELECT COALESCE(channel,'') channel, COUNT(*) n, SUM(is_unique) uniq FROM clicks WHERE created_at >= ?${u("user_id")} GROUP BY channel`,
      args: [since],
    }),
    c.execute({
      sql: `SELECT COALESCE(channel,'') channel, COUNT(*) n, SUM(CASE WHEN status='won' THEN 1 ELSE 0 END) won
            FROM leads WHERE source = 'link' AND created_at >= ?${u("referrer_id")} GROUP BY channel`,
      args: [since],
    }),
  ]);
  const rows = new Map<string, { channel: string; label: string; shares: number; clicks: number; visitors: number; leads: number; won: number }>();
  const row = (ch: string) => {
    if (!rows.has(ch)) rows.set(ch, { channel: ch, label: ch ? channelLabel(ch) : "Direct / unknown", shares: 0, clicks: 0, visitors: 0, leads: 0, won: 0 });
    return rows.get(ch)!;
  };
  for (const r of s.rows) row(String(r.channel)).shares = num(r.n);
  for (const r of k.rows) {
    const x = row(String(r.channel));
    x.clicks = num(r.n);
    x.visitors = num(r.uniq);
  }
  for (const r of l.rows) {
    const x = row(String(r.channel));
    x.leads = num(r.n);
    x.won = num(r.won);
  }
  return [...rows.values()].sort((a, b) => b.clicks + b.shares - (a.clicks + a.shares));
}

export async function clickBreakdown(col: "source_host" | "device" | "country" | "city", days: number, userId?: number, limit = 8) {
  const c = await db();
  const rows = (
    await c.execute({
      sql: `SELECT ${col} k, COUNT(*) n, SUM(is_unique) uniq FROM clicks WHERE created_at >= ? ${userId ? `AND user_id = ${Number(userId)}` : ""}
            GROUP BY k ORDER BY n DESC LIMIT ?`,
      args: [sinceOf(days), limit],
    })
  ).rows;
  return rows.map((r) => ({ key: str(r.k), clicks: num(r.n), visitors: num(r.uniq) }));
}

export async function recentClicks(limit = 60, userId?: number) {
  const c = await db();
  const rows = (
    await c.execute({
      sql: `SELECT k.*, u.name, u.email, u.code FROM clicks k JOIN users u ON u.id = k.user_id
            ${userId ? `WHERE k.user_id = ${Number(userId)}` : ""} ORDER BY k.created_at DESC LIMIT ?`,
      args: [limit],
    })
  ).rows;
  return rows.map((r) => ({
    id: num(r.id),
    at: num(r.created_at),
    referrer: str(r.name) ?? String(r.email),
    code: String(r.code),
    channel: str(r.channel),
    source: str(r.source_host),
    device: str(r.device),
    place: [str(r.city), str(r.region), str(r.country)].filter(Boolean).join(", ") || null,
    isNew: num(r.is_unique) === 1,
  }));
}

/* ── people ── */

export type ReferrerRow = {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  upi: string | null;
  code: string;
  blocked: boolean;
  createdAt: number;
  lastSeenAt: number | null;
  shares: number;
  clicks: number;
  leads: number;
  won: number;
  earned: number;
  pending: number;
};

export async function referrerRows(days: number, opts: { search?: string; limit?: number; includeUnfinished?: boolean } = {}): Promise<ReferrerRow[]> {
  const c = await db();
  const since = sinceOf(days);
  const q = opts.search?.trim().toLowerCase();
  const rows = (
    await c.execute({
      sql: `SELECT u.*,
        (SELECT COUNT(*) FROM shares WHERE user_id = u.id AND created_at >= ?) AS shares,
        (SELECT COUNT(*) FROM clicks WHERE user_id = u.id AND created_at >= ?) AS clicks,
        (SELECT COUNT(*) FROM leads WHERE referrer_id = u.id AND status <> 'rejected' AND created_at >= ?) AS leads,
        (SELECT COUNT(*) FROM leads WHERE referrer_id = u.id AND status = 'won' AND created_at >= ?) AS won,
        (SELECT COALESCE(SUM(amount),0) FROM ledger WHERE user_id = u.id AND kind='commission' AND status <> 'reversed' AND created_at >= ?) AS earned,
        (SELECT COALESCE(SUM(amount),0) FROM ledger WHERE user_id = u.id AND kind='commission' AND status = 'pending') AS pending
        FROM users u
        ${opts.includeUnfinished ? "" : "WHERE u.name IS NOT NULL"}
        ORDER BY won DESC, leads DESC, clicks DESC, u.created_at DESC LIMIT ?`,
      args: [since, since, since, since, since, opts.limit ?? 500],
    })
  ).rows;
  return rows
    .map((r) => ({
      id: num(r.id),
      name: str(r.name),
      email: String(r.email),
      phone: str(r.phone),
      upi: str(r.upi),
      code: String(r.code),
      blocked: num(r.blocked) === 1,
      createdAt: num(r.created_at),
      lastSeenAt: r.last_seen_at == null ? null : num(r.last_seen_at),
      shares: num(r.shares),
      clicks: num(r.clicks),
      leads: num(r.leads),
      won: num(r.won),
      earned: num(r.earned),
      pending: num(r.pending),
    }))
    .filter((r) => !q || `${r.name ?? ""} ${r.email} ${r.code} ${r.phone ?? ""}`.toLowerCase().includes(q));
}

export async function referrerById(id: number) {
  const c = await db();
  const r = (await c.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] })).rows[0];
  if (!r) return null;
  return {
    id,
    name: str(r.name),
    email: String(r.email),
    phone: str(r.phone),
    upi: str(r.upi),
    code: String(r.code),
    blocked: num(r.blocked) === 1,
    createdAt: num(r.created_at),
    lastSeenAt: r.last_seen_at == null ? null : num(r.last_seen_at),
    agreedAt: r.agreed_at == null ? null : num(r.agreed_at),
  };
}

/* ── admin overview extras ── */

export async function programme(days: number) {
  const c = await db();
  const since = sinceOf(days);
  const [total, fresh, active] = await Promise.all([
    c.execute("SELECT COUNT(*) n FROM users WHERE name IS NOT NULL"),
    c.execute({ sql: "SELECT COUNT(*) n FROM users WHERE name IS NOT NULL AND created_at >= ?", args: [since] }),
    c.execute({
      sql: `SELECT COUNT(*) n FROM users u WHERE u.name IS NOT NULL AND (
              EXISTS (SELECT 1 FROM clicks WHERE user_id = u.id AND created_at >= ?) OR
              EXISTS (SELECT 1 FROM shares WHERE user_id = u.id AND created_at >= ?) OR
              EXISTS (SELECT 1 FROM leads WHERE referrer_id = u.id AND created_at >= ?))`,
      args: [since, since, since],
    }),
  ]);
  return { referrers: num(total.rows[0].n), newReferrers: num(fresh.rows[0].n), activeReferrers: num(active.rows[0].n) };
}

/* the things an admin should do next */
export async function attention() {
  const c = await db();
  const [newLeads, pending, redemptions, noUpi, stale] = await Promise.all([
    c.execute("SELECT COUNT(*) n FROM leads WHERE status = 'new'"),
    c.execute("SELECT COUNT(*) n, COALESCE(SUM(amount),0) s FROM ledger WHERE kind='commission' AND status='pending'"),
    c.execute("SELECT COUNT(*) n, COALESCE(SUM(amount_inr),0) s FROM redemptions WHERE status='requested'"),
    c.execute(`SELECT COUNT(DISTINCT u.id) n FROM users u JOIN ledger g ON g.user_id = u.id
               WHERE g.kind='commission' AND g.status='pending' AND (u.upi IS NULL OR u.upi = '')`),
    c.execute({ sql: "SELECT COUNT(*) n FROM leads WHERE status = 'new' AND created_at < ?", args: [now() - 2 * DAY] }),
  ]);
  return {
    newLeads: num(newLeads.rows[0].n),
    staleLeads: num(stale.rows[0].n),
    pendingCommissions: num(pending.rows[0].n),
    pendingCommissionAmount: num(pending.rows[0].s),
    redemptionRequests: num(redemptions.rows[0].n),
    redemptionAmount: num(redemptions.rows[0].s),
    missingUpi: num(noUpi.rows[0].n),
  };
}

export async function recentActivity(limit = 30, userId?: number) {
  const c = await db();
  const rows = (
    await c.execute({
      sql: `SELECT a.*, u.name, u.email FROM activity a LEFT JOIN users u ON u.id = a.user_id
            ${userId ? `WHERE a.user_id = ${Number(userId)}` : ""} ORDER BY a.created_at DESC LIMIT ?`,
      args: [limit],
    })
  ).rows;
  return rows.map((r) => ({
    id: num(r.id),
    at: num(r.created_at),
    kind: String(r.kind),
    actor: String(r.actor),
    detail: String(r.detail),
    who: str(r.name) ?? str(r.email),
  }));
}

export async function academyRegistrations(limit = 300) {
  const c = await db();
  const rows = (await c.execute({ sql: "SELECT * FROM academy_regs ORDER BY created_at DESC LIMIT ?", args: [limit] })).rows;
  return rows.map((r) => ({
    id: num(r.id),
    at: num(r.created_at),
    name: String(r.name),
    studentClass: String(r.class),
    school: String(r.school),
    mobile: String(r.mobile),
    whatsapp: String(r.whatsapp),
    address: String(r.address),
    course: String(r.course),
    location: String(r.location),
  }));
}

export async function adminAccounts() {
  const c = await db();
  const rows = (await c.execute("SELECT id, email, name, last_login_at FROM admins ORDER BY id")).rows;
  return rows.map((r) => ({ id: num(r.id), email: String(r.email), name: String(r.name), lastLoginAt: r.last_login_at == null ? null : num(r.last_login_at) }));
}

export async function leadCounts() {
  const c = await db();
  const rows = (await c.execute("SELECT status, COUNT(*) n FROM leads GROUP BY status")).rows;
  return Object.fromEntries(rows.map((r) => [String(r.status), num(r.n)])) as Record<string, number>;
}
