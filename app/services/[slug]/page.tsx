import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { COMPARE_ROWS, PROCESS_STEPS, WORKS } from "@/lib/content";
import { SERVICE_PAGES, SITE, faqLd, jsonLd, servicePath, workPath } from "@/lib/seo";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return SERVICE_PAGES.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = SERVICE_PAGES.find((s) => s.slug === slug);
  if (!page) return {};
  const url = servicePath(page.slug);
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    keywords: page.keywords,
    alternates: { canonical: url },
    openGraph: { type: "website", locale: "en_IN", url, siteName: SITE.name, title: page.metaTitle, description: page.metaDescription },
    twitter: { card: "summary_large_image", title: page.metaTitle, description: page.metaDescription },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const page = SERVICE_PAGES.find((s) => s.slug === slug);
  if (!page) notFound();

  const url = `${SITE.url}${servicePath(page.slug)}`;
  const work = page.work.map((id) => WORKS.find((w) => w.id === id)).filter((w) => w !== undefined);
  const others = SERVICE_PAGES.filter((s) => s.slug !== page.slug);

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.name,
      serviceType: page.name,
      description: page.metaDescription,
      url,
      provider: { "@id": `${SITE.url}/#organization` },
      areaServed: { "@type": "Country", name: "India" },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Services", item: `${SITE.url}/#services` },
        { "@type": "ListItem", position: 3, name: page.name, item: url },
      ],
    },
    faqLd(page.faqs),
  ];

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
            <Link href="/#services">Services</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{page.name}</span>
          </nav>
          <h1 className="sp-title">{page.h1}</h1>
          <p className="sp-lede">{page.lede}</p>
          <div className="sp-ctas">
            <Link href="/#contact" className="btn btn-gold btn-lg">
              <span className="btn-label">Start a project</span>
              <span className="btn-arrow" aria-hidden="true">↗</span>
            </Link>
            <Link href="/#estimate" className="btn btn-ghost btn-lg">
              <span className="btn-label">Estimate your project</span>
              <span className="btn-arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </header>

        <section className="sp-block wrap sp-overview">
          {page.overview.map((p) => (
            <p key={p.slice(0, 24)}>{p}</p>
          ))}
        </section>

        <section className="sp-block wrap" aria-labelledby="sp-offer">
          <h2 className="sp-h2" id="sp-offer">
            What we build
          </h2>
          <ul className="sp-grid">
            {page.offerings.map((o) => (
              <li className="sp-card" key={o.t}>
                <h3>{o.t}</h3>
                <p>{o.d}</p>
              </li>
            ))}
          </ul>
          <ul className="sp-stack" aria-label="Technologies">
            {page.stack.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </section>

        {work.length > 0 && (
          <section className="sp-block wrap" aria-labelledby="sp-work">
            <h2 className="sp-h2" id="sp-work">
              Recent work
            </h2>
            <ul className="sp-work">
              {work.map((w) => (
                <li key={w.id}>
                  <div className="sp-work-img">
                    <Image src={w.image} alt={`${w.title} — ${w.tag} by GOBT`} fill sizes="(min-width: 900px) 33vw, 100vw" />
                  </div>
                  <span className="sp-work-tag">{w.tag}</span>
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                  <Link href={workPath(w.title)}>Read the case study →</Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="sp-block wrap" aria-labelledby="sp-how">
          <h2 className="sp-h2" id="sp-how">
            How we work
          </h2>
          <ol className="sp-steps">
            {PROCESS_STEPS.map((s, i) => (
              <li key={s.title}>
                <span className="sp-step-n">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </li>
            ))}
          </ol>
          <ul className="sp-why">
            {COMPARE_ROWS.map((r) => (
              <li key={r.feature}>{r.feature}</li>
            ))}
          </ul>
        </section>

        <section className="sp-block wrap" aria-labelledby="sp-faq">
          <h2 className="sp-h2" id="sp-faq">
            Frequently asked questions
          </h2>
          <div className="faq">
            {page.faqs.map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="sp-block wrap" aria-labelledby="sp-more">
          <h2 className="sp-h2" id="sp-more">
            More services
          </h2>
          <ul className="sp-links">
            {others.map((s) => (
              <li key={s.slug}>
                <Link href={servicePath(s.slug)}>{s.name} →</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-cta wrap">
          <h2 className="sp-h2">Ready to start your {page.name.toLowerCase()} project?</h2>
          <p>Tell us what you&apos;re building — we reply within 24 hours with next steps.</p>
          <Link href="/#contact" className="btn btn-gold btn-lg">
            <span className="btn-label">Talk to GOBT</span>
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
