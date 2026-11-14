"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";
import { computeQuote, inr, QUOTE_STATUSES, type QuoteStatus } from "@/lib/quotations/model";
import { quotationById, saveQuotation, setQuotationStatus } from "@/lib/quotations/store";

export type QuoteFormState = { error?: string };

const PAYMENT_NAMES = { terms: "milestone payments", emi: "EMI", both: "milestones + EMI" } as const;

export async function saveQuotationAction(_: QuoteFormState, fd: FormData): Promise<QuoteFormState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id")) || undefined;
  let raw: unknown;
  try {
    raw = JSON.parse(String(fd.get("data") ?? ""));
  } catch {
    return { error: "Something went wrong reading the form. Reload the page and try again." };
  }
  const res = await saveQuotation(raw, admin, id);
  if (!res.ok) return { error: res.error };

  const q = await quotationById(res.id);
  if (q) {
    const summary = `${q.client} — ${inr(computeQuote(q.data).grand)} (${PAYMENT_NAMES[q.data.payment]})`;
    if (id) await audit(admin, "quotation.edited", `Edited ${q.quoteNo} to version ${q.version}: ${res.changes}`, `quotation:${q.id}`);
    else await audit(admin, "quotation.created", `Created ${q.quoteNo} for ${summary}`, `quotation:${q.id}`);
  }
  revalidatePath("/referral/admin/quotations", "layout");
  redirect(`/referral/admin/quotations/${res.id}?saved=${id ? "edit" : "new"}`);
}

export async function setQuotationStatusAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = Number(fd.get("id"));
  const status = String(fd.get("status")) as QuoteStatus;
  const before = await setQuotationStatus(id, status, admin);
  if (before) {
    const label = QUOTE_STATUSES.find((s) => s.id === status)?.label ?? status;
    await audit(admin, "quotation.status", `Marked ${before.quoteNo} (${before.client}) as ${label}`, `quotation:${id}`);
  }
  revalidatePath("/referral/admin/quotations", "layout");
}

/* ── the signatures & stamps library ── */

export type MarkFormState = { error?: string; message?: string };
const MAX_MARK = 400 * 1024;

export async function addMarkAction(_: MarkFormState, fd: FormData): Promise<MarkFormState> {
  const admin = await requireAdmin();
  const kind = fd.get("kind") === "stamp" ? "stamp" : "signature";
  const name = String(fd.get("name") ?? "").trim();
  const file = fd.get("file");
  if (!name) return { error: "Give it a name, e.g. “Suprime – blue ink” or “GOBT seal”." };
  if (!(file instanceof File) || file.size === 0) return { error: "Choose the image." };
  if (file.type !== "image/png" && file.type !== "image/jpeg") return { error: "Use a PNG or JPG. A PNG with a transparent background looks best." };
  if (file.size > MAX_MARK) return { error: "That image is too large. Keep it under 400 KB." };
  const { addMark } = await import("@/lib/quotations/marks");
  const bytes = Buffer.from(await file.arrayBuffer());
  const id = await addMark(kind, name, `data:${file.type};base64,${bytes.toString("base64")}`, admin.name);
  await audit(admin, "quotation.mark_added", `Added a ${kind} “${name}” (${Math.round(file.size / 1024)} KB) to the library`, `mark:${id}`);
  revalidatePath("/referral/admin/quotations", "layout");
  return { message: `Saved. “${name}” can now be chosen on any quotation.` };
}

export async function setMarkHiddenAction(fd: FormData) {
  const admin = await requireAdmin();
  const { setMarkHidden } = await import("@/lib/quotations/marks");
  const hidden = fd.get("hidden") === "1";
  const name = await setMarkHidden(String(fd.get("id") ?? ""), hidden);
  if (name) await audit(admin, "quotation.mark_hidden", `${hidden ? "Hid" : "Showed again"} “${name}” in the signatures & stamps library`);
  revalidatePath("/referral/admin/quotations", "layout");
}
