import "server-only";
import { SITE } from "@/lib/seo";
import { ORG, kindOf } from "./config";
import { getCertImages, type Certificate } from "./store";
import type { RenderInput } from "./render";

export const verifyUrl = (slug: string) => `${SITE.url}/certificates/${slug}`;

export async function renderInputFor(cert: Certificate): Promise<RenderInput> {
  return {
    certNo: cert.certNo,
    title: cert.title,
    body: cert.body,
    note: cert.note,
    verifyUrl: verifyUrl(cert.slug),
    ...(await getCertImages()),
    revoked: cert.status === "revoked",
  };
}

/* "Jhimi Thakur" + internship → "Jhimi-Thakur-Internship-Certificate-GOBT-C-0826-001.pdf" */
export function fileName(cert: Certificate, ext: "pdf" | "png") {
  const name = cert.recipient.replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "") || "Certificate";
  return `${name}-${kindOf(cert.kind).label.replace(/\s+/g, "-")}-Certificate-${cert.slug}.${ext}`;
}

export const pdfMeta = (cert: Certificate) => ({ title: `${cert.title} — ${cert.recipient} (${cert.certNo})`, author: ORG });
