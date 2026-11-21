import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { db, now } from "@/lib/referral/db";
import { ADMIN_ACCOUNTS } from "@/lib/referral/config";
import { MAIL_FROM, escapeHtml, mailer } from "@/lib/mailer";
import { SITE } from "@/lib/seo";
import { conversions, notFound, pages, parseFilter, totals, type Totals } from "./report";
import { searchReport } from "./gsc";
import { inr } from "@/lib/quotations/model";

/* The Monday email: last week's visitors, leads, top pages, broken links,
   Google search and quotations, compared with the week before. */

const DAY = 86_400_000;
const istDay = (t: number) => new Date(t + 5.5 * 3600_000).toISOString().slice(0, 10);

/* the scheduled job proves itself with a key derived from REFERRAL_SECRET */
export function cronKey() {
  const secret = process.env.REFERRAL_SECRET;
  return secret ? createHash("sha256").update(`${secret}:weekly-report`).digest("hex") : null;
}
export function validCronKey(given: string | null) {
  const key = cronKey();
  if (!key || !given || given.length !== key.length) return false;
  return timingSafeEqual(Buffer.from(given), Buffer.from(key));
}

export function reportRecipients() {
  const fromEnv = (process.env.ANALYTICS_REPORT_TO ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter((e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
  return fromEnv.length ? fromEnv : ADMIN_ACCOUNTS.filter((a) => a.role === "superadmin").map((a) => a.email);
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
const num = (n: number) => Math.round(n).toLocaleString("en-IN");
function change(nowV: number, before: number, lowerIsBetter = false) {
  if (!before) return nowV ? `<span style="color:#1a8f5a">new</span>` : "";
  const c = (nowV - before) / before;
  if (Math.abs(c) < 0.005) return `<span style="color:#888">no change</span>`;
  const good = lowerIsBetter ? c < 0 : c > 0;
  return `<span style="color:${good ? "#1a8f5a" : "#c0392b"}">${c > 0 ? "▲" : "▼"} ${Math.abs(c * 100).toFixed(0)}%</span>`;
}

const th = `style="text-align:left;padding:6px 8px;border-bottom:1px solid #ddd;font-size:12px;color:#666"`;
const td = `style="padding:6px 8px;border-bottom:1px solid #eee;font-size:13px"`;
const table = (head: string[], rows: string[][]) =>
  rows.length
    ? `<table cellspacing="0" cellpadding="0" style="width:100%;border-collapse:collapse;margin:6px 0 18px">
        <tr>${head.map((h) => `<th ${th}>${h}</th>`).join("")}</tr>
        ${rows.map((r) => `<tr>${r.map((c) => `<td ${td}>${c}</td>`).join("")}</tr>`).join("")}
      </table>`
    : `<p style="color:#888;font-size:13px;margin:4px 0 18px">Nothing this week.</p>`;
const h2 = (t: string) => `<h2 style="font-size:15px;margin:22px 0 6px;color:#111">${t}</h2>`;
const kpi = (label: string, value: string, delta: string) =>
  `<td style="padding:10px;border:1px solid #eee;border-radius:8px;vertical-align:top;width:25%">
     <div style="font-size:11px;color:#777">${label}</div>
     <div style="font-size:20px;font-weight:700;margin:2px 0">${value}</div>
     <div style="font-size:11px">${delta}</div></td>`;

export async function buildWeeklyReport(at = Date.now()) {
  const today = istDay(at);
  const end = istDay(Date.parse(`${today}T00:00:00+05:30`) - DAY);
  const start = istDay(Date.parse(`${end}T00:00:00+05:30`) - 6 * DAY);
  const f = parseFilter({ from: start, to: end }, at);
  const [cur, prev, sources, landing, top, missing, search, quotes] = await Promise.all([
    totals(f),
    totals(f, true),
    conversions(f, "source"),
    conversions(f, "landing"),
    pages(f, 5),
    notFound(f),
    searchReport({ range: "7" }).catch(() => null),
    (async () => {
      const c = await db();
      const r = (await c.execute({ sql: "SELECT COUNT(*) n, COALESCE(SUM(taxable), 0) v FROM quotations WHERE quote_date >= ? AND quote_date <= ?", args: [start, end] })).rows[0];
      return { n: Number(r.n), v: Number(r.v) };
    })().catch(() => ({ n: 0, v: 0 })),
  ]);
  const t = cur as Totals;
  const p = prev as Totals;
  const range = `${start.split("-").reverse().join("-")} to ${end.split("-").reverse().join("-")}`;
  const link = `${SITE.url}/referral/admin/analytics?from=${start}&to=${end}`;

  let html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:auto;color:#222">
    <h1 style="font-size:20px;margin:0 0 4px">gobt.in — weekly report</h1>
    <p style="margin:0 0 16px;color:#666;font-size:13px">${range}, compared with the week before</p>
    <table cellspacing="6" style="width:100%"><tr>
      ${kpi("Visitors", num(t.visitors), change(t.visitors, p.visitors))}
      ${kpi("Sessions", num(t.sessions), change(t.sessions, p.sessions))}
      ${kpi("Lead actions", num(t.leads), change(t.leads, p.leads))}
      ${kpi("Conversion rate", pct(t.conversionRate), change(t.conversionRate, p.conversionRate))}
    </tr></table>`;

  html += h2("Where leads came from");
  html += table(
    ["Source", "Visits", "With a lead", "WhatsApp", "Calls", "Emails", "Forms"],
    sources.filter((s) => s.sessions).slice(0, 6).map((s) => [escapeHtml(s.key), num(s.sessions), `<b>${num(s.converted)}</b>`, String(s.whatsapp), String(s.calls), String(s.emails), String(s.forms)])
  );
  html += h2("Landing pages that brought leads");
  html += table(
    ["Page", "Visits", "With a lead", "Rate"],
    landing.filter((l) => l.converted).slice(0, 5).map((l) => [escapeHtml(l.key), num(l.sessions), num(l.converted), pct(l.rate)])
  );
  html += h2("Most viewed pages");
  html += table(["Page", "Views", "Visitors"], top.map((x) => [escapeHtml(x.path), num(x.views), num(x.visitors)]));

  if (search?.ok) {
    const s = search.data;
    html += h2(`Google Search (${s.period.start.split("-").reverse().join("-")} to ${s.period.end.split("-").reverse().join("-")})`);
    html += `<table cellspacing="6" style="width:100%"><tr>
      ${kpi("Clicks", num(s.totals.clicks), change(s.totals.clicks, s.previous.clicks))}
      ${kpi("Impressions", num(s.totals.impressions), change(s.totals.impressions, s.previous.impressions))}
      ${kpi("CTR", pct(s.totals.ctr), change(s.totals.ctr, s.previous.ctr))}
      ${kpi("Avg. position", s.totals.position ? s.totals.position.toFixed(1) : "—", change(s.totals.position, s.previous.position, true))}
    </tr></table>`;
    html += table(
      ["Top searches", "Clicks", "Impressions", "Position"],
      s.queries.slice(0, 5).map((q) => [escapeHtml(q.key), num(q.clicks), num(q.impressions), q.position.toFixed(1)])
    );
    if (s.opportunities.striking.length) {
      html += `<p style="font-size:13px;margin:0 0 6px"><b>Close to page 1:</b> ${s.opportunities.striking
        .slice(0, 4)
        .map((q) => `${escapeHtml(q.key)} (pos ${q.position.toFixed(1)})`)
        .join(", ")}</p>`;
    }
    if (s.changes.fresh.length) html += `<p style="font-size:13px;margin:0 0 6px"><b>New keywords:</b> ${s.changes.fresh.slice(0, 6).map((q) => escapeHtml(q.key)).join(", ")}</p>`;
  }

  html += h2("Broken links people hit");
  html += table(["Missing address", "Came from", "Times"], missing.slice(0, 5).map((m) => [escapeHtml(m.path), escapeHtml(m.from), String(m.hits)]));

  html += h2("Quotations");
  html += `<p style="font-size:13px;margin:0 0 18px">${quotes.n} quotation${quotes.n === 1 ? "" : "s"} made, ${inr(quotes.v)} quoted before GST.</p>`;
  html += `<p style="margin:24px 0 0"><a href="${link}" style="background:#f2c14e;color:#140e04;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">Open the full analytics</a></p>
    <p style="color:#999;font-size:11px;margin-top:24px">Sent every Monday by gobt.in. Admin visits and bots are not counted.</p></div>`;

  return { subject: `gobt.in weekly: ${num(t.visitors)} visitors, ${num(t.leads)} lead actions (${range})`, html, weekKey: start };
}

/* sends the report; the scheduled run only sends once per week */
export async function sendWeeklyReport(opts: { to?: string[]; force?: boolean } = {}) {
  const report = await buildWeeklyReport();
  const c = await db();
  if (!opts.force) {
    const last = (await c.execute({ sql: "SELECT value FROM settings WHERE key = 'weekly-report:last'", args: [] })).rows[0];
    if (last && String(last.value) === report.weekKey) return { sent: false, reason: "already sent this week" };
  }
  const to = opts.to?.length ? opts.to : reportRecipients();
  if (!to.length) return { sent: false, reason: "no recipients" };
  await mailer.sendMail({ from: MAIL_FROM, to: to.join(", "), subject: report.subject, html: report.html });
  if (!opts.force) {
    await c.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES ('weekly-report:last', ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [report.weekKey, now()],
    });
  }
  return { sent: true, to };
}
