import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CLIENTS, TESTIMONIALS, WORKS } from "@/lib/content";
import { SITE, jsonLd, serviceForTag, servicePath, workPath, workSlug } from "@/lib/seo";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";

type Props = { params: Promise<{ slug: string }> };

const findWork = (slug: string) => WORKS.find((w) => workSlug(w.title) === slug);
/* "Gharkamali App" belongs to the Gharkamali client, "PizzaHap Team" testimonial to PizzaHap */
const key = (s: string) => s.split(" ")[0].toLowerCase();

export function generateStaticParams() {
  return WORKS.map((w) => ({ slug: workSlug(w.title) }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const work = findWork(slug);
  if (!work) return {};
  const title = `${work.title} — ${work.tag} Case Study`;
  const description = `${work.desc} Built by GOBT, a software development company in Kolkata, India.`;
  const url = workPath(work.title);
  const images = [{ url: work.image, alt: `${work.title} — ${work.tag} by GOBT` }];
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "article", locale: "en_IN", url, siteName: SITE.name, title, description, images },
    twitter: { card: "summary_large_image", title, description, images: [work.image] },
  };
}

export default async function WorkPage({ params }: Props) {
  const { slug } = await params;
  const work = findWork(slug);
  if (!work) notFound();

  const client = CLIENTS.find((c) => key(c.name) === key(work.title));
  const quote = TESTIMONIALS.find((t) => key(t.name) === key(work.title));
  const service = serviceForTag(work.tag, work.category);
  const more = WORKS.filter((w) => w.id !== work.id)
    .sort((a, b) => Number(serviceForTag(b.tag, b.category).slug === service.slug) - Number(serviceForTag(a.tag, a.category).slug === service.slug))
    .slice(0, 3);
  const url = `${SITE.url}${workPath(work.title)}`;

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: `${work.title} — ${work.tag}`,
      description: work.desc,
      url,
      image: `${SITE.url}${work.image}`,
      creator: { "@id": `${SITE.url}/#organization` },
      keywords: work.tech.join(", "),
      ...(work.live ? { sameAs: `https://${work.live}` } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Work", item: `${SITE.url}/#work` },
        { "@type": "ListItem", position: 3, name: work.title, item: url },
      ],
    },
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
            <Link href="/#work">Work</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{work.title}</span>
          </nav>
          <p className="cs-tag">{work.tag}</p>
          <h1 className="sp-title">{work.title}</h1>
          <p className="sp-lede">{work.desc}</p>
          <dl className="cs-facts">
            {client && (
              <div>
                <dt>Industry</dt>
                <dd>{client.type}</dd>
              </div>
            )}
            {client && (
              <div>
                <dt>Client since</dt>
                <dd>{client.since}</dd>
              </div>
            )}
            <div>
              <dt>Platform</dt>
              <dd>{work.category === "App" ? "Mobile app" : "Web"}</dd>
            </div>
            {work.live && (
              <div>
                <dt>Live</dt>
                <dd>
                  <a href={`https://${work.live}`} target="_blank" rel="noopener noreferrer">
                    {work.live} ↗
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </header>

        <section className="sp-block wrap">
          <div className="cs-shot">
            <Image src={work.image} alt={`${work.title} — ${work.tag} built by GOBT`} fill priority sizes="(min-width: 1400px) 1300px, 100vw" />
          </div>
        </section>

        <section className="sp-block wrap sp-overview" aria-labelledby="cs-about">
          <div>
            <h2 className="sp-h2" id="cs-about">
              The project
            </h2>
            <p>{work.desc}</p>
            {client && client.desc.toLowerCase() !== work.desc.toLowerCase() && <p>{client.desc}.</p>}
          </div>
          <div>
            <h2 className="sp-h2">Built with</h2>
            <ul className="sp-stack">
              {work.tech.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p className="cs-service">
              Part of our{" "}
              <Link href={servicePath(service.slug)}>{service.name.toLowerCase()}</Link> work.
            </p>
          </div>
        </section>

        {quote && (
          <section className="sp-block wrap" aria-label="Client testimonial">
            <figure className="cs-quote">
              <blockquote>“{quote.text}”</blockquote>
              <figcaption>
                {quote.name} · {quote.role}
              </figcaption>
            </figure>
          </section>
        )}

        <section className="sp-block wrap" aria-labelledby="cs-more">
          <h2 className="sp-h2" id="cs-more">
            More projects
          </h2>
          <ul className="sp-work">
            {more.map((w) => (
              <li key={w.id}>
                <Link href={workPath(w.title)} className="cs-card">
                  <div className="sp-work-img">
                    <Image src={w.image} alt={`${w.title} — ${w.tag}`} fill sizes="(min-width: 900px) 33vw, 100vw" />
                  </div>
                  <span className="sp-work-tag">{w.tag}</span>
                  <h3>{w.title}</h3>
                  <p>{w.desc}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="sp-cta wrap">
          <h2 className="sp-h2">Want results like {work.title}?</h2>
          <p>Tell us what you&apos;re building — we reply within 24 hours with next steps.</p>
          <Link href="/#contact" className="btn btn-gold btn-lg">
            <span className="btn-label">Start a project</span>
            <span className="btn-arrow" aria-hidden="true">↗</span>
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
