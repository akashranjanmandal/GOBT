import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/referral/auth";
import { certificateById } from "@/lib/certificates/store";
import { PageHead } from "@/components/referral/adminui";
import CertificateForm from "@/components/certificates/CertificateForm";

export const metadata: Metadata = { title: "Edit certificate" };

export default async function EditCertificate({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const cert = await certificateById(Number((await params).id));
  if (!cert) notFound();

  return (
    <>
      <PageHead
        title={`Edit ${cert.certNo}`}
        help={
          <>
            {cert.recipient} · {cert.status === "revoked" ? "Revoked" : "Valid"} ·{" "}
            <a href={`/certificates/${cert.slug}`} target="_blank" rel="noopener noreferrer">
              public page ↗
            </a>
          </>
        }
      >
        <Link href="/referral/admin/certificates" className="ad-btn">
          ← All certificates
        </Link>
      </PageHead>
      <CertificateForm
        id={cert.id}
        certNoHint={cert.certNo}
        initial={{
          kind: cert.kind,
          title: cert.title,
          recipient: cert.recipient,
          pronoun: cert.pronoun,
          role: cert.role,
          startDate: cert.startDate,
          endDate: cert.endDate,
          skills: cert.skills,
          body: cert.body,
          note: cert.note,
          issuedOn: cert.issuedOn,
          certNo: cert.certNo,
        }}
      />
    </>
  );
}
