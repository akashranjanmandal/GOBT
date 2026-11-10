"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/referral/config";
import { logout, requireAdmin, requireUser, sendLoginCode, verifyLoginCode } from "@/lib/referral/auth";
import {
  adminRecordPayment,
  adminSetCommission,
  adminSetRedemption,
  adminSetStatus,
  requestRedeem,
  submitLead,
  updateProfile,
} from "@/lib/referral/data";

export type FormState = { ok?: boolean; error?: string; field?: string; message?: string; email?: string; step?: "email" | "code" };

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "");

/* ── login ── */

export async function sendCodeAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").trim().toLowerCase();
  const res = await sendLoginCode(email);
  if (!res.ok) return { step: "email", error: res.error, email };
  return { step: "code", email, message: `We've emailed a 6-digit code to ${email}.` };
}

export async function verifyCodeAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email");
  const res = await verifyLoginCode(email, text(fd, "code"));
  if (!res.ok) return { step: "code", email, error: res.error };
  redirect("/referral/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/referral");
}

/* ── referrer ── */

export async function saveProfileAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  const res = await updateProfile(user, {
    name: text(fd, "name"),
    phone: text(fd, "phone"),
    upi: text(fd, "upi"),
    agree: fd.get("agree") === "on",
  });
  if (!res.ok) return { error: res.error };
  revalidatePath("/referral/dashboard");
  return { ok: true, message: "Saved." };
}

export async function submitLeadAction(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser();
  if (!user.agreedAt) return { error: "Complete your profile first." };
  const res = await submitLead(user, {
    name: text(fd, "name"),
    phone: text(fd, "phone"),
    email: text(fd, "email"),
    company: text(fd, "company"),
    need: text(fd, "need"),
    consent: fd.get("consent") === "on",
  });
  if (!res.ok) return { error: res.error, field: res.field };
  revalidatePath("/referral/dashboard");
  return { ok: true, message: "Lead submitted! We'll reach out to them and keep you posted here." };
}

export async function redeemAction(): Promise<FormState> {
  const user = await requireUser();
  const res = await requestRedeem(user);
  if (!res.ok) return { error: res.error };
  revalidatePath("/referral/dashboard");
  return { ok: true, message: `Redemption requested for ${res.points} points. We'll pay it to your UPI ID.` };
}

/* ── admin ── */

export async function setLeadStatusAction(fd: FormData) {
  await requireAdmin();
  const status = text(fd, "status") as LeadStatus;
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) return;
  await adminSetStatus(Number(fd.get("id")), status, text(fd, "note"));
  revalidatePath("/referral/admin");
}

export async function recordPaymentAction(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const amount = Number(text(fd, "amount").replace(/[^\d.]/g, ""));
  const res = await adminRecordPayment(Number(fd.get("id")), amount);
  if (!res.ok) return { error: res.error };
  revalidatePath("/referral/admin");
  return { ok: true, message: "Payment recorded; commission added as pending." };
}

export async function setCommissionAction(fd: FormData) {
  await requireAdmin();
  const status = text(fd, "status");
  if (status !== "paid" && status !== "reversed" && status !== "pending") return;
  await adminSetCommission(Number(fd.get("id")), status);
  revalidatePath("/referral/admin");
}

export async function setRedemptionAction(fd: FormData) {
  await requireAdmin();
  const status = text(fd, "status");
  if (status !== "paid" && status !== "rejected") return;
  await adminSetRedemption(Number(fd.get("id")), status);
  revalidatePath("/referral/admin");
}
