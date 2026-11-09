import type { Metadata } from "next";
import Link from "next/link";
import { ACADEMY, ACADEMY_ACTIVITIES, ACADEMY_COURSES, ACADEMY_WHY, inr } from "@/lib/academy";
import { SITE, jsonLd } from "@/lib/seo";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";
import AcademyForm from "@/components/academy/AcademyForm";

const TITLE = "Robotics & AI Classes for Kids in Falta — GOBT Robotics & AI Academy";
const DESCRIPTION =
  "Hands-on robotics, Arduino, Python, AI and IoT courses for school students (Class 4–12) in Falta, Dighirpar and Sarisha. Courses from ₹999. Admission open — register online.";

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
    "রোবোটিক্স কোর্স",
  ],
  alternates: { canonical: "/academy" },
  openGraph: { type: "website", locale: "en_IN", url: "/academy", siteName: SITE.name, title: TITLE, description: DESCRIPTION },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

export default function AcademyPage() {
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
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Academy", item: url },
      ],
    },
  ];

  return (
    <>
      <div className="bg-layer" aria-hidden="true" />
      <Nav />
      <main id="main" className="sp ac">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structured) }} />

        <header className="sp-hero wrap">
          <nav className="sp-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Academy</span>
          </nav>
          <p className="ac-kicker">
            {ACADEMY.name} · <span>{ACADEMY.initiative}</span>
          </p>
          <h1 className="sp-title ac-title">
            <span lang="bn">এবার ফলতাতেই শিশুদের জন্য রোবোটিক্স ও AI শেখার সুযোগ!</span>
            <span className="ac-title-en">Robotics &amp; AI classes for kids, now in Falta</span>
          </h1>
          <p className="sp-lede">
            <span lang="bn">হাতে-কলমে প্রশিক্ষণের মাধ্যমে প্রযুক্তির দুনিয়ায় আপনার সন্তানের প্রথম পদক্ষেপ!</span> Hands-on training that
            gives your child their first step into the world of technology.
          </p>
          <div className="sp-ctas">
            <a href="#register" className="btn btn-gold btn-lg">
              <span className="btn-label">Register now</span>
              <span className="btn-arrow" aria-hidden="true">↓</span>
            </a>
            <a href={ACADEMY.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">
              <span className="btn-label">WhatsApp {ACADEMY.phone}</span>
            </a>
          </div>
          <p className="ac-open">
            <span lang="bn">এখনই ভর্তি চলছে!</span> Admission open · {ACADEMY.eligibility}
          </p>
        </header>

        <section className="sp-block wrap" aria-labelledby="ac-courses">
          <h2 className="sp-h2" id="ac-courses">
            Our courses <span lang="bn">আমাদের কোর্সসমূহ</span>
          </h2>
          <ul className="ac-courses">
            {ACADEMY_COURSES.map((c) => (
              <li className="ac-course" key={c.id}>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
                <p lang="bn" className="ac-bn">
                  {c.bn}
                </p>
                <dl>
                  <div>
                    <dt>Duration</dt>
                    <dd>{c.duration}</dd>
                  </div>
                  <div>
                    <dt>Course fee</dt>
                    <dd className="ac-fee">{inr(c.fee)}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>
          <p className="ac-note">
            Registration fee: <strong>{inr(ACADEMY.registrationFee)}</strong>, the same for every course.
          </p>
        </section>

        <section className="sp-block wrap ac-two" aria-label="Why choose us and what students do">
          <div>
            <h2 className="sp-h2">
              Why choose us? <span lang="bn">কেন আমাদের বেছে নেবেন?</span>
            </h2>
            <ul className="ac-list">
              {ACADEMY_WHY.map((w) => (
                <li key={w.en}>
                  {w.en} <span lang="bn">{w.bn}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="sp-h2">
              What students do <span lang="bn">যা শিখবে</span>
            </h2>
            <ul className="ac-list">
              {ACADEMY_ACTIVITIES.map((a) => (
                <li key={a.en}>
                  {a.en} <span lang="bn">{a.bn}</span>
                </li>
              ))}
            </ul>
            <p className="ac-note">
              Who can join: <strong>{ACADEMY.eligibility}</strong>. Address: <strong>{ACADEMY.address}</strong>.
            </p>
          </div>
        </section>

        <section className="sp-block wrap" id="register" aria-labelledby="ac-register">
          <h2 className="sp-h2" id="ac-register">
            Register <span lang="bn">ভর্তির জন্য নিবন্ধন</span>
          </h2>
          <p className="ac-note">Fill in the form and our team will call or WhatsApp you to confirm the admission.</p>
          <AcademyForm />
        </section>
      </main>
      <Footer />
    </>
  );
}
