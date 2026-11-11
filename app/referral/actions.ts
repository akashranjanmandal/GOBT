"use server";

import { revalidatePath } from "next/cache";
import { requireUser, sendLoginCode } from "@/lib/referral/auth";
import { requestRedeem, submitLead, updateProfile } from "@/lib/referral/data";

/* Actions for referrers (the public side of the programme) */

export type FormState = { ok?: boolean; error?: string; field?: string; message?: string; email?: string; step?: "email" | "code" };

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "");

export async function sendCodeAction(_: FormState, fd: FormData): Promise<FormState> {
  const email = text(fd, "email").trim().toLowerCase();
  const res = await sendLoginCode(email);
  if (!res.ok) return { step: "email", error: res.error, email };
  return { step: "code", email, message: `We've emailed a 6-digit code to ${email}.` };
}

/* checking the code, and logging out, live in app/api/referral/... (plain responses) */

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
  return { ok: true, message: "Referral submitted! We'll contact them and you can follow every step in “My referrals”." };
}

export async function redeemAction(): Promise<FormState> {
  const user = await requireUser();
  const res = await requestRedeem(user);
  if (!res.ok) return { error: res.error };
  revalidatePath("/referral/dashboard");
  return { ok: true, message: `Redemption requested for ${res.points} points. We'll pay it to your UPI ID.` };
}
