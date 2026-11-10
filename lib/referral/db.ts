import type { Client } from "@libsql/client";

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

export async function db() {
  if (!client) client = await connect();
  if (!ready) {
    ready = client.batch(SCHEMA, "write").then(() => undefined);
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
