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
];

/* columns added after the first release; added once, safely */
const NEW_COLUMNS: [table: string, column: string, definition: string][] = [
  ["leads", "channel", "TEXT"],
  ["users", "last_seen_at", "INTEGER"],
  ["users", "blocked", "INTEGER NOT NULL DEFAULT 0"],
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
