import type { Client } from "@libsql/client";
import { ADMIN_ACCOUNTS } from "./config";
import { isPasswordHash } from "./password";

/* SQLite via libsql: a local file in development, a hosted Turso
   database in production (set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN). */
let client: Client | null = null;
let ready: Promise<void> | null = null;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    phone TEXT,
    upi TEXT,
    code TEXT NOT NULL UNIQUE,
    agreed_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS otps (
    email TEXT PRIMARY KEY,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0,
    sent_count INTEGER NOT NULL DEFAULT 0,
    window_start INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS leads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    referrer_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    company TEXT,
    need TEXT NOT NULL,
    notes TEXT,
    source TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    admin_note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS leads_referrer ON leads (referrer_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS leads_phone ON leads (phone)`,
  /* every reward movement: commission (rupees) and points */
  `CREATE TABLE IF NOT EXISTS ledger (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    lead_id INTEGER,
    kind TEXT NOT NULL,
    amount INTEGER NOT NULL,
    base INTEGER,
    status TEXT NOT NULL,
    note TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS ledger_user ON ledger (user_id)`,
  `CREATE TABLE IF NOT EXISTS redemptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    amount_inr INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  /* the people who run the programme (separate from referrers) */
  `CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    failed_count INTEGER NOT NULL DEFAULT 0,
    locked_until INTEGER NOT NULL DEFAULT 0,
    last_login_at INTEGER,
    created_at INTEGER NOT NULL
  )`,
  /* every real visit to a referral link */
  `CREATE TABLE IF NOT EXISTS clicks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    channel TEXT,
    source_host TEXT,
    device TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    visitor TEXT,
    is_unique INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS clicks_user ON clicks (user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS clicks_visitor ON clicks (visitor, user_id)`,
  /* every time a referrer pressed a share button */
  `CREATE TABLE IF NOT EXISTS shares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    channel TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS shares_user ON shares (user_id, created_at)`,
  /* a readable timeline of what happened */
  `CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    actor TEXT NOT NULL,
    kind TEXT NOT NULL,
    detail TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS activity_created ON activity (created_at)`,
  `CREATE TABLE IF NOT EXISTS academy_regs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    class TEXT NOT NULL,
    school TEXT NOT NULL,
    mobile TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    address TEXT NOT NULL,
    course TEXT NOT NULL,
    location TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  /* internship, training, work-completion and custom certificates */
  `CREATE TABLE IF NOT EXISTS certificates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cert_no TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    recipient TEXT NOT NULL,
    pronoun TEXT NOT NULL DEFAULT 'they',
    role TEXT,
    start_date TEXT,
    end_date TEXT,
    skills TEXT,
    body TEXT NOT NULL,
    note TEXT,
    issued_on TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'valid',
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  /* quotations: never deleted; every save is kept in quotation_versions */
  `CREATE TABLE IF NOT EXISTS quotations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    seq INTEGER NOT NULL UNIQUE,
    quote_no TEXT NOT NULL UNIQUE,
    quote_date TEXT NOT NULL,
    client TEXT NOT NULL,
    subject TEXT NOT NULL,
    payment_mode TEXT NOT NULL,
    subtotal INTEGER NOT NULL,
    discount INTEGER NOT NULL,
    taxable INTEGER NOT NULL,
    gst INTEGER NOT NULL,
    grand_total INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    data TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS quotations_date ON quotations (quote_date)`,
  `CREATE TABLE IF NOT EXISTS quotation_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quotation_id INTEGER NOT NULL,
    version INTEGER NOT NULL,
    data TEXT NOT NULL,
    grand_total INTEGER NOT NULL,
    changes TEXT,
    edited_by TEXT NOT NULL,
    edited_at INTEGER NOT NULL,
    UNIQUE (quotation_id, version)
  )`,
  /* everything admins do, for the superadmin */
  `CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_id INTEGER,
    admin_email TEXT,
    admin_name TEXT,
    action TEXT NOT NULL,
    target TEXT,
    detail TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS audit_created ON audit_log (created_at)`,
  /* saved signatures and stamps for quotations (hidden, never deleted) */
  `CREATE TABLE IF NOT EXISTS quote_marks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    hidden INTEGER NOT NULL DEFAULT 0,
    created_by TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  /* website analytics: one row per page view (no IP addresses are stored) */
  `CREATE TABLE IF NOT EXISTS site_views (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pv_id TEXT NOT NULL UNIQUE,
    visitor TEXT NOT NULL,
    session TEXT NOT NULL,
    is_new_visitor INTEGER NOT NULL DEFAULT 0,
    is_entry INTEGER NOT NULL DEFAULT 0,
    path TEXT NOT NULL,
    title TEXT,
    source TEXT NOT NULL,
    medium TEXT NOT NULL,
    referrer_host TEXT,
    campaign TEXT,
    term TEXT,
    device TEXT,
    browser TEXT,
    os TEXT,
    country TEXT,
    region TEXT,
    city TEXT,
    lang TEXT,
    screen TEXT,
    duration_ms INTEGER NOT NULL DEFAULT 0,
    scroll INTEGER NOT NULL DEFAULT 0,
    day TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS site_views_created ON site_views (created_at)`,
  `CREATE INDEX IF NOT EXISTS site_views_session ON site_views (session)`,
  /* clicks on WhatsApp / call / email links, outbound links and form submits */
  `CREATE TABLE IF NOT EXISTS site_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    visitor TEXT NOT NULL,
    session TEXT NOT NULL,
    path TEXT NOT NULL,
    name TEXT NOT NULL,
    label TEXT,
    day TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS site_events_created ON site_events (created_at)`,
  /* small site settings, e.g. the directors' signature images */
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`,
];

/* columns added after the first release; added once, safely */
const NEW_COLUMNS: [table: string, column: string, definition: string][] = [
  ["leads", "channel", "TEXT"],
  ["users", "last_seen_at", "INTEGER"],
  ["users", "blocked", "INTEGER NOT NULL DEFAULT 0"],
  ["admins", "role", "TEXT NOT NULL DEFAULT 'admin'"],
];

/* local file in development; hosted Turso over HTTPS in production.
   The web client has no native code, so it runs on Netlify/Vercel. */
async function connect(): Promise<Client> {
  const url = process.env.TURSO_DATABASE_URL ?? "file:.data/referral.db";
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url.startsWith("file:")) {
    if (process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      throw new Error("TURSO_DATABASE_URL is not set. A local file can't be used on serverless hosting.");
    }
    const { mkdirSync } = await import("node:fs");
    mkdirSync(".data", { recursive: true });
    const { createClient } = await import("@libsql/client");
    return createClient({ url });
  }

  const { createClient } = await import("@libsql/client/web");
  return createClient({ url: url.replace(/^libsql:/, "https:"), authToken });
}

async function prepare(c: Client) {
  await c.batch(SCHEMA, "write");

  const tables = [...new Set(NEW_COLUMNS.map(([t]) => t))];
  const info = await c.batch(tables.map((t) => `PRAGMA table_info(${t})`), "read");
  const have = new Map(tables.map((t, i) => [t, new Set(info[i].rows.map((r) => String(r.name)))]));
  for (const [table, column, definition] of NEW_COLUMNS) {
    if (!have.get(table)?.has(column)) await c.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }

  /* create the admin accounts that don't exist yet. ADMIN_PASSWORD_HASH
     holds a scrypt hash (made with scripts/hash-password.mjs), never the
     password itself, and that hash is stored as is. */
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim();
  const existing = new Set((await c.execute("SELECT email FROM admins")).rows.map((r) => String(r.email)));
  const missing = ADMIN_ACCOUNTS.filter((a) => !existing.has(a.email));
  if (missing.length && !isPasswordHash(hash)) {
    console.warn("[referral] ADMIN_PASSWORD_HASH is missing or not a valid hash, so admin accounts were not created.");
  } else if (missing.length && hash) {
    await c.batch(
      missing.map((a) => ({
        sql: "INSERT OR IGNORE INTO admins (email, name, password_hash, created_at) VALUES (?, ?, ?, ?)",
        args: [a.email, a.name, hash, Date.now()],
      })),
      "write"
    );
  }

  /* roles come from config (ADMIN_ACCOUNTS), so they can't be changed from the panel */
  await c.batch(
    ADMIN_ACCOUNTS.map((a) => ({ sql: "UPDATE admins SET role = ? WHERE email = ?", args: [a.role, a.email] })),
    "write"
  );
}

export async function db() {
  if (!client) client = await connect();
  if (!ready) {
    const c = client;
    ready = prepare(c);
    /* a failed attempt (bad token, network) must not stick */
    ready.catch(() => {
      ready = null;
      client = null;
    });
  }
  await ready;
  return client;
}

export const now = () => Date.now();
