import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/seo";
import { CERT_KINDS, kindOf, printDate } from "@/lib/certificates/config";
import { listCertificates } from "@/lib/certificates/store";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";
import "./certificates.css";

export const dynamic = "force-dynamic";

const TITLE = "Certificates — Verify a GOBT Certificate";
const DESCRIPTION =
  "Internship, training and work-completion certificates issued by GOBT (Group of Blooming Technicians). Search by name or certificate number, verify and download.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/certificates" },
  openGraph: { type: "website", locale: "en_IN", url: "/certificates", siteName: SITE.name, title: TITLE, description: DESCRIPTION },
};

export default async function CertificatesPage({ searchParams }: { searchParams: Promise<{ q?: string; type?: string }> }) {
  const { q = "", type = "" } = await searchParams;
  const certs = await listCertificates({ q, kind: type });
  const link = (t: string) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (t) p.set("type", t);
    const s = p.toString();
    return `/certificates${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="bg-layer" aria-hidden="true" />
      <Nav />
      <main id="main" className="sp ce">
        <header className="sp-hero wrap">
          <nav className="sp-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Certificates</span>
          </nav>
          <h1 className="sp-title">Certificates</h1>
          <p className="sp-lede">
            Every internship, training and work-completion certificate GOBT issues is listed here. Search by name or
            certificate number to check that it&apos;s genuine, and download your copy.
          </p>
        </header>

        <section className="sp-block wrap" aria-label="Find a certificate">
          <form className="ce-search" action="/certificates" role="search">
            <label htmlFor="ce-q" className="sr-only">
              Name or certificate number
            </label>
            <input id="ce-q" name="q" type="search" defaultValue={q} placeholder="Name or certificate no. (e.g. GOBT/C/0826/001)" autoComplete="off" />
            {type && <input type="hidden" name="type" value={type} />}
            <button className="btn btn-gold" type="submit">
              <span className="btn-label">Search</span>
            </button>
          </form>
          <div className="ce-kinds" role="group" aria-label="Certificate type">
            <Link href={link("")} className={!type ? "is-on" : ""} aria-current={!type ? "true" : undefined}>
              All
            </Link>
            {CERT_KINDS.map((k) => (
              <Link key={k.id} href={link(k.id)} className={type === k.id ? "is-on" : ""} aria-current={type === k.id ? "true" : undefined}>
                {k.label}
              </Link>
            ))}
          </div>

          {certs.length === 0 ? (
            <p className="ce-empty">
              {q ? (
                <>
                  No certificate matches “{q}”. Check the spelling or the certificate number, or write to us if you think
                  this is a mistake.
                </>
              ) : (
                "No certificates have been published yet."
              )}
            </p>
          ) : (
            <ul className="ce-grid">
              {certs.map((c) => (
                <li key={c.id}>
                  <Link href={`/certificates/${c.slug}`} className="ce-card">
                    <span className="ce-card-kind">{kindOf(c.kind).label}</span>
                    <span className="ce-card-name">{c.recipient}</span>
                    {c.role && <span className="ce-card-role">{c.role}</span>}
                    <span className="ce-card-meta">
                      <span>{c.certNo}</span>
                      <span>
                        {c.startDate && c.endDate ? `${printDate(c.startDate)} – ${printDate(c.endDate)}` : `Issued ${printDate(c.issuedOn)}`}
                      </span>
                    </span>
                    <span className="ce-card-cta">View &amp; download →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
