import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CONTACT, TESTIMONIALS, WORKS } from "@/lib/content";
import { SERVICE_PAGES, SITE, faqLd, jsonLd, servicePath, workPath } from "@/lib/seo";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";

const TITLE = "Software, Web & App Development Company in Kolkata";
const DESCRIPTION =
  "GOBT is a DPIIT-recognised software company in Kolkata building websites, mobile apps, custom software and AI for Kolkata and West Bengal businesses. Meet us in person.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "software company in Kolkata",
    "web development company in Kolkata",
    "app development company in Kolkata",
    "website design Kolkata",
    "IT company Kolkata",
    "digital transformation Kolkata",
  ],
  alternates: { canonical: "/kolkata" },
  openGraph: { type: "website", locale: "en_IN", url: "/kolkata", siteName: SITE.name, title: TITLE, description: DESCRIPTION },
};

const FAQS = [
  {
    q: "Can we meet your team in Kolkata?",
    a: "Yes. GOBT is based in Kolkata, so we can meet in person for discovery workshops, design reviews and launch — and keep the weekly previews online in between.",
  },
  {
    q: "Which Kolkata businesses have you worked with?",
    a: "Our Kolkata clients include AGILE Engineering, a civil and mechanical engineering consultancy, and RKMVVM, an educational institution — both through complete digital transformation projects.",
  },
  {
    q: "Do you build Bengali-language websites and apps?",
    a: "Yes. We can build multilingual sites and apps with Bengali, Hindi and English content, with proper fonts and SEO for each language.",
  },
  {
    q: "How much does a website cost in Kolkata?",
    a: "It depends on scope. Use the estimator on our homepage for a starting timeline, then we send a fixed written quote after a short call.",
  },
];

const local = (name: string) => name.split(" ")[0].toLowerCase();

export default function Kolkata() {
  const quotes = TESTIMONIALS.filter((t) => t.role.includes("Kolkata"));
  const work = WORKS.filter((w) => quotes.some((q) => local(q.name) === local(w.title)));
  const url = `${SITE.url}/kolkata`;

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "ProfessionalService",
      "@id": `${url}#business`,
      name: `${SITE.name} — Kolkata`,
      parentOrganization: { "@id": `${SITE.url}/#organization` },
      url,
      email: SITE.email,
      telephone: SITE.phone,
      address: { "@type": "PostalAddress", addressLocality: SITE.city, addressRegion: SITE.region, addressCountry: SITE.country },
      areaServed: [
        { "@type": "City", name: "Kolkata" },
        { "@type": "State", name: "West Bengal" },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Kolkata", item: url },
      ],
    },
    faqLd(FAQS),
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
            <span aria-current="page">Kolkata</span>
          </nav>
          <h1 className="sp-title">Software, web &amp; app development in Kolkata</h1>
          <p className="sp-lede">
            GOBT is a Kolkata-born, DPIIT-recognised deep-tech team. We build websites, mobile apps, custom software and AI for
            businesses in Kolkata and across West Bengal — and we&apos;re close enough to sit at your table.
          </p>
          <div className="sp-ctas">
            <Link href="/#contact" className="btn btn-gold btn-lg">
              <span className="btn-label">Meet us in Kolkata</span>
              <span className="btn-arrow" aria-hidden="true">↗</span>
            </Link>
            <a href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">
              <span className="btn-label">Message on WhatsApp</span>
            </a>
          </div>
        </header>

        <section className="sp-block wrap sp-overview">
          <p>
            Working with a local team means discovery workshops in the same room, faster decisions and someone accountable
            within reach. You still get the same process we use for clients across India: weekly previews, direct access to the
            engineers, and code you own.
          </p>
          <p>
            Our Kolkata work spans engineering consultancies and educational institutions — corporate websites, student
            portals and full digital transformation, built to rank for the searches your customers make in the city.
          </p>
        </section>

        {quotes.length > 0 && (
          <section className="sp-block wrap" aria-labelledby="k-clients">
            <h2 className="sp-h2" id="k-clients">
              Kolkata clients
            </h2>
            {quotes.map((q) => (
              <figure className="cs-quote" key={q.name}>
                <blockquote>“{q.text}”</blockquote>
                <figcaption>
                  {q.name} · {q.role}
                </figcaption>
              </figure>
            ))}
          </section>
        )}

        {work.length > 0 && (
          <section className="sp-block wrap" aria-labelledby="k-work">
            <h2 className="sp-h2" id="k-work">
              Built in Kolkata
            </h2>
            <ul className="sp-work">
              {work.map((w) => (
                <li key={w.id}>
                  <Link href={workPath(w.title)} className="cs-card">
                    <div className="sp-work-img">
                      <Image src={w.image} alt={`${w.title} — ${w.tag} by GOBT, Kolkata`} fill sizes="(min-width: 900px) 33vw, 100vw" />
                    </div>
                    <span className="sp-work-tag">{w.tag}</span>
                    <h3>{w.title}</h3>
                    <p>{w.desc}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="sp-block wrap" aria-labelledby="k-services">
          <h2 className="sp-h2" id="k-services">
            What we build for Kolkata businesses
          </h2>
          <ul className="sp-links">
            {SERVICE_PAGES.map((s) => (
              <li key={s.slug}>
                <Link href={servicePath(s.slug)}>{s.name} →</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-block wrap" aria-labelledby="k-faq">
          <h2 className="sp-h2" id="k-faq">
            Frequently asked questions
          </h2>
          <div className="faq">
            {FAQS.map((f) => (
              <details className="faq-item" key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="sp-cta wrap">
          <h2 className="sp-h2">Building something in Kolkata?</h2>
          <p>Tell us about it — we reply within 24 hours and can meet you in person.</p>
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
