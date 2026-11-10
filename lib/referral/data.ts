import "server-only";
import { normaliseMobile } from "@/lib/academy";
import { MAIL_FROM, escapeHtml, mailer } from "@/lib/mailer";
import { LEAD_STATUSES, REFERRAL, STATUS_LABEL, inr, type LeadStatus } from "./config";
import { db, now } from "./db";
import { EMAIL_RE, type User } from "./auth";

const DAY = 86_400_000;
const num = (v: unknown) => (v == null ? 0 : Number(v));
const str = (v: unknown) => (v == null ? null : String(v));

export type Lead = {
  id: number;
  referrerId: number;
  name: string;
  phone: string;
  email: string | null;
  company: string | null;
  need: string;
  notes: string | null;
  source: "form" | "link";
  status: LeadStatus;
  adminNote: string | null;
  createdAt: number;
  updatedAt: number;
};

const toLead = (r: Record<string, unknown>): Lead => ({
  id: num(r.id),
  referrerId: num(r.referrer_id),
  name: String(r.name),
  phone: String(r.phone),
  email: str(r.email),
  company: str(r.company),
  need: String(r.need),
  notes: str(r.notes),
  source: r.source === "link" ? "link" : "form",
  status: (LEAD_STATUSES as readonly string[]).includes(String(r.status)) ? (r.status as LeadStatus) : "new",
  adminNote: str(r.admin_note),
  createdAt: num(r.created_at),
  updatedAt: num(r.updated_at),
});

/* ── referrer side ── */

export async function usage(userId: number) {
  const c = await db();
  const t = now();
  const r = (
    await c.execute({
      sql: `SELECT
        SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS day,
        SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS week,
        SUM(CASE WHEN created_at > ? THEN 1 ELSE 0 END) AS month
        FROM leads WHERE referrer_id = ? AND source = 'form'`,
      args: [t - DAY, t - 7 * DAY, t - 30 * DAY, userId],
    })
  ).rows[0];
  const used = { day: num(r?.day), week: num(r?.week), month: num(r?.month) };
  const { limits } = REFERRAL;
  const left = Math.max(0, Math.min(limits.day - used.day, limits.week - used.week, limits.month - used.month));
  return { used, limits, left };
}

export type LeadInput = { name: string; phone: string; email: string; company: string; need: string; consent: boolean };

export async function submitLead(user: User, input: LeadInput): Promise<{ ok: true } | { ok: false; error: string; field?: string }> {
  const name = input.name.trim().slice(0, 100);
  const phone = normaliseMobile(input.phone);
  const email = input.email.trim().toLowerCase().slice(0, 150);
  const company = input.company.trim().slice(0, 150);
  const need = input.need.trim().slice(0, 1000);
  if (name.length < 2) return { ok: false, field: "name", error: "Enter their name." };
  if (!phone) return { ok: false, field: "phone", error: "Enter a valid 10-digit Indian mobile number." };
  if (email && !EMAIL_RE.test(email)) return { ok: false, field: "email", error: "That email doesn't look right." };
  if (need.length < 10) return { ok: false, field: "need", error: "Tell us a little about what they need (at least 10 characters)." };
  if (!input.consent) return { ok: false, field: "consent", error: "Please confirm they're happy for us to contact them." };

  /* no self-referrals */
  if (phone === normaliseMobile(user.phone ?? "") || (email && email === user.email)) {
    return { ok: false, error: "You can't refer yourself." };
  }

  const { left } = await usage(user.id);
  if (left <= 0) return { ok: false, error: "You've reached your sharing limit for now. Try again later." };

  const c = await db();
  /* a lead belongs to whoever registered it first, for leadLockDays */
  const dup = (
    await c.execute({
      sql: `SELECT referrer_id FROM leads WHERE (phone = ? OR (? <> '' AND email = ?)) AND status <> 'rejected' AND created_at > ? LIMIT 1`,
      args: [phone, email, email, now() - REFERRAL.leadLockDays * DAY],
    })
  ).rows[0];
  if (dup) {
    return {
      ok: false,
      error: num(dup.referrer_id) === user.id ? "You've already referred this person." : "Someone has already referred this person.",
    };
  }

  const t = now();
  await c.execute({
    sql: `INSERT INTO leads (referrer_id, name, phone, email, company, need, source, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, 'form', 'new', ?, ?)`,
    args: [user.id, name, phone, email || null, company || null, need, t, t],
  });
  await announceLead({ name, phone, email, company, need }, user, "form");
  return { ok: true };
}

/* a visitor who arrived on a referral link and filled in the contact form */
export async function attributeLinkLead(code: string, lead: { name: string; email: string; company?: string; message: string }) {
  try {
    const c = await db();
    const ref = (await c.execute({ sql: "SELECT * FROM users WHERE code = ?", args: [code.toUpperCase()] })).rows[0];
    if (!ref) return null;
    const email = lead.email.trim().toLowerCase();
    if (email === String(ref.email)) return null;
    const dup = (
      await c.execute({
        sql: `SELECT 1 FROM leads WHERE email = ? AND status <> 'rejected' AND created_at > ? LIMIT 1`,
        args: [email, now() - REFERRAL.leadLockDays * DAY],
      })
    ).rows[0];
    if (dup) return null;
    const t = now();
    await c.execute({
      sql: `INSERT INTO leads (referrer_id, name, phone, email, company, need, source, status, created_at, updated_at)
            VALUES (?, ?, '', ?, ?, ?, 'link', 'new', ?, ?)`,
      args: [num(ref.id), lead.name.slice(0, 100), email, lead.company?.slice(0, 150) || null, lead.message.slice(0, 1000), t, t],
    });
    return { name: str(ref.name) ?? String(ref.email), code: String(ref.code) };
  } catch (error) {
    console.error("[referral] link attribution failed:", error);
    return null;
  }
}

async function announceLead(
  lead: { name: string; phone: string; email: string; company: string; need: string },
  by: User,
  source: "form" | "link"
) {
  const rows: [string, string][] = [
    ["Lead", lead.name],
    ["Phone", lead.phone ? `+91 ${lead.phone}` : "—"],
    ["Email", lead.email || "—"],
    ["Company", lead.company || "—"],
    ["Needs", lead.need],
    ["Referred by", `${by.name ?? by.email} (${by.code})`],
    ["Source", source === "form" ? "Referral dashboard" : "Referral link"],
  ];
  if (process.env.NODE_ENV !== "production" && process.env.REFERRAL_SEND_EMAIL !== "1") {
    console.info(`[referral] new lead (email skipped in development): ${lead.name} via ${by.code}`);
    return;
  }
  try {
    await mailer.sendMail({
      from: MAIL_FROM,
      to: REFERRAL.salesInbox,
      subject: `New referral lead: ${lead.name} (via ${by.code})`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<table style="font-family:Arial,sans-serif;font-size:14px;border-collapse:collapse">${rows
        .map(([k, v]) => `<tr><td style="padding:6px 14px 6px 0;color:#666">${escapeHtml(k)}</td><td style="padding:6px 0">${escapeHtml(v)}</td></tr>`)
        .join("")}</table>`,
    });
  } catch (error) {
    console.error("[referral] could not email new lead:", error);
  }
}

export async function myLeads(userId: number) {
  const c = await db();
  const rows = (await c.execute({ sql: "SELECT * FROM leads WHERE referrer_id = ? ORDER BY created_at DESC", args: [userId] })).rows;
  return rows.map((r) => toLead(r as Record<string, unknown>));
}

export type LedgerEntry = {
  id: number;
  userId: number;
  leadId: number | null;
  kind: "commission" | "points";
  amount: number;
  base: number | null;
  status: "pending" | "approved" | "paid" | "reversed";
  note: string | null;
  createdAt: number;
};

const toEntry = (r: Record<string, unknown>): LedgerEntry => ({
  id: num(r.id),
  userId: num(r.user_id),
  leadId: r.lead_id == null ? null : num(r.lead_id),
  kind: r.kind === "points" ? "points" : "commission",
  amount: num(r.amount),
  base: r.base == null ? null : num(r.base),
  status: String(r.status) as LedgerEntry["status"],
  note: str(r.note),
  createdAt: num(r.created_at),
});

export async function myLedger(userId: number) {
  const c = await db();
  const rows = (await c.execute({ sql: "SELECT * FROM ledger WHERE user_id = ? ORDER BY created_at DESC", args: [userId] })).rows;
  return rows.map((r) => toEntry(r as Record<string, unknown>));
}

export async function balances(userId: number) {
  const c = await db();
  const l = (
    await c.execute({
      sql: `SELECT
        SUM(CASE WHEN kind='commission' AND status='pending' THEN amount ELSE 0 END) AS cpending,
        SUM(CASE WHEN kind='commission' AND status='paid' THEN amount ELSE 0 END) AS cpaid,
        SUM(CASE WHEN kind='points' AND status='approved' THEN amount ELSE 0 END) AS points
        FROM ledger WHERE user_id = ?`,
      args: [userId],
    })
  ).rows[0];
  const r = (
    await c.execute({
      sql: `SELECT
        SUM(CASE WHEN status <> 'rejected' THEN points ELSE 0 END) AS used,
        SUM(CASE WHEN status = 'paid' THEN amount_inr ELSE 0 END) AS redeemed_inr,
        SUM(CASE WHEN status = 'requested' THEN amount_inr ELSE 0 END) AS requested_inr
        FROM redemptions WHERE user_id = ?`,
      args: [userId],
    })
  ).rows[0];
  const pointsEarned = num(l?.points);
  const pointsUsed = num(r?.used);
  return {
    commissionPending: num(l?.cpending),
    commissionPaid: num(l?.cpaid),
    pointsEarned,
    pointsAvailable: pointsEarned - pointsUsed,
    redeemedInr: num(r?.redeemed_inr),
    requestedInr: num(r?.requested_inr),
  };
}

export async function myRedemptions(userId: number) {
  const c = await db();
  const rows = (await c.execute({ sql: "SELECT * FROM redemptions WHERE user_id = ? ORDER BY created_at DESC", args: [userId] })).rows;
  return rows.map((r) => ({ id: num(r.id), points: num(r.points), amountInr: num(r.amount_inr), status: String(r.status), createdAt: num(r.created_at) }));
}

export async function requestRedeem(user: User): Promise<{ ok: true; points: number } | { ok: false; error: string }> {
  if (!user.upi) return { ok: false, error: "Add your UPI ID in your profile first, so we know where to pay you." };
  const b = await balances(user.id);
  const blocks = Math.floor(b.pointsAvailable / REFERRAL.redeemBlock);
  if (blocks < 1) return { ok: false, error: `You need at least ${REFERRAL.redeemBlock} points to redeem.` };
  const points = blocks * REFERRAL.redeemBlock;
  const c = await db();
  const t = now();
  await c.execute({
    sql: "INSERT INTO redemptions (user_id, points, amount_inr, status, created_at, updated_at) VALUES (?, ?, ?, 'requested', ?, ?)",
    args: [user.id, points, blocks * REFERRAL.rupeesPerBlock, t, t],
  });
  return { ok: true, points };
}

export async function updateProfile(
  user: User,
  input: { name: string; phone: string; upi: string; agree: boolean }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const name = input.name.trim().slice(0, 80);
  const phone = normaliseMobile(input.phone);
  const upi = input.upi.trim().slice(0, 80);
  if (name.length < 2) return { ok: false, error: "Please enter your full name." };
  if (!phone) return { ok: false, error: "Enter a valid 10-digit Indian mobile number." };
  if (upi && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi)) return { ok: false, error: "That UPI ID doesn't look right (e.g. name@okaxis)." };
  if (!user.agreedAt && !input.agree) return { ok: false, error: "Please accept the programme rules to continue." };
  const c = await db();
  await c.execute({
    sql: "UPDATE users SET name = ?, phone = ?, upi = ?, agreed_at = COALESCE(agreed_at, ?) WHERE id = ?",
    args: [name, phone, upi || null, now(), user.id],
  });
  return { ok: true };
}

/* ── admin side ── */

export async function adminLeads(status?: string) {
  const c = await db();
  const filter = status && (LEAD_STATUSES as readonly string[]).includes(status);
  const rows = (
    await c.execute({
      sql: `SELECT l.*, u.name AS ref_name, u.email AS ref_email, u.code AS ref_code,
              (SELECT COALESCE(SUM(base),0) FROM ledger WHERE lead_id = l.id AND kind='commission' AND status <> 'reversed') AS received,
              (SELECT COALESCE(SUM(amount),0) FROM ledger WHERE lead_id = l.id AND kind='commission' AND status <> 'reversed') AS commission
            FROM leads l JOIN users u ON u.id = l.referrer_id
            ${filter ? "WHERE l.status = ?" : ""}
            ORDER BY l.created_at DESC LIMIT 300`,
      args: filter ? [status!] : [],
    })
  ).rows;
  return rows.map((r) => ({
    ...toLead(r as Record<string, unknown>),
    referrer: `${str(r.ref_name) ?? str(r.ref_email)} (${String(r.ref_code)})`,
    received: num(r.received),
    commission: num(r.commission),
  }));
}

export async function adminSetStatus(leadId: number, status: LeadStatus, note: string) {
  const c = await db();
  const lead = (await c.execute({ sql: "SELECT * FROM leads WHERE id = ?", args: [leadId] })).rows[0];
  if (!lead) return;
  const t = now();
  await c.execute({
    sql: "UPDATE leads SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?",
    args: [status, note.trim().slice(0, 500) || null, t, leadId],
  });
  const points = (
    await c.execute({ sql: "SELECT id, status FROM ledger WHERE lead_id = ? AND kind = 'points' LIMIT 1", args: [leadId] })
  ).rows[0];
  if (status === "won") {
    /* a legit customer: points, once per lead */
    if (!points) {
      await c.execute({
        sql: `INSERT INTO ledger (user_id, lead_id, kind, amount, status, note, created_at, updated_at)
              VALUES (?, ?, 'points', ?, 'approved', ?, ?, ?)`,
        args: [num(lead.referrer_id), leadId, REFERRAL.pointsPerCustomer, `${String(lead.name)} became a client`, t, t],
      });
    } else if (points.status === "reversed") {
      await c.execute({ sql: "UPDATE ledger SET status = 'approved', updated_at = ? WHERE id = ?", args: [t, num(points.id)] });
    }
  } else if (points && points.status === "approved") {
    await c.execute({ sql: "UPDATE ledger SET status = 'reversed', updated_at = ? WHERE id = ?", args: [t, num(points.id)] });
  }
}

/* money received from the client → the referrer's commission on it */
export async function adminRecordPayment(leadId: number, amountReceived: number) {
  if (!Number.isFinite(amountReceived) || amountReceived <= 0) return { ok: false as const, error: "Enter the amount received." };
  const c = await db();
  const lead = (await c.execute({ sql: "SELECT * FROM leads WHERE id = ?", args: [leadId] })).rows[0];
  if (!lead) return { ok: false as const, error: "Lead not found." };
  if (lead.status !== "won") return { ok: false as const, error: "Mark the lead as “Became a client” first." };
  const commission = Math.round((amountReceived * REFERRAL.commissionPercent) / 100);
  const t = now();
  await c.execute({
    sql: `INSERT INTO ledger (user_id, lead_id, kind, amount, base, status, note, created_at, updated_at)
          VALUES (?, ?, 'commission', ?, ?, 'pending', ?, ?, ?)`,
    args: [
      num(lead.referrer_id),
      leadId,
      commission,
      Math.round(amountReceived),
      `${REFERRAL.commissionPercent}% of ${inr(amountReceived)} paid by ${String(lead.name)}`,
      t,
      t,
    ],
  });
  return { ok: true as const };
}

export async function adminPayouts() {
  const c = await db();
  const rows = (
    await c.execute({
      sql: `SELECT g.*, u.name AS ref_name, u.email AS ref_email, u.upi AS ref_upi, u.code AS ref_code
            FROM ledger g JOIN users u ON u.id = g.user_id
            WHERE g.kind = 'commission' ORDER BY (g.status = 'pending') DESC, g.created_at DESC LIMIT 300`,
      args: [],
    })
  ).rows;
  return rows.map((r) => ({
    ...toEntry(r as Record<string, unknown>),
    referrer: `${str(r.ref_name) ?? str(r.ref_email)} (${String(r.ref_code)})`,
    upi: str(r.ref_upi),
  }));
}

export async function adminSetCommission(entryId: number, status: "paid" | "reversed" | "pending") {
  const c = await db();
  await c.execute({
    sql: "UPDATE ledger SET status = ?, updated_at = ? WHERE id = ? AND kind = 'commission'",
    args: [status, now(), entryId],
  });
}

export async function adminRedemptions() {
  const c = await db();
  const rows = (
    await c.execute({
      sql: `SELECT r.*, u.name AS ref_name, u.email AS ref_email, u.upi AS ref_upi, u.code AS ref_code
            FROM redemptions r JOIN users u ON u.id = r.user_id
            ORDER BY (r.status = 'requested') DESC, r.created_at DESC LIMIT 300`,
      args: [],
    })
  ).rows;
  return rows.map((r) => ({
    id: num(r.id),
    points: num(r.points),
    amountInr: num(r.amount_inr),
    status: String(r.status),
    createdAt: num(r.created_at),
    referrer: `${str(r.ref_name) ?? str(r.ref_email)} (${String(r.ref_code)})`,
    upi: str(r.ref_upi),
  }));
}

export async function adminSetRedemption(id: number, status: "paid" | "rejected") {
  const c = await db();
  await c.execute({
    sql: "UPDATE redemptions SET status = ?, updated_at = ? WHERE id = ? AND status = 'requested'",
    args: [status, now(), id],
  });
}

export async function adminReferrers() {
  const c = await db();
  const rows = (
    await c.execute({
      sql: `SELECT u.*,
              (SELECT COUNT(*) FROM leads WHERE referrer_id = u.id) AS leads,
              (SELECT COUNT(*) FROM leads WHERE referrer_id = u.id AND status = 'won') AS won,
              (SELECT COALESCE(SUM(amount),0) FROM ledger WHERE user_id = u.id AND kind='commission' AND status='paid') AS paid,
              (SELECT COALESCE(SUM(amount),0) FROM ledger WHERE user_id = u.id AND kind='commission' AND status='pending') AS pending
            FROM users u ORDER BY u.created_at DESC LIMIT 500`,
      args: [],
    })
  ).rows;
  return rows.map((r) => ({
    id: num(r.id),
    name: str(r.name),
    email: String(r.email),
    phone: str(r.phone),
    upi: str(r.upi),
    code: String(r.code),
    leads: num(r.leads),
    won: num(r.won),
    paid: num(r.paid),
    pending: num(r.pending),
    createdAt: num(r.created_at),
  }));
}

export { STATUS_LABEL };
