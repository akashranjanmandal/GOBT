"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";
import type { CertFields } from "@/lib/certificates/config";
import { IMAGE_SLOTS, saveCertificate, setCertImage, setCertificateStatus, type ImageSlot } from "@/lib/certificates/store";

export type CertFormState = { error?: string; message?: string };

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "");

const fieldsFrom = (fd: FormData): CertFields => ({
  kind: text(fd, "kind"),
  title: text(fd, "title"),
  recipient: text(fd, "recipient"),
  pronoun: text(fd, "pronoun"),
  role: text(fd, "role"),
  startDate: text(fd, "startDate"),
  endDate: text(fd, "endDate"),
  skills: text(fd, "skills"),
  body: text(fd, "body"),
  note: text(fd, "note"),
  issuedOn: text(fd, "issuedOn"),
  certNo: text(fd, "certNo"),
});

const refresh = () => {
  revalidatePath("/referral/admin/certificates", "layout");
  revalidatePath("/certificates", "layout");
};

export async function saveCertificateAction(_: CertFormState, fd: FormData): Promise<CertFormState> {
  const admin = await requireAdmin();
  const id = Number(fd.get("id")) || undefined;
  const res = await saveCertificate(fieldsFrom(fd), admin.name, id);
  if (!res.ok) return { error: res.error };
  await audit(admin, id ? "certificate.edited" : "certificate.issued", `${id ? "Edited" : "Issued"} certificate ${res.slug} for ${text(fd, "recipient").trim()}`, `certificate:${res.id}`);
  refresh();
  redirect(`/referral/admin/certificates?saved=${encodeURIComponent(res.slug)}`);
}

export async function setCertificateStatusAction(fd: FormData) {
  const admin = await requireAdmin();
  const status = text(fd, "status");
  if (status !== "valid" && status !== "revoked") return;
  await setCertificateStatus(Number(fd.get("id")), status, admin.name);
  await audit(admin, "certificate.status", `${status === "revoked" ? "Revoked" : "Restored"} certificate #${Number(fd.get("id"))}`, `certificate:${Number(fd.get("id"))}`);
  refresh();
}

const MAX_IMAGE = 400 * 1024;

/* uploads a director's signature or the top-right logo */
export async function saveCertImageAction(_: CertFormState, fd: FormData): Promise<CertFormState> {
  const admin = await requireAdmin();
  const slot = text(fd, "slot") as ImageSlot;
  if (!IMAGE_SLOTS.includes(slot)) return { error: "Something went wrong. Reload the page and try again." };
  const what = slot === "badge" ? "logo" : "signature";
  if (text(fd, "remove") === "1") {
    await setCertImage(slot, null, admin.name);
    await audit(admin, "certificate.image", `Reset the certificate ${what} (${slot}) to the original`);
    refresh();
    return { message: "Back to the original from GOBT's certificate." };
  }
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: `Choose an image of the ${what}.` };
  if (file.type !== "image/png" && file.type !== "image/jpeg") return { error: "Use a PNG or JPG image (PNG with a transparent background looks best)." };
  if (file.size > MAX_IMAGE) return { error: "That image is too large. Keep it under 400 KB." };
  const bytes = Buffer.from(await file.arrayBuffer());
  await setCertImage(slot, `data:${file.type};base64,${bytes.toString("base64")}`, admin.name);
  await audit(admin, "certificate.image", `Uploaded a new certificate ${what} (${slot}), ${Math.round(file.size / 1024)} KB`);
  refresh();
  return { message: `Saved. Every certificate now shows this ${what}.` };
}
