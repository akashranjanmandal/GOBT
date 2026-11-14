"use server";

import { revalidatePath } from "next/cache";
import { changeAdminPassword, requireAdmin } from "@/lib/referral/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/referral/config";
import { audit } from "@/lib/referral/audit";
import {
  adminRecordPayment,
  adminSetBlocked,
  adminSetCommission,
  adminSetRedemption,
  adminSetStatus,
} from "@/lib/referral/data";

/* Actions for the admin panel. Every one re-checks the admin's login. */

export type AdminFormState = { ok?: boolean; error?: string; message?: string };

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "");
const refresh = () => revalidatePath("/referral/admin", "layout");

/* login and logout live in app/api/referral/admin/... (plain responses) */

export async function setLeadStatusAction(fd: FormData) {
  const admin = await requireAdmin();
  const status = text(fd, "status") as LeadStatus;
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return;
  await adminSetStatus(Number(fd.get("id")), status, text(fd, "note"), admin.name);
  await audit(admin, "lead.status", `Set lead #${Number(fd.get("id"))} to “${status}”${text(fd, "note") ? ` (note: ${text(fd, "note").slice(0, 200)})` : ""}`, `lead:${Number(fd.get("id"))}`);
  refresh();
}

export async function recordPaymentAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const amount = Number(text(fd, "amount").replace(/[^\d.]/g, ""));
  const res = await adminRecordPayment(Number(fd.get("id")), amount, admin.name);
  if (!res.ok) return { error: res.error };
  await audit(admin, "money.payment", `Recorded a client payment of ₹${amount.toLocaleString("en-IN")} on lead #${Number(fd.get("id"))}`, `lead:${Number(fd.get("id"))}`);
  refresh();
  return { ok: true, message: "Added" };
}

export async function setCommissionAction(fd: FormData) {
  const admin = await requireAdmin();
  const status = text(fd, "status");
  if (status !== "paid" && status !== "reversed" && status !== "pending") return;
  await adminSetCommission(Number(fd.get("id")), status, admin.name);
  await audit(admin, "money.commission", `Marked commission #${Number(fd.get("id"))} as ${status}`, `commission:${Number(fd.get("id"))}`);
  refresh();
}

export async function setRedemptionAction(fd: FormData) {
  const admin = await requireAdmin();
  const status = text(fd, "status");
  if (status !== "paid" && status !== "rejected") return;
  await adminSetRedemption(Number(fd.get("id")), status, admin.name);
  await audit(admin, "money.redemption", `Marked points redemption #${Number(fd.get("id"))} as ${status}`, `redemption:${Number(fd.get("id"))}`);
  refresh();
}

export async function setBlockedAction(fd: FormData) {
  const admin = await requireAdmin();
  await adminSetBlocked(Number(fd.get("id")), text(fd, "blocked") === "1", admin.name);
  await audit(admin, "referrer.blocked", `${text(fd, "blocked") === "1" ? "Blocked" : "Unblocked"} referrer #${Number(fd.get("id"))}`, `referrer:${Number(fd.get("id"))}`);
  refresh();
}

export async function changePasswordAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const next = text(fd, "next");
  if (next !== text(fd, "confirm")) return { error: "The two new passwords don't match." };
  const res = await changeAdminPassword(admin, text(fd, "current"), next);
  if (!res.ok) {
    await audit(admin, "account.password_failed", `${admin.name} tried to change their password: ${res.error}`);
    return { error: res.error };
  }
  await audit(admin, "account.password", `${admin.name} changed their password`);
  return { ok: true, message: "Password changed. Use it next time you log in." };
}
