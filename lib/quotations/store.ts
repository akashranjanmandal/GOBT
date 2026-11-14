import "server-only";
import { db, now } from "@/lib/referral/db";
import { computeQuote, inr, normaliseQuote, quoteClient, quoteNumber, quoteProblem, quoteSubject, QUOTE_STATUSES, type QuoteData, type QuoteStatus } from "./model";

/* Quotations are never deleted. Every save is kept as a numbered version,
   so the superadmin can see exactly what was sent and what changed. */

/* GOBT's paper quotations reached 0089; the website carries on from 0090 */
export const FIRST_SEQ = 90;

export type Quotation = {
  id: number;
  seq: number;
  quoteNo: string;
  date: string;
  client: string;
  subject: string;
  payment: string;
  subtotal: number;
  discount: number;
  taxable: number;
  gst: number;
  grand: number;
  status: QuoteStatus;
  version: number;
  data: QuoteData;
  createdBy: string;
  createdAt: number;
  updatedBy: string;
  updatedAt: number;
};

const toQuote = (r: Record<string, unknown>): Quotation => {
  const date = String(r.quote_date);
  let data: QuoteData;
  try {
    data = normaliseQuote(JSON.parse(String(r.data)), date);
  } catch {
    data = normaliseQuote({}, date);
  }
  return {
    id: Number(r.id),
    seq: Number(r.seq),
    quoteNo: String(r.quote_no),
    date,
    client: String(r.client),
    subject: String(r.subject),
    payment: String(r.payment_mode),
    subtotal: Number(r.subtotal),
    discount: Number(r.discount),
    taxable: Number(r.taxable),
    gst: Number(r.gst),
    grand: Number(r.grand_total),
    status: (QUOTE_STATUSES.some((s) => s.id === r.status) ? r.status : "sent") as QuoteStatus,
    version: Number(r.version),
    data,
    createdBy: String(r.created_by),
    createdAt: Number(r.created_at),
    updatedBy: String(r.updated_by),
    updatedAt: Number(r.updated_at),
  };
};

export const clientName = quoteClient;

export async function nextSeq() {
  const c = await db();
  const r = (await c.execute("SELECT MAX(seq) m FROM quotations")).rows[0];
  return Math.max(FIRST_SEQ, Number(r?.m ?? 0) + 1);
}

export async function quotationById(id: number) {
  const c = await db();
  const r = (await c.execute({ sql: "SELECT * FROM quotations WHERE id = ?", args: [id] })).rows[0];
  return r ? toQuote(r as Record<string, unknown>) : null;
}

export async function listQuotations(opts: { q?: string; status?: string; month?: string } = {}) {
  const c = await db();
  const where: string[] = [];
  const args: string[] = [];
  if (opts.status && QUOTE_STATUSES.some((s) => s.id === opts.status)) {
    where.push("status = ?");
    args.push(opts.status);
  }
  if (opts.month && /^\d{4}-\d{2}$/.test(opts.month)) {
    where.push("substr(quote_date, 1, 7) = ?");
    args.push(opts.month);
  }
  if (opts.q?.trim()) {
    where.push("(LOWER(client) LIKE ? OR LOWER(subject) LIKE ? OR LOWER(quote_no) LIKE ?)");
    const like = `%${opts.q.trim().toLowerCase()}%`;
    args.push(like, like, like);
  }
  const rows = (
    await c.execute({ sql: `SELECT * FROM quotations ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY quote_date DESC, seq DESC LIMIT 500`, args })
  ).rows;
  return rows.map((r) => toQuote(r as Record<string, unknown>));
}

const LABELS: Partial<Record<keyof QuoteData, string>> = {
  date: "date",
  to: "client details",
  subject: "subject",
  salutation: "salutation",
  intro: "introduction",
  sections: "extra sections",
  items: "modules / amounts",
  discount: "discount",
  gstRate: "GST rate",
  payment: "payment type",
  milestones: "milestones",
  emi: "EMI plan",
  paymentTerms: "payment terms",
  inclusions: "inclusions",
  exclusions: "exclusions",
  assumptions: "assumptions",
  terms: "terms & conditions",
  closing: "closing note",
  signature: "signature",
  sign: "signature / stamp",
  doc: "document text",
  listName: "list name",
};

/* "Changed: modules / amounts, discount. Total ₹55,224 → ₹49,914" */
function describeChanges(before: QuoteData, after: QuoteData) {
  const changed = (Object.keys(LABELS) as (keyof QuoteData)[]).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k])).map((k) => LABELS[k]);
  const a = computeQuote(before).grand;
  const b = computeQuote(after).grand;
  const parts = [];
  if (changed.length) parts.push(`Changed: ${changed.join(", ")}`);
  if (a !== b) parts.push(`Total ${inr(a)} → ${inr(b)}`);
  return parts.join(". ") || "Saved with no changes";
}

type Who = { name: string };

export async function saveQuotation(raw: unknown, who: Who, id?: number): Promise<{ ok: true; id: number; quoteNo: string; changes: string } | { ok: false; error: string }> {
  const today = new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);
  const data = normaliseQuote(raw, today);
  const problem = quoteProblem(data);
  if (problem) return { ok: false, error: problem };

  /* drop empty rows so the PDF stays clean */
  data.items = data.items.filter((i) => i.module.trim());
  data.milestones = data.milestones.filter((m) => m.name.trim() || m.percent);
  data.sections = data.sections.filter((s) => s.heading.trim() || s.body.trim());

  const t = computeQuote(data);
  const c = await db();
  const at = now();
  const json = JSON.stringify(data);
  const client = clientName(data);
  const subject = quoteSubject(data) || "Quotation";

  if (id) {
    const old = await quotationById(id);
    if (!old) return { ok: false, error: "That quotation doesn't exist." };
    const changes = describeChanges(old.data, data);
    const version = old.version + 1;
    await c.batch(
      [
        {
          sql: `UPDATE quotations SET quote_date = ?, client = ?, subject = ?, payment_mode = ?, subtotal = ?, discount = ?, taxable = ?, gst = ?,
                grand_total = ?, data = ?, version = ?, updated_by = ?, updated_at = ? WHERE id = ?`,
          args: [data.date, client, subject, data.payment, t.subtotal, t.discount, t.taxable, t.gst, t.grand, json, version, who.name, at, id],
        },
        {
          sql: "INSERT INTO quotation_versions (quotation_id, version, data, grand_total, changes, edited_by, edited_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          args: [id, version, json, t.grand, changes, who.name, at],
        },
      ],
      "write"
    );
    return { ok: true, id, quoteNo: old.quoteNo, changes };
  }

  /* two admins saving at the same moment: the unique number makes one retry */
  for (let attempt = 0; attempt < 3; attempt++) {
    const seq = await nextSeq();
    const quoteNo = quoteNumber(data.date, seq);
    try {
      const res = await c.execute({
        sql: `INSERT INTO quotations (seq, quote_no, quote_date, client, subject, payment_mode, subtotal, discount, taxable, gst, grand_total, status, data, version,
              created_by, created_at, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'sent', ?, 1, ?, ?, ?, ?)`,
        args: [seq, quoteNo, data.date, client, subject, data.payment, t.subtotal, t.discount, t.taxable, t.gst, t.grand, json, who.name, at, who.name, at],
      });
      const newId = Number(res.lastInsertRowid);
      await c.execute({
        sql: "INSERT INTO quotation_versions (quotation_id, version, data, grand_total, changes, edited_by, edited_at) VALUES (?, 1, ?, ?, ?, ?, ?)",
        args: [newId, json, t.grand, "Created", who.name, at],
      });
      return { ok: true, id: newId, quoteNo, changes: "Created" };
    } catch (e) {
      if (!String(e).includes("UNIQUE") || attempt === 2) throw e;
    }
  }
  return { ok: false, error: "Couldn't number the quotation. Try again." };
}

export async function setQuotationStatus(id: number, status: QuoteStatus, who: Who) {
  if (!QUOTE_STATUSES.some((s) => s.id === status)) return null;
  const c = await db();
  const q = await quotationById(id);
  if (!q || q.status === status) return null;
  await c.execute({ sql: "UPDATE quotations SET status = ?, updated_by = ?, updated_at = ? WHERE id = ?", args: [status, who.name, now(), id] });
  return q;
}

export type QuoteVersion = { version: number; grand: number; changes: string; editedBy: string; editedAt: number };

export async function quotationVersions(id: number): Promise<QuoteVersion[]> {
  const c = await db();
  return (
    await c.execute({ sql: "SELECT version, grand_total, changes, edited_by, edited_at FROM quotation_versions WHERE quotation_id = ? ORDER BY version DESC", args: [id] })
  ).rows.map((r) => ({ version: Number(r.version), grand: Number(r.grand_total), changes: String(r.changes ?? ""), editedBy: String(r.edited_by), editedAt: Number(r.edited_at) }));
}

export async function quotationVersionData(id: number, version: number, date: string) {
  const c = await db();
  const r = (await c.execute({ sql: "SELECT data FROM quotation_versions WHERE quotation_id = ? AND version = ?", args: [id, version] })).rows[0];
  if (!r) return null;
  try {
    return normaliseQuote(JSON.parse(String(r.data)), date);
  } catch {
    return null;
  }
}

/* ── the dashboard: per month, per financial-year quarter ── */

export type Bucket = { key: string; label: string; count: number; value: number; grand: number; accepted: number; acceptedCount: number };

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* India's financial year: Q1 = Apr–Jun … Q4 = Jan–Mar */
export function fyQuarter(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const fyStart = m >= 4 ? y : y - 1;
  const q = m >= 4 ? Math.floor((m - 4) / 3) + 1 : 4;
  const first = [4, 7, 10, 1][q - 1];
  const months = [0, 1, 2].map((i) => MONTH_SHORT[first - 1 + i]);
  return {
    key: `${fyStart}-Q${q}`,
    label: `Q${q} FY${String(fyStart).slice(2)}-${String(fyStart + 1).slice(2)}`,
    months: `${months[0]}–${months[2]}`,
    fy: `FY ${fyStart}-${String(fyStart + 1).slice(2)}`,
    fyStart,
  };
}

export async function quotationStats(todayIso: string) {
  const c = await db();
  const rows = (await c.execute("SELECT quote_date, taxable, grand_total, status FROM quotations")).rows.map((r) => ({
    date: String(r.quote_date),
    value: Number(r.taxable),
    grand: Number(r.grand_total),
    accepted: r.status === "accepted",
  }));

  const blank = (key: string, label: string): Bucket => ({ key, label, count: 0, value: 0, grand: 0, accepted: 0, acceptedCount: 0 });
  const add = (b: Bucket, r: (typeof rows)[number]) => {
    b.count++;
    b.value += r.value;
    b.grand += r.grand;
    if (r.accepted) {
      b.accepted += r.value;
      b.acceptedCount++;
    }
  };

  /* the last 12 months, oldest first */
  const [ty, tm] = todayIso.split("-").map(Number);
  const months: Bucket[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(ty, tm - 1 - i, 1));
    const key = d.toISOString().slice(0, 7);
    months.push(blank(key, `${MONTH_SHORT[d.getUTCMonth()]} ${String(d.getUTCFullYear()).slice(2)}`));
  }
  const byMonth = new Map(months.map((m) => [m.key, m]));

  const quarters = new Map<string, Bucket & { months: string }>();
  const thisQ = fyQuarter(todayIso);
  const fy = blank("fy", thisQ.fy);
  const all = blank("all", "All time");
  for (const r of rows) {
    const m = byMonth.get(r.date.slice(0, 7));
    if (m) add(m, r);
    const q = fyQuarter(r.date);
    if (!quarters.has(q.key)) quarters.set(q.key, { ...blank(q.key, q.label), months: q.months });
    add(quarters.get(q.key)!, r);
    if (q.fyStart === thisQ.fyStart) add(fy, r);
    add(all, r);
  }
  /* make sure the current quarter shows even when empty */
  if (!quarters.has(thisQ.key)) quarters.set(thisQ.key, { ...blank(thisQ.key, thisQ.label), months: thisQ.months });

  return {
    months,
    thisMonth: byMonth.get(todayIso.slice(0, 7))!,
    thisQuarter: quarters.get(thisQ.key)!,
    quarters: [...quarters.values()].sort((a, b) => (a.key < b.key ? 1 : -1)).slice(0, 8),
    fy,
    all,
  };
}
