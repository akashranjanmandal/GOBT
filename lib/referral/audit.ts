import "server-only";
import { headers } from "next/headers";
import { db, now } from "./db";

/* The superadmin's log: every admin action, who did it, when, from where.
   Writing a log line must never break the action itself. */

export type AuditActor = { id: number; email: string; name: string } | null;

export const AUDIT_GROUPS: { id: string; label: string }[] = [
  { id: "login", label: "Logins" },
  { id: "quotation", label: "Quotations" },
  { id: "certificate", label: "Certificates" },
  { id: "lead", label: "Leads" },
  { id: "money", label: "Payouts" },
  { id: "referrer", label: "Referrers" },
  { id: "account", label: "Accounts" },
];

async function client() {
  try {
    const h = await headers();
    const ip = (h.get("x-nf-client-connection-ip") || h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim();
    return { ip: ip.slice(0, 64) || null, ua: (h.get("user-agent") || "").slice(0, 300) || null };
  } catch {
    return { ip: null, ua: null };
  }
}

/* action is "group.verb", e.g. "quotation.edited" */
export async function audit(actor: AuditActor, action: string, detail: string, target?: string, fallbackEmail?: string) {
  try {
    const c = await db();
    const { ip, ua } = await client();
    await c.execute({
      sql: `INSERT INTO audit_log (admin_id, admin_email, admin_name, action, target, detail, ip, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [actor?.id ?? null, actor?.email ?? fallbackEmail ?? null, actor?.name ?? null, action, target ?? null, detail.slice(0, 1000), ip, ua, now()],
    });
  } catch (e) {
    console.error("[audit] could not write log", e);
  }
}

export type AuditRow = {
  id: number;
  adminEmail: string;
  adminName: string;
  action: string;
  target: string;
  detail: string;
  ip: string;
  userAgent: string;
  at: number;
};

export async function auditRows(opts: { who?: string; group?: string; q?: string; before?: number; limit?: number }) {
  const c = await db();
  const where: string[] = [];
  const args: (string | number)[] = [];
  if (opts.who) {
    where.push("admin_email = ?");
    args.push(opts.who);
  }
  if (opts.group && AUDIT_GROUPS.some((g) => g.id === opts.group)) {
    where.push("action LIKE ?");
    args.push(`${opts.group}.%`);
  }
  if (opts.q?.trim()) {
    where.push("(LOWER(detail) LIKE ? OR LOWER(COALESCE(target, '')) LIKE ?)");
    const like = `%${opts.q.trim().toLowerCase()}%`;
    args.push(like, like);
  }
  if (opts.before) {
    where.push("id < ?");
    args.push(opts.before);
  }
  const limit = Math.min(200, opts.limit ?? 100);
  const rows = (
    await c.execute({
      sql: `SELECT * FROM audit_log ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY id DESC LIMIT ${limit + 1}`,
      args,
    })
  ).rows;
  const list: AuditRow[] = rows.slice(0, limit).map((r) => ({
    id: Number(r.id),
    adminEmail: String(r.admin_email ?? ""),
    adminName: String(r.admin_name ?? ""),
    action: String(r.action),
    target: String(r.target ?? ""),
    detail: String(r.detail),
    ip: String(r.ip ?? ""),
    userAgent: String(r.user_agent ?? ""),
    at: Number(r.created_at),
  }));
  return { rows: list, more: rows.length > limit };
}

export async function adminDirectory() {
  const c = await db();
  return (await c.execute("SELECT id, email, name, role, last_login_at, locked_until FROM admins ORDER BY id")).rows.map((r) => ({
    id: Number(r.id),
    email: String(r.email),
    name: String(r.name),
    role: String(r.role),
    lastLogin: r.last_login_at == null ? null : Number(r.last_login_at),
    locked: Number(r.locked_until) > Date.now(),
  }));
}
