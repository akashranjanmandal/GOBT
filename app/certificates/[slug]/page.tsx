import type { Metadata } from "next";
import Link from "next/link";
import { kindOf, printDate } from "@/lib/certificates/config";
import { certificateBySlug } from "@/lib/certificates/store";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";
import CopyLink from "@/components/certificates/CopyLink";
import "../certificates.css";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cert = await certificateBySlug((await params).slug);
  return {
    title: cert ? `${cert.recipient} — ${cert.title} (${cert.certNo})` : "Certificate not found",
    description: cert ? `Verify the ${kindOf(cert.kind).label.toLowerCase()} certificate ${cert.certNo} issued by GOBT to ${cert.recipient}.` : undefined,
    robots: { index: false, follow: true },
  };
}

export default async function CertificatePage({ params }: Props) {
  const { slug } = await params;
  const cert = await certificateBySlug(slug);

  return (
    <>
      <div className="bg-layer" aria-hidden="true" />
      <Nav />
      <main id="main" className="sp ce">
        <header className="sp-hero wrap ce-hero">
          <nav className="sp-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/certificates">Certificates</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{cert ? cert.certNo : "Not found"}</span>
          </nav>

          {!cert ? (
            <div className="ce-verdict is-bad" role="status">
              <span className="ce-verdict-icon" aria-hidden="true">✕</span>
              <div>
                <strong>No certificate with this number</strong>
                <p>
                  GOBT has not issued a certificate numbered “{slug}”. A certificate without a matching record here is not
                  genuine. <Link href="/certificates">Search all certificates</Link>.
                </p>
              </div>
            </div>
          ) : cert.status === "revoked" ? (
            <div className="ce-verdict is-bad" role="status">
              <span className="ce-verdict-icon" aria-hidden="true">!</span>
              <div>
                <strong>This certificate has been revoked</strong>
                <p>GOBT issued certificate {cert.certNo} but has since withdrawn it. It is no longer valid.</p>
              </div>
            </div>
          ) : (
            <div className="ce-verdict" role="status">
              <span className="ce-verdict-icon" aria-hidden="true">✓</span>
              <div>
                <strong>Verified — issued by GOBT</strong>
                <p>
                  Certificate {cert.certNo} is genuine and was issued to {cert.recipient} by Group of Blooming Technicians.
                </p>
              </div>
            </div>
          )}
        </header>

        {cert && (
          <section className="sp-block wrap ce-detail" aria-label="Certificate">
            <figure className="ce-figure">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/certificates/${cert.slug}/image?v=${cert.updatedAt}`}
                alt={`${cert.title} awarded to ${cert.recipient}, certificate number ${cert.certNo}`}
                width={2096}
                height={1478}
              />
            </figure>
            <aside className="ce-side">
              <dl className="ce-facts">
                <div>
                  <dt>Awarded to</dt>
                  <dd>{cert.recipient}</dd>
                </div>
                <div>
                  <dt>Type</dt>
                  <dd>{kindOf(cert.kind).label}</dd>
                </div>
                {cert.role && (
                  <div>
                    <dt>{kindOf(cert.kind).roleLabel.replace(" (optional)", "")}</dt>
                    <dd>{cert.role}</dd>
                  </div>
                )}
                {cert.startDate && (
                  <div>
                    <dt>Period</dt>
                    <dd>
                      {printDate(cert.startDate)}
                      {cert.endDate && ` to ${printDate(cert.endDate)}`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt>Issued on</dt>
                  <dd>{printDate(cert.issuedOn)}</dd>
                </div>
                <div>
                  <dt>Certificate no.</dt>
                  <dd className="ce-mono">{cert.certNo}</dd>
                </div>
              </dl>
              {cert.status === "valid" && (
                <div className="ce-actions">
                  <a className="btn btn-gold" href={`/certificates/${cert.slug}/pdf?download=1&v=${cert.updatedAt}`}>
                    <span className="btn-label">Download PDF</span>
                    <span className="btn-arrow" aria-hidden="true">↓</span>
                  </a>
                  <a className="btn btn-ghost" href={`/certificates/${cert.slug}/image?download=1&v=${cert.updatedAt}`}>
                    <span className="btn-label">Download image</span>
                    <span className="btn-arrow" aria-hidden="true">↓</span>
                  </a>
                  <CopyLink path={`/certificates/${cert.slug}`} />
                </div>
              )}
            </aside>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
