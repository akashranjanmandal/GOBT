import { createClient, type Client } from "@libsql/client";

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

export async function db() {
  if (!client) {
    const url = process.env.TURSO_DATABASE_URL ?? "file:.data/referral.db";
    if (url.startsWith("file:")) {
      const { mkdirSync } = await import("node:fs");
      mkdirSync(".data", { recursive: true });
    }
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  }
  if (!ready) ready = client.batch(SCHEMA, "write").then(() => undefined);
  await ready;
  return client;
}

export const now = () => Date.now();
