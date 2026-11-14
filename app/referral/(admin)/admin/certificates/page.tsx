import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { CERT_KINDS, SIGNATORIES, kindOf, printDate } from "@/lib/certificates/config";
import { getCertImages, listCertificates } from "@/lib/certificates/store";
import { PageHead, StatusChip } from "@/components/referral/adminui";
import { Card, Empty, Stat } from "@/components/referral/ui";
import CertImageForm from "@/components/certificates/CertImageForm";
import { defaultCertImages } from "@/lib/certificates/render";
import { setCertificateStatusAction } from "./actions";

export const metadata: Metadata = { title: "Certificates" };

export default async function Certificates({ searchParams }: { searchParams: Promise<{ q?: string; saved?: string }> }) {
  await requireAdmin();
  const { q = "", saved } = await searchParams;
  const [all, rows, images] = await Promise.all([listCertificates({ includeRevoked: true }), listCertificates({ q, includeRevoked: true }), getCertImages()]);
  const defaults = defaultCertImages();
  const savedCert = saved ? all.find((c) => c.slug === saved) : null;

  return (
    <>
      <PageHead
        title="Certificates"
        help="Issue internship, training, work-completion or custom certificates. Each one gets a number, a QR code and a public page at gobt.in/certificates where anyone can verify and download it."
      >
        <Link href="/referral/admin/certificates/new" className="ad-btn ad-btn-primary">
          + New certificate
        </Link>
      </PageHead>

      {savedCert && (
        <p className="ad-ok cf-saved" role="status">
          Saved {savedCert.certNo} for {savedCert.recipient}.{" "}
          <a href={`/certificates/${savedCert.slug}`} target="_blank" rel="noopener noreferrer">
            Open its public page ↗
          </a>
        </p>
      )}

      <div className="ad-stats">
        <Stat label="Issued" value={all.filter((c) => c.status === "valid").length} hint="Valid certificates" tone="gold" />
        {CERT_KINDS.map((k) => (
          <Stat key={k.id} label={k.label} value={all.filter((c) => c.kind === k.id && c.status === "valid").length} tone="plain" />
        ))}
      </div>

      <Card
        title="All certificates"
        action={
          <form className="ad-inline" action="/referral/admin/certificates">
            <input name="q" defaultValue={q} placeholder="Name or number" aria-label="Search certificates" />
            <button className="ad-btn ad-btn-sm">Search</button>
          </form>
        }
      >
        {rows.length === 0 ? (
          <Empty>{q ? `Nothing matches “${q}”.` : "No certificates yet. Press “New certificate” to issue the first one."}</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Certificate</th>
                <th>Awarded to</th>
                <th>Type</th>
                <th>Issued</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td data-label="Certificate">
                    <b className="cf-mono">{c.certNo}</b>
                    <small>{c.title}</small>
                  </td>
                  <td data-label="Awarded to">
                    <b>{c.recipient}</b>
                    {c.role && <small>{c.role}</small>}
                  </td>
                  <td data-label="Type">{kindOf(c.kind).label}</td>
                  <td data-label="Issued">
                    {printDate(c.issuedOn)}
                    <small>by {c.createdBy}</small>
                  </td>
                  <td data-label="Status">
                    <StatusChip status={c.status} label={c.status === "valid" ? "Valid" : "Revoked"} />
                  </td>
                  <td data-label="Actions">
                    <div className="ad-inline">
                      <Link className="ad-btn ad-btn-sm" href={`/referral/admin/certificates/${c.id}`}>
                        Edit
                      </Link>
                      <a className="ad-btn ad-btn-sm" href={`/certificates/${c.slug}`} target="_blank" rel="noopener noreferrer">
                        View
                      </a>
                      <a className="ad-btn ad-btn-sm" href={`/certificates/${c.slug}/pdf?download=1&v=${c.updatedAt}`}>
                        PDF
                      </a>
                      <form action={setCertificateStatusAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <input type="hidden" name="status" value={c.status === "valid" ? "revoked" : "valid"} />
                        <button className={`ad-btn ad-btn-sm${c.status === "valid" ? " ad-btn-danger" : ""}`}>
                          {c.status === "valid" ? "Revoke" : "Restore"}
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card
        title="Signatures & logo"
        help="Every certificate uses these. They start as the ones on GOBT's original certificate; upload a PNG (transparent background works best) to replace one, on every certificate old and new."
      >
        <div className="cf-sigs">
          {SIGNATORIES.map((s, i) => (
            <CertImageForm
              key={s.name}
              slot={String(i) as "0" | "1"}
              label={`${s.name} — signature`}
              current={images.signatures[i]}
              fallback={defaults.signatures[i]}
            />
          ))}
          <CertImageForm
            slot="badge"
            label="Top-right logo (e.g. DPIIT / Startup India)"
            current={images.badge}
            fallback={defaults.badge}
          />
        </div>
      </Card>
    </>
  );
}
