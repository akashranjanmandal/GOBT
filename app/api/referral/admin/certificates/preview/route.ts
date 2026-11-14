import { currentAdmin } from "@/lib/referral/auth";
import { slugOf, type CertFields } from "@/lib/certificates/config";
import { certificateById, cleanFields, getCertImages, nextCertNo } from "@/lib/certificates/store";
import { renderCertificate } from "@/lib/certificates/render";
import { verifyUrl } from "@/lib/certificates/output";

export const dynamic = "force-dynamic";

/* draws the certificate being typed in the admin form, marked PREVIEW */
export async function POST(req: Request) {
  if (!(await currentAdmin())) return new Response("Not logged in", { status: 401 });
  const fd = await req.formData();
  const t = (k: string) => String(fd.get(k) ?? "");
  const f: CertFields = {
    kind: t("kind"),
    title: t("title"),
    recipient: t("recipient"),
    pronoun: t("pronoun"),
    role: t("role"),
    startDate: t("startDate"),
    endDate: t("endDate"),
    skills: t("skills"),
    body: t("body"),
    note: t("note"),
    issuedOn: t("issuedOn"),
    certNo: t("certNo"),
  };

  const id = Number(t("id")) || 0;
  const existing = id ? await certificateById(id) : null;
  const clean = cleanFields(f);
  const issued = /^\d{4}-\d{2}-\d{2}$/.test(f.issuedOn) ? f.issuedOn : new Date().toISOString().slice(0, 10);
  const certNo = (clean.ok && clean.value.certNo) || existing?.certNo || (await nextCertNo(issued));

  const res = await renderCertificate({
    certNo,
    title: f.title.trim() || "Certificate of Completion",
    body: f.body.trim() || "The certificate text appears here.",
    note: f.note.trim(),
    verifyUrl: verifyUrl(slugOf(certNo)),
    ...(await getCertImages()),
    preview: true,
  });
  return new Response(res.body, { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
}
