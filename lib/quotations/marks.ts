import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { db, now } from "@/lib/referral/db";
import type { MarkInfo, MarkKind } from "./model";

/* The library of signatures and stamps used on quotations. GOBT's original
   signature and stamp are always there; admins add more. Nothing is deleted:
   an image can only be hidden, so old quotations keep printing correctly. */

export const DEFAULT_MARKS: MarkInfo[] = [
  { id: "default-signature", kind: "signature", name: "Suprime Mandal (original)", builtIn: true, hidden: false },
  { id: "default-stamp", kind: "stamp", name: "GOBT round stamp (original)", builtIn: true, hidden: false },
];

const ASSET: Record<string, string> = { "default-signature": "signature.png", "default-stamp": "stamp.png" };

export async function listMarks(opts: { includeHidden?: boolean } = {}): Promise<MarkInfo[]> {
  const c = await db();
  const rows = (await c.execute(`SELECT id, kind, name, hidden, created_by, created_at FROM quote_marks ${opts.includeHidden ? "" : "WHERE hidden = 0"} ORDER BY id DESC`)).rows;
  return [
    ...DEFAULT_MARKS,
    ...rows.map((r) => ({
      id: String(r.id),
      kind: (r.kind === "stamp" ? "stamp" : "signature") as MarkKind,
      name: String(r.name),
      builtIn: false,
      hidden: Number(r.hidden) === 1,
      createdBy: String(r.created_by),
      createdAt: Number(r.created_at),
    })),
  ];
}

/* the image bytes for one mark (hidden ones still print on quotations that use them) */
export async function markImage(id: string): Promise<{ data: Buffer; type: "image/png" | "image/jpeg" } | null> {
  if (ASSET[id]) return { data: readFileSync(path.join(process.cwd(), "lib/quotations/assets", ASSET[id])), type: "image/png" };
  if (!/^\d+$/.test(id)) return null;
  const c = await db();
  const r = (await c.execute({ sql: "SELECT data FROM quote_marks WHERE id = ?", args: [Number(id)] })).rows[0];
  if (!r) return null;
  const m = String(r.data).match(/^data:(image\/(?:png|jpeg));base64,(.+)$/);
  return m ? { data: Buffer.from(m[2], "base64"), type: m[1] as "image/png" | "image/jpeg" } : null;
}

export async function addMark(kind: MarkKind, name: string, dataUrl: string, who: string) {
  const c = await db();
  const res = await c.execute({
    sql: "INSERT INTO quote_marks (kind, name, data, hidden, created_by, created_at) VALUES (?, ?, ?, 0, ?, ?)",
    args: [kind, name.trim().slice(0, 80) || (kind === "stamp" ? "Stamp" : "Signature"), dataUrl, who, now()],
  });
  return String(res.lastInsertRowid);
}

export async function setMarkHidden(id: string, hidden: boolean) {
  if (!/^\d+$/.test(id)) return null;
  const c = await db();
  const r = (await c.execute({ sql: "SELECT name FROM quote_marks WHERE id = ?", args: [Number(id)] })).rows[0];
  if (!r) return null;
  await c.execute({ sql: "UPDATE quote_marks SET hidden = ? WHERE id = ?", args: [hidden ? 1 : 0, Number(id)] });
  return String(r.name);
}

/* the images one quotation needs, ready for the PDF */
export async function marksFor(q: import("./model").QuoteData) {
  const { marksUsed } = await import("./model");
  const out: Record<string, { data: Buffer; type: "image/png" | "image/jpeg" }> = {};
  for (const id of marksUsed(q)) {
    const m = await markImage(id);
    if (m) out[id] = m;
  }
  return out;
}
