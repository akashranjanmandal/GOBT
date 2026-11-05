import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, OPEN_JOBS, applyMailto } from "@/lib/content";
import { SITE, jsonLd } from "@/lib/seo";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";
import { IconArrow } from "@/components/ui/icons";

const TITLE = "Careers — Jobs at a Deep-Tech Company in Kolkata";
const DESCRIPTION = `Join GOBT, a DPIIT-recognised deep-tech company in Kolkata. Open roles: ${OPEN_JOBS.map((j) => j.title).join(", ")}. Apply by email at ${CONTACT.careers}.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/careers" },
  openGraph: { type: "website", locale: "en_IN", url: "/careers", siteName: SITE.name, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function CareersPage() {
  const structured = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
      { "@type": "ListItem", position: 2, name: "Careers", item: `${SITE.url}/careers` },
    ],
  };

  return (
    <>
      <div className="bg-layer" aria-hidden="true" />
      <Nav />
      <main id="main" className="sp">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

        <header className="sp-hero wrap">
          <nav className="sp-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Careers</span>
          </nav>
          <h1 className="sp-title">Build deep-tech products with us</h1>
          <p className="sp-lede">
            GOBT is a small team building deep-tech products for real businesses. Here are the roles we&apos;re hiring for right now.
          </p>
          <div className="sp-ctas">
            <a href="#roles" className="btn btn-gold btn-lg">
              <span className="btn-label">See open roles</span>
              <span className="btn-arrow" aria-hidden="true">↓</span>
            </a>
          </div>
        </header>

        <section className="sp-block wrap" id="roles" aria-labelledby="cp-roles">
          <h2 className="sp-h2" id="cp-roles">
            Open roles
          </h2>
          <ul className="jobs">
            {OPEN_JOBS.map((job) => (
              <li key={job.id}>
                <details className="cp-role" id={job.id}>
                  <summary className="job">
                    <span className="job-title">{job.title}</span>
                    <span className="job-meta">
                      <span>{job.experience}</span>
                      <span>{job.type}</span>
                      <span>{job.location}</span>
                    </span>
                    <span className="job-arrow" aria-hidden="true">
                      <IconArrow />
                    </span>
                  </summary>
                  {/* static, trusted copy authored in lib/content */}
                  <div className="drawer-body" dangerouslySetInnerHTML={{ __html: job.description }} />
                  <div className="cp-role-apply">
                    <a className="btn btn-gold btn-lg" href={applyMailto(job.title)}>
                      <span className="btn-label">Apply by email</span>
                      <span className="btn-arrow" aria-hidden="true">↗</span>
                    </a>
                  </div>
                </details>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-block wrap" aria-labelledby="cp-how">
          <h2 className="sp-h2" id="cp-how">
            How to apply
          </h2>
          <div className="cp-apply">
            <p>
              We only accept applications by email, at <a href={`mailto:${CONTACT.careers}`}>{CONTACT.careers}</a>.
            </p>
            <ol>
              <li>Put the role you&apos;re applying for in the subject line.</li>
              <li>Attach your CV.</li>
              <li>Add a line or two on what you&apos;ve built.</li>
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
