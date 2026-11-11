"use server";

import { revalidatePath } from "next/cache";
import { changeAdminPassword, requireAdmin } from "@/lib/referral/auth";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/referral/config";
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
  refresh();
}

export async function recordPaymentAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const amount = Number(text(fd, "amount").replace(/[^\d.]/g, ""));
  const res = await adminRecordPayment(Number(fd.get("id")), amount, admin.name);
  if (!res.ok) return { error: res.error };
  refresh();
  return { ok: true, message: "Added" };
}

export async function setCommissionAction(fd: FormData) {
  const admin = await requireAdmin();
  const status = text(fd, "status");
  if (status !== "paid" && status !== "reversed" && status !== "pending") return;
  await adminSetCommission(Number(fd.get("id")), status, admin.name);
  refresh();
}

export async function setRedemptionAction(fd: FormData) {
  const admin = await requireAdmin();
  const status = text(fd, "status");
  if (status !== "paid" && status !== "rejected") return;
  await adminSetRedemption(Number(fd.get("id")), status, admin.name);
  refresh();
}

export async function setBlockedAction(fd: FormData) {
  const admin = await requireAdmin();
  await adminSetBlocked(Number(fd.get("id")), text(fd, "blocked") === "1", admin.name);
  refresh();
}

export async function changePasswordAction(_: AdminFormState, fd: FormData): Promise<AdminFormState> {
  const admin = await requireAdmin();
  const next = text(fd, "next");
  if (next !== text(fd, "confirm")) return { error: "The two new passwords don't match." };
  const res = await changeAdminPassword(admin, text(fd, "current"), next);
  if (!res.ok) return { error: res.error };
  return { ok: true, message: "Password changed. Use it next time you log in." };
}
