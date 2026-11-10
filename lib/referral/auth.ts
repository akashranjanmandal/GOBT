import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MAIL_FROM, mailer } from "@/lib/mailer";
import { db, now } from "./db";

/* Email one-time codes + database sessions. No passwords anywhere. */

const SESSION_COOKIE = "gobt_rf_session";
const SESSION_DAYS = 30;
const OTP_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_SENDS_PER_HOUR = 5;

function secret() {
  const s = process.env.REFERRAL_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("REFERRAL_SECRET is not set");
  return "dev-only-referral-secret";
}

const hash = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");

/* who can open /referral/admin */
export function isAdminEmail(email: string) {
  const list = (process.env.REFERRAL_ADMINS ?? "dev@gobt.in,info@gobt.in")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── one-time codes ── */

export async function sendLoginCode(rawEmail: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const email = rawEmail.trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return { ok: false, error: "Please enter a valid email address." };

  const c = await db();
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
    if (process.env.NODE_ENV === "production") return { ok: false, error: "We couldn't send the email. Please try again." };
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

  const userId = await findOrCreateUser(email);
  const token = randomBytes(32).toString("base64url");
  await c.execute({
    sql: "INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
    args: [hash(token), userId, now() + SESSION_DAYS * 86_400_000],
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
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
  const found = (await c.execute({ sql: "SELECT id FROM users WHERE email = ?", args: [email] })).rows[0];
  if (found) return Number(found.id);
  const res = await c.execute({
    sql: "INSERT INTO users (email, code, created_at) VALUES (?, ?, ?)",
    args: [email, await newCode(email.split("@")[0]), now()],
  });
  return Number(res.lastInsertRowid);
}

/* ── sessions ── */

export type User = {
  id: number;
  email: string;
  name: string | null;
  phone: string | null;
  upi: string | null;
  code: string;
  agreedAt: number | null;
  isAdmin: boolean;
};

export async function currentUser(): Promise<User | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const c = await db();
  const row = (
    await c.execute({
      sql: `SELECT u.* FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ? AND s.expires_at > ?`,
      args: [hash(token), now()],
    })
  ).rows[0];
  if (!row) return null;
  const email = String(row.email);
  return {
    id: Number(row.id),
    email,
    name: (row.name as string) ?? null,
    phone: (row.phone as string) ?? null,
    upi: (row.upi as string) ?? null,
    code: String(row.code),
    agreedAt: row.agreed_at == null ? null : Number(row.agreed_at),
    isAdmin: isAdminEmail(email),
  };
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) redirect("/referral/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) redirect("/referral/dashboard");
  return user;
}

export async function logout() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    const c = await db();
    await c.execute({ sql: "DELETE FROM sessions WHERE token_hash = ?", args: [hash(token)] });
  }
  jar.delete(SESSION_COOKIE);
}
