import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ACADEMY, ACADEMY_ACTIVITIES, ACADEMY_COURSES, ACADEMY_LOCATIONS, ACADEMY_WHY, inr } from "@/lib/academy";
import { SITE, faqLd, jsonLd } from "@/lib/seo";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";
import { ActivityIcon, availablePhotos } from "@/components/academy/parts";
import "./academy.css";

const TITLE = "Robotics & AI Classes for Kids in Falta | GOBT Robotics & AI Academy";
const DESCRIPTION =
  "Hands-on robotics, Arduino, Python, AI and IoT courses for children from LKG to Class 12 in Falta, Dighirpar and Sarisha. Courses from ₹999. Admission open, register online.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "robotics classes Falta",
    "robotics course for kids West Bengal",
    "AI course for school students",
    "Arduino course for kids",
    "Python course for kids",
    "robotics academy Dighirpar",
  ],
  alternates: { canonical: "/academy" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/academy",
    siteName: SITE.name,
    title: TITLE,
    description: DESCRIPTION,
    images: [{ url: "/academy/students-building-robot-car.jpg", alt: "Students building a robot car" }],
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const FAQS = [
  { q: "Who can join?", a: `Children from LKG to Class 12.` },
  { q: "Does my child need to know coding or electronics first?", a: "No. Junior Robotics starts from the basics. Older or more experienced students can pick Robotics & Arduino, Python & AI Basics or Advanced Robotics & IoT." },
  { q: "Where are the classes?", a: `At the ${ACADEMY.address}. When you register, choose the centre nearest to you: ${ACADEMY_LOCATIONS.join(", ")}.` },
  { q: "What are the fees?", a: `Course fees are ${ACADEMY_COURSES.map((c) => `${c.title} ${inr(c.fee)} (${c.duration})`).join(", ")}. There is also a ${inr(ACADEMY.registrationFee)} registration fee, the same for every course.` },
  { q: "Will my child get a certificate?", a: "Yes. Every student receives a certificate when they complete their course." },
  { q: "How do I register?", a: `Fill in the short registration form (about 2 minutes) or message us on WhatsApp at ${ACADEMY.phone}. We call you back to confirm the admission.` },
];

export default function AcademyPage() {
  const photos = availablePhotos();
  const hero = photos[0];
  const gallery = photos.slice(1);
  const url = `${SITE.url}/academy`;

  const structured = [
    {
      "@context": "https://schema.org",
      "@type": "EducationalOrganization",
      "@id": `${url}#academy`,
      name: ACADEMY.name,
      url,
      telephone: ACADEMY.phone.replace(/\s/g, ""),
      parentOrganization: { "@id": `${SITE.url}/#organization` },
      address: { "@type": "PostalAddress", streetAddress: "Dighirpar", addressLocality: "Falta", addressRegion: "West Bengal", addressCountry: "IN" },
    },
    ...ACADEMY_COURSES.map((c) => ({
      "@context": "https://schema.org",
      "@type": "Course",
      name: c.title,
      description: c.desc,
      provider: { "@id": `${url}#academy` },
      offers: { "@type": "Offer", category: "Paid", price: c.fee, priceCurrency: "INR" },
    })),
    faqLd(FAQS),
  ];

  return (
    <>
      <Nav />
      <main id="main" className="acx">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

        {/* ── hero: a big photo and one clear action ── */}
        <section className="acx-hero">
          <div className="acx-wrap acx-hero-grid">
            <div className="acx-hero-copy">
              <p className="acx-kicker">{ACADEMY.name}</p>
              <h1>
                Robotics &amp; AI classes for children in <span>Falta</span>
              </h1>
              <p className="acx-lede">
                Your child builds real robots, learns to code and explores artificial intelligence in hands-on classes. From LKG to Class 12.
              </p>
              <div className="acx-badges">
                <span className="acx-badge acx-badge-hot">Admission open</span>
                <span className="acx-badge">Courses from {inr(Math.min(...ACADEMY_COURSES.map((c) => c.fee)))}</span>
                <span className="acx-badge">Certificate included</span>
              </div>
              <div className="acx-ctas">
                <Link href="/academy/form" className="acx-btn acx-btn-main">
                  Register your child →
                </Link>
                <a href={ACADEMY.whatsapp} target="_blank" rel="noopener noreferrer" className="acx-btn acx-btn-wa">
                  WhatsApp {ACADEMY.phone}
                </a>
              </div>
            </div>
            <div className="acx-hero-photo">
              {hero && (
                <Image src={`/academy/${hero.file}`} alt={hero.alt} width={460} height={326} priority sizes="(min-width: 960px) 46vw, 100vw" />
              )}
              <div className="acx-mascot" aria-hidden="true">
                <Image src="/academy/gobt-robot-mascot.jpg" alt="" width={205} height={185} />
              </div>
            </div>
          </div>
        </section>

        {/* ── the facts parents look for first ── */}
        <section className="acx-wrap">
          <dl className="acx-facts">
            <div>
              <dt>Who can join</dt>
              <dd>LKG to Class 12</dd>
            </div>
            <div>
              <dt>Course length</dt>
              <dd>1 to 2 months</dd>
            </div>
            <div>
              <dt>Fees</dt>
              <dd>
                {inr(Math.min(...ACADEMY_COURSES.map((c) => c.fee)))} to {inr(Math.max(...ACADEMY_COURSES.map((c) => c.fee)))}
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>Dighirpar, Falta</dd>
            </div>
          </dl>
        </section>

        {/* ── what children do ── */}
        <section className="acx-section acx-wrap">
          <h2>What your child will do</h2>
          <ul className="acx-activities">
            {ACADEMY_ACTIVITIES.map((a) => (
              <li key={a.title}>
                <span className="acx-icon">
                  <ActivityIcon name={a.icon} />
                </span>
                {a.title}
              </li>
            ))}
          </ul>
        </section>

        {gallery.length > 0 && (
          <section className="acx-section acx-wrap">
            <h2>Inside our classes</h2>
            <ul className="acx-gallery">
              {gallery.map((p) => (
                <li key={p.file}>
                  <Image src={`/academy/${p.file}`} alt={p.alt} width={640} height={480} sizes="(min-width: 960px) 30vw, 100vw" />
                  <span>{p.caption}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── courses ── */}
        <section className="acx-section acx-tint" id="courses">
          <div className="acx-wrap">
            <h2>Choose a course</h2>
            <p className="acx-sub">Not sure which one fits your child? Message us on WhatsApp and we&apos;ll help you choose.</p>
            <ul className="acx-courses">
              {ACADEMY_COURSES.map((c, i) => (
                <li key={c.id} className={`acx-course acx-course-${i}`}>
                  <div className="acx-course-top">
                    <span className="acx-course-n">{i + 1}</span>
                    <h3>{c.title}</h3>
                    <p>{c.desc}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Duration</dt>
                      <dd>{c.duration}</dd>
                    </div>
                    <div>
                      <dt>Course fee</dt>
                      <dd className="acx-fee">{inr(c.fee)}</dd>
                    </div>
                  </dl>
                  <Link href={`/academy/form?course=${c.id}`} className="acx-btn acx-btn-main acx-btn-block">
                    Register for this course
                  </Link>
                </li>
              ))}
            </ul>
            <p className="acx-note">
              Plus a one-time <b>{inr(ACADEMY.registrationFee)} registration fee</b>, the same for every course.
            </p>
          </div>
        </section>

        {/* ── why parents choose us ── */}
        <section className="acx-section acx-wrap">
          <h2>Why parents choose us</h2>
          <ul className="acx-why">
            {ACADEMY_WHY.map((w) => (
              <li key={w.title}>
                <b>{w.title}</b>
                <p>{w.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* ── how admission works ── */}
        <section className="acx-section acx-tint">
          <div className="acx-wrap">
            <h2>How admission works</h2>
            <ol className="acx-steps">
              <li>
                <b>Fill in the form</b>
                <p>It takes about 2 minutes: your child&apos;s name, class, school and the course you want.</p>
              </li>
              <li>
                <b>We call you</b>
                <p>Our team calls or WhatsApps you to answer your questions and confirm the admission.</p>
              </li>
              <li>
                <b>Classes begin</b>
                <p>Your child starts building, coding and learning at the centre nearest you.</p>
              </li>
            </ol>
            <div className="acx-ctas acx-center">
              <Link href="/academy/form" className="acx-btn acx-btn-main">
                Register your child →
              </Link>
            </div>
          </div>
        </section>

        {/* ── questions ── */}
        <section className="acx-section acx-wrap" id="faq">
          <h2>Questions parents ask</h2>
          <div className="acx-faq">
            {FAQS.map((f) => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="acx-wrap">
          <div className="acx-cta">
            <div>
              <h2>Give your child a head start in technology</h2>
              <p>
                {ACADEMY.address}. Call or WhatsApp {ACADEMY.phone}.
              </p>
            </div>
            <div className="acx-ctas">
              <Link href="/academy/form" className="acx-btn acx-btn-main">
                Register now
              </Link>
              <a href={ACADEMY.whatsapp} target="_blank" rel="noopener noreferrer" className="acx-btn acx-btn-wa">
                WhatsApp us
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
