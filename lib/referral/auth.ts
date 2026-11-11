import "server-only";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MAIL_FROM, mailer } from "@/lib/mailer";
import { db, now } from "./db";
import { readToken, signToken } from "./jwt";
import { DUMMY_HASH, hashPassword, passwordProblem, verifyPassword } from "./password";
import { secret } from "./secret";

/* Two separate logins:
   - referrers: email + one-time code, then a JWT cookie
   - admins: email + password, then a different JWT cookie */

const USER_COOKIE = "gobt_rf";
const ADMIN_COOKIE = "gobt_admin";
const USER_DAYS = 30;
const ADMIN_HOURS = 12;
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_SENDS_PER_HOUR = 5;
const ADMIN_MAX_FAILS = 5;
const ADMIN_LOCK_MINUTES = 15;

const hash = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const secure = () => process.env.NODE_ENV === "production";

/* ═══ referrers: one-time codes ═══ */

export async function sendLoginCode(rawEmail: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };

  const c = await db();
  const blocked = (await c.execute({ sql: "SELECT blocked FROM users WHERE email = ?", args: [email] })).rows[0];
  if (blocked && Number(blocked.blocked) === 1) return { ok: false, error: "This account has been suspended. Please contact us." };

  const t = now();
  const prev = (await c.execute({ sql: "SELECT sent_count, window_start FROM otps WHERE email = ?", args: [email] })).rows[0];
  let sent = 0;
  let windowStart = t;
  if (prev && t - Number(prev.window_start) < 3_600_000) {
    sent = Number(prev.sent_count);
    windowStart = Number(prev.window_start);
  }
  if (sent >= OTP_MAX_SENDS_PER_HOUR) return { ok: false, error: "Too many codes requested. Please try again in an hour." };

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await c.execute({
    sql: `INSERT INTO otps (email, code_hash, expires_at, attempts, sent_count, window_start)
          VALUES (?, ?, ?, 0, ?, ?)
          ON CONFLICT(email) DO UPDATE SET code_hash = excluded.code_hash, expires_at = excluded.expires_at,
            attempts = 0, sent_count = excluded.sent_count, window_start = excluded.window_start`,
    args: [email, hash(`${email}:${code}`), t + OTP_MINUTES * 60_000, sent + 1, windowStart],
  });

  /* development: the code is printed in the terminal instead of emailed
     (set REFERRAL_SEND_EMAIL=1 to send real emails locally) */
  if (process.env.NODE_ENV !== "production" && process.env.REFERRAL_SEND_EMAIL !== "1") {
    console.info(`[referral] login code for ${email}: ${code}`);
    return { ok: true };
  }

  try {
    await mailer.sendMail({
      from: MAIL_FROM,
      to: email,
      subject: `${code} is your GOBT Referral login code`,
      text: `Your login code is ${code}. It expires in ${OTP_MINUTES} minutes. If you didn't ask for it, ignore this email.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:10px">
        <p style="margin:0 0 8px;color:#666">GOBT Referral Program</p>
        <p style="margin:0 0 16px;font-size:15px">Your login code:</p>
        <p style="margin:0 0 16px;font-size:34px;font-weight:700;letter-spacing:8px">${code}</p>
        <p style="margin:0;color:#666;font-size:13px">It expires in ${OTP_MINUTES} minutes. If you didn't ask for it, ignore this email.</p>
      </div>`,
    });
  } catch (error) {
    console.error("[referral] could not email login code:", error);
    return { ok: false, error: "We couldn't send the email. Please try again." };
  }
  return { ok: true };
}

export async function verifyLoginCode(rawEmail: string, rawCode: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  const code = rawCode.replace(/\D/g, "");
  const c = await db();
  const row = (await c.execute({ sql: "SELECT code_hash, expires_at, attempts FROM otps WHERE email = ?", args: [email] })).rows[0];
  if (!row || Number(row.expires_at) < now()) return { ok: false, error: "That code has expired. Please request a new one." };
  if (Number(row.attempts) >= OTP_MAX_ATTEMPTS) return { ok: false, error: "Too many wrong tries. Please request a new code." };

  const expected = Buffer.from(String(row.code_hash), "hex");
  const given = Buffer.from(hash(`${email}:${code}`), "hex");
  if (code.length !== 6 || !timingSafeEqual(expected, given)) {
    await c.execute({ sql: "UPDATE otps SET attempts = attempts + 1 WHERE email = ?", args: [email] });
    return { ok: false, error: "That code isn't right. Check the email and try again." };
  }
  await c.execute({ sql: "DELETE FROM otps WHERE email = ?", args: [email] });

  const found = await findOrCreateUser(email);
  if (found.blocked) return { ok: false, error: "This account has been suspended. Please contact us." };
  await c.execute({ sql: "UPDATE users SET last_seen_at = ? WHERE id = ?", args: [now(), found.id] });

  (await cookies()).set(USER_COOKIE, await signToken("referrer", found.id, USER_DAYS * 86_400), {
    httpOnly: true,
    secure: secure(),
    sameSite: "lax",
    path: "/",
    maxAge: USER_DAYS * 86_400,
  });
  return { ok: true };
}

/* short, shareable, unique: e.g. RIYA4821 */
async function newCode(seed: string) {
  const c = await db();
  const base = seed.replace(/[^a-z]/gi, "").slice(0, 5).toUpperCase() || "GOBT";
  for (let i = 0; i < 20; i++) {
    const code = `${base}${randomInt(1000, 10_000)}`;
    const taken = (await c.execute({ sql: "SELECT 1 FROM users WHERE code = ?", args: [code] })).rows.length;
    if (!taken) return code;
  }
  return `${base}${randomBytes(4).toString("hex").toUpperCase()}`;
}

async function findOrCreateUser(email: string) {
  const c = await db();
  const found = (await c.execute({ sql: "SELECT id, blocked FROM users WHERE email = ?", args: [email] })).rows[0];
  if (found) return { id: Number(found.id), blocked: Number(found.blocked) === 1 };
  const res = await c.execute({
    sql: "INSERT INTO users (email, code, created_at) VALUES (?, ?, ?)",
    args: [email, await newCode(email.split("@")[0]), now()],
  });
  const id = Number(res.lastInsertRowid);
  await c.execute({
    sql: "INSERT INTO activity (user_id, actor, kind, detail, created_at) VALUES (?, 'system', 'joined', ?, ?)",
    args: [id, "A new referrer signed up", now()],
  });
  return { id, blocked: false };
}

/* ═══ referrers: the logged-in user ═══ */

export type User = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  upi: string | null;
  code: string;
  agreedAt: number | null;
  createdAt: number;
};

export async function currentUser(): Promise<User | null> {
  const id = await readToken((await cookies()).get(USER_COOKIE)?.value, "referrer");
  if (!id) return null;
  const c = await db();
  const row = (await c.execute({ sql: "SELECT * FROM users WHERE id = ?", args: [id] })).rows[0];
  if (!row || Number(row.blocked) === 1) return null;
  const t = now();
  if (!row.last_seen_at || t - Number(row.last_seen_at) > 3_600_000) {
    await c.execute({ sql: "UPDATE users SET last_seen_at = ? WHERE id = ?", args: [t, id] });
  }
  return {
    id,
    email: String(row.email),
    name: (row.name as string) ?? null,
    phone: (row.phone as string) ?? null,
    upi: (row.upi as string) ?? null,
    code: String(row.code),
    agreedAt: row.agreed_at == null ? null : Number(row.agreed_at),
    createdAt: Number(row.created_at),
  };
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/referral/login");
  return user;
}

export async function logout() {
  (await cookies()).delete(USER_COOKIE);
}

/* ═══ admins: email + password ═══ */

export type Admin = { id: number; email: string; name: string };

export async function loginAdmin(rawEmail: string, password: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  const c = await db();
  const row = (await c.execute({ sql: "SELECT * FROM admins WHERE email = ?", args: [email] })).rows[0];
  const t = now();

  if (row && Number(row.locked_until) > t) {
    const mins = Math.ceil((Number(row.locked_until) - t) / 60_000);
    return { ok: false, error: `Too many wrong attempts. Try again in ${mins} minute${mins === 1 ? "" : "s"}.` };
  }

  /* always run a hash comparison, so timing doesn't reveal which emails exist */
  const good = await verifyPassword(password, row ? String(row.password_hash) : DUMMY_HASH);
  if (!row || !good) {
    if (row) {
      const fails = Number(row.failed_count) + 1;
      await c.execute({
        sql: "UPDATE admins SET failed_count = ?, locked_until = ? WHERE id = ?",
        args: [fails >= ADMIN_MAX_FAILS ? 0 : fails, fails >= ADMIN_MAX_FAILS ? t + ADMIN_LOCK_MINUTES * 60_000 : 0, Number(row.id)],
      });
    } else {
      const any = (await c.execute("SELECT COUNT(*) n FROM admins")).rows[0];
      if (Number(any.n) === 0) return { ok: false, error: "Admin accounts haven't been created yet. Ask your developer to set ADMIN_PASSWORD_HASH on the server." };
    }
    return { ok: false, error: "Wrong email or password." };
  }

  await c.execute({ sql: "UPDATE admins SET failed_count = 0, locked_until = 0, last_login_at = ? WHERE id = ?", args: [t, Number(row.id)] });
  await c.execute({
    sql: "INSERT INTO activity (user_id, actor, kind, detail, created_at) VALUES (NULL, ?, 'admin_login', ?, ?)",
    args: [String(row.name), `${String(row.name)} logged in to the admin panel`, t],
  });
  (await cookies()).set(ADMIN_COOKIE, await signToken("admin", Number(row.id), ADMIN_HOURS * 3600), {
    httpOnly: true,
    secure: secure(),
    sameSite: "lax",
    path: "/referral/admin",
    maxAge: ADMIN_HOURS * 3600,
  });
  return { ok: true };
}

export async function currentAdmin(): Promise<Admin | null> {
  const id = await readToken((await cookies()).get(ADMIN_COOKIE)?.value, "admin");
  if (!id) return null;
  const c = await db();
  const row = (await c.execute({ sql: "SELECT id, email, name FROM admins WHERE id = ?", args: [id] })).rows[0];
  return row ? { id, email: String(row.email), name: String(row.name) } : null;
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) redirect("/referral/admin/login");
  return admin;
}

export async function logoutAdmin() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: "/referral/admin" });
}

export async function changeAdminPassword(admin: Admin, current: string, next: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const c = await db();
  const row = (await c.execute({ sql: "SELECT password_hash FROM admins WHERE id = ?", args: [admin.id] })).rows[0];
  if (!row || !(await verifyPassword(current, String(row.password_hash)))) return { ok: false, error: "Your current password isn't right." };
  const problem = passwordProblem(next);
  if (problem) return { ok: false, error: problem };
  if (next === current) return { ok: false, error: "Choose a password that's different from the current one." };
  await c.execute({ sql: "UPDATE admins SET password_hash = ? WHERE id = ?", args: [await hashPassword(next), admin.id] });
  return { ok: true };
}
