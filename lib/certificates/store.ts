import "server-only";
import { db, now } from "@/lib/referral/db";
import { logActivity } from "@/lib/referral/track";
import { CERT_KINDS, PRONOUNS, SIGNATORIES, certPrefix, plainText, slugOf, type CertFields } from "./config";

export type Certificate = {
  id: number;
  certNo: string;
  slug: string;
  kind: string;
  title: string;
  recipient: string;
  pronoun: string;
  role: string;
  startDate: string;
  endDate: string;
  skills: string;
  body: string;
  note: string;
  issuedOn: string;
  status: "valid" | "revoked";
  createdBy: string;
  createdAt: number;
  updatedAt: number;
};

const s = (v: unknown) => (v == null ? "" : String(v));

const toCert = (r: Record<string, unknown>): Certificate => ({
  id: Number(r.id),
  certNo: s(r.cert_no),
  slug: s(r.slug),
  kind: s(r.kind),
  title: s(r.title),
  recipient: s(r.recipient),
  pronoun: s(r.pronoun),
  role: s(r.role),
  startDate: s(r.start_date),
  endDate: s(r.end_date),
  skills: s(r.skills),
  body: s(r.body),
  note: s(r.note),
  issuedOn: s(r.issued_on),
  status: r.status === "revoked" ? "revoked" : "valid",
  createdBy: s(r.created_by),
  createdAt: Number(r.created_at),
  updatedAt: Number(r.updated_at),
});

export async function listCertificates(opts: { q?: string; kind?: string; includeRevoked?: boolean } = {}) {
  const c = await db();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (!opts.includeRevoked) where.push("status = 'valid'");
  if (opts.kind && CERT_KINDS.some((k) => k.id === opts.kind)) {
    where.push("kind = ?");
    args.push(opts.kind);
  }
  const q = opts.q?.trim();
  if (q) {
    where.push("(LOWER(recipient) LIKE ? OR UPPER(cert_no) LIKE ? OR slug LIKE ? OR LOWER(role) LIKE ?)");
    const like = `%${q.toLowerCase()}%`;
    args.push(like, `%${q.toUpperCase()}%`, `%${slugOf(q)}%`, like);
  }
  const rows = (
    await c.execute({
      sql: `SELECT * FROM certificates ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY issued_on DESC, id DESC LIMIT 500`,
      args,
    })
  ).rows;
  return rows.map((r) => toCert(r as Record<string, unknown>));
}

export async function certificateBySlug(slug: string) {
  const c = await db();
  const r = (await c.execute({ sql: "SELECT * FROM certificates WHERE slug = ?", args: [slugOf(slug)] })).rows[0];
  return r ? toCert(r as Record<string, unknown>) : null;
}

export async function certificateById(id: number) {
  const c = await db();
  const r = (await c.execute({ sql: "SELECT * FROM certificates WHERE id = ?", args: [id] })).rows[0];
  return r ? toCert(r as Record<string, unknown>) : null;
}

/* next number for the month it's issued in: GOBT/C/0826/001, /002… */
export async function nextCertNo(issuedOn: string) {
  const c = await db();
  const prefix = certPrefix(issuedOn);
  const rows = (await c.execute({ sql: "SELECT cert_no FROM certificates WHERE cert_no LIKE ?", args: [`${prefix}%`] })).rows;
  const max = rows.reduce((m, r) => Math.max(m, Number(String(r.cert_no).slice(prefix.length)) || 0), 0);
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/* checks the form; returns a clean record or the first problem */
export function cleanFields(f: CertFields): { ok: true; value: CertFields } | { ok: false; error: string } {
  const v: CertFields = {
    kind: CERT_KINDS.some((k) => k.id === f.kind) ? f.kind : "",
    title: f.title.trim().slice(0, 60),
    recipient: f.recipient.trim().replace(/\s+/g, " ").slice(0, 80),
    pronoun: PRONOUNS.some((p) => p.id === f.pronoun) ? f.pronoun : "they",
    role: f.role.trim().slice(0, 120),
    startDate: f.startDate.trim(),
    endDate: f.endDate.trim(),
    skills: f.skills.trim().slice(0, 400),
    body: f.body.trim().slice(0, 900),
    note: f.note.trim().slice(0, 500),
    issuedOn: f.issuedOn.trim(),
    certNo: (f.certNo ?? "").trim().toUpperCase().slice(0, 40),
  };
  if (!v.kind) return { ok: false, error: "Choose the type of certificate." };
  if (v.recipient.length < 2) return { ok: false, error: "Enter the full name of the person." };
  if (!v.title) return { ok: false, error: "Enter the certificate title." };
  if (v.startDate && !DATE_RE.test(v.startDate)) return { ok: false, error: "The start date isn't valid." };
  if (v.endDate && !DATE_RE.test(v.endDate)) return { ok: false, error: "The end date isn't valid." };
  if (v.startDate && v.endDate && v.endDate < v.startDate) return { ok: false, error: "The end date is before the start date." };
  if (!DATE_RE.test(v.issuedOn)) return { ok: false, error: "Enter the date of issue." };
  if (plainText(v.body).length < 20) return { ok: false, error: "Write the certificate text (or press “Write it for me”)." };
  if (v.certNo && !/^[A-Z0-9][A-Z0-9/\-]{3,}$/.test(v.certNo)) return { ok: false, error: "Certificate numbers can use letters, numbers, / and - only." };
  return { ok: true, value: v };
}

export async function saveCertificate(f: CertFields, actor: string, id?: number): Promise<{ ok: true; id: number; slug: string } | { ok: false; error: string }> {
  const clean = cleanFields(f);
  if (!clean.ok) return clean;
  const v = clean.value;
  const c = await db();
  const t = now();

  let certNo = v.certNo || "";
  if (id) {
    const existing = await certificateById(id);
    if (!existing) return { ok: false, error: "That certificate no longer exists." };
    certNo = certNo || existing.certNo;
  } else if (!certNo) {
    certNo = await nextCertNo(v.issuedOn);
  }
  const slug = slugOf(certNo);
  const clash = (await c.execute({ sql: "SELECT id FROM certificates WHERE (cert_no = ? OR slug = ?) AND id <> ?", args: [certNo, slug, id ?? 0] })).rows[0];
  if (clash) return { ok: false, error: `Certificate number ${certNo} is already used.` };

  const values = [certNo, slug, v.kind, v.title, v.recipient, v.pronoun, v.role || null, v.startDate || null, v.endDate || null, v.skills || null, v.body, v.note || null, v.issuedOn];
  if (id) {
    await c.execute({
      sql: `UPDATE certificates SET cert_no = ?, slug = ?, kind = ?, title = ?, recipient = ?, pronoun = ?, role = ?, start_date = ?, end_date = ?,
            skills = ?, body = ?, note = ?, issued_on = ?, updated_at = ? WHERE id = ?`,
      args: [...values, t, id],
    });
    await logActivity(null, actor, "certificate", `${actor} edited certificate ${certNo} (${v.recipient})`);
    return { ok: true, id, slug };
  }
  const res = await c.execute({
    sql: `INSERT INTO certificates (cert_no, slug, kind, title, recipient, pronoun, role, start_date, end_date, skills, body, note, issued_on, status, created_by, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'valid', ?, ?, ?)`,
    args: [...values, actor, t, t],
  });
  await logActivity(null, actor, "certificate", `${actor} issued certificate ${certNo} to ${v.recipient}`);
  return { ok: true, id: Number(res.lastInsertRowid), slug };
}

export async function setCertificateStatus(id: number, status: "valid" | "revoked", actor: string) {
  const c = await db();
  const cert = await certificateById(id);
  if (!cert) return;
  await c.execute({ sql: "UPDATE certificates SET status = ?, updated_at = ? WHERE id = ?", args: [status, now(), id] });
  await logActivity(null, actor, "certificate", `${actor} ${status === "revoked" ? "revoked" : "restored"} certificate ${cert.certNo} (${cert.recipient})`);
}

/* ── images printed on every certificate (data URLs): the directors'
   signatures ("0", "1") and the top-right logo ("badge") ── */

export type ImageSlot = "0" | "1" | "badge";
export const IMAGE_SLOTS: ImageSlot[] = ["0", "1", "badge"];
const slotKey = (slot: ImageSlot) => (slot === "badge" ? "logo:badge" : `signature:${slot}`);
const slotName = (slot: ImageSlot) => (slot === "badge" ? "the top-right logo" : `${SIGNATORIES[Number(slot)].name}'s signature`);

export async function getCertImages(): Promise<{ signatures: (string | null)[]; badge: string | null }> {
  const c = await db();
  const rows = (await c.execute("SELECT key, value FROM settings WHERE key LIKE 'signature:%' OR key = 'logo:badge'")).rows;
  const map = new Map(rows.map((r) => [String(r.key), String(r.value)]));
  return {
    signatures: SIGNATORIES.map((_, i) => map.get(slotKey(String(i) as ImageSlot)) ?? null),
    badge: map.get(slotKey("badge")) ?? null,
  };
}

export async function setCertImage(slot: ImageSlot, dataUrl: string | null, actor: string) {
  if (!IMAGE_SLOTS.includes(slot)) return;
  const c = await db();
  if (dataUrl) {
    await c.execute({
      sql: "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
      args: [slotKey(slot), dataUrl, now()],
    });
  } else {
    await c.execute({ sql: "DELETE FROM settings WHERE key = ?", args: [slotKey(slot)] });
  }
  await logActivity(null, actor, "certificate", `${actor} ${dataUrl ? "updated" : "removed"} ${slotName(slot)}`);
}
