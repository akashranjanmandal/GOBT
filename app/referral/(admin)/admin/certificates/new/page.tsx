import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { CERT_KINDS, kindOf, templateText, type CertFields } from "@/lib/certificates/config";
import { nextCertNo } from "@/lib/certificates/store";
import { PageHead } from "@/components/referral/adminui";
import CertificateForm from "@/components/certificates/CertificateForm";

export const metadata: Metadata = { title: "New certificate" };

/* today's date in India */
const todayIST = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

export default async function NewCertificate({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireAdmin();
  const { type } = await searchParams;
  const kind = CERT_KINDS.some((k) => k.id === type) ? type! : "internship";
  const issuedOn = todayIST();
  const base: CertFields = {
    kind,
    title: kindOf(kind).title,
    recipient: "",
    pronoun: "she",
    role: "",
    startDate: "",
    endDate: "",
    skills: "",
    body: "",
    note: "",
    issuedOn,
    certNo: "",
  };
  const initial = { ...base, ...templateText(base) };

  return (
    <>
      <PageHead title="New certificate" help="Fill in the details. The text is written for you from GOBT's template, and you can change any of it.">
        <Link href="/referral/admin/certificates" className="ad-btn">
          ← All certificates
        </Link>
      </PageHead>
      <CertificateForm initial={initial} certNoHint={`Automatic: ${await nextCertNo(issuedOn)}`} />
    </>
  );
}
