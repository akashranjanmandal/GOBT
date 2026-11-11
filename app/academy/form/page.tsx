import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ACADEMY, ACADEMY_COURSES, inr } from "@/lib/academy";
import { SITE } from "@/lib/seo";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";
import AcademyForm from "@/components/academy/AcademyForm";
import ShareForm from "@/components/academy/ShareForm";
import { availablePhotos } from "@/components/academy/parts";
import "../academy.css";

const TITLE = "Register for Robotics & AI Classes | GOBT Robotics & AI Academy, Falta";
const DESCRIPTION = "Admission form for GOBT Robotics & AI Academy: robotics, Arduino, Python, AI and IoT courses for children from LKG to Class 12 in Falta. Takes 2 minutes.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/academy/form" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/academy/form",
    siteName: SITE.name,
    title: "Register for Robotics & AI classes in Falta",
    description: DESCRIPTION,
    images: [{ url: "/academy/students-building-robot-car.jpg", alt: "Students building a robot car" }],
  },
};

/* The shareable admission form: gobt.in/academy/form */
export default function AcademyFormPage() {
  const photo = availablePhotos()[0];
  return (
    <>
      <Nav />
      <main id="main" className="acx acx-formpage">
        <div className="acx-wrap">
          <nav className="acx-crumbs" aria-label="Breadcrumb">
            <Link href="/academy">Robotics &amp; AI Academy</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Registration</span>
          </nav>

          <header className="acx-formhead">
            {photo && (
              <div className="acx-formhead-photo">
                <Image src={`/academy/${photo.file}`} alt={photo.alt} width={460} height={326} priority sizes="(min-width: 960px) 320px, 100vw" />
              </div>
            )}
            <div>
              <p className="acx-kicker">{ACADEMY.name}</p>
              <h1>Register your child</h1>
              <p className="acx-lede">Takes about 2 minutes. We&apos;ll call you back to confirm the admission and answer any questions.</p>
            </div>
          </header>

          <div className="acx-formgrid">
            <AcademyForm />

            <aside className="acx-side">
              <section>
                <h2>Fees</h2>
                <ul className="acx-fees">
                  {ACADEMY_COURSES.map((c) => (
                    <li key={c.id}>
                      <span>
                        {c.title}
                        <small>{c.duration}</small>
                      </span>
                      <b>{inr(c.fee)}</b>
                    </li>
                  ))}
                  <li className="acx-fees-reg">
                    <span>Registration fee (all courses)</span>
                    <b>{inr(ACADEMY.registrationFee)}</b>
                  </li>
                </ul>
              </section>
              <section>
                <h2>What happens next</h2>
                <ol className="acx-next">
                  <li>We get your form straight away.</li>
                  <li>We call or WhatsApp you to confirm.</li>
                  <li>Your child starts classes.</li>
                </ol>
              </section>
              <section>
                <h2>Need help?</h2>
                <p>
                  Call or WhatsApp <a href={ACADEMY.whatsapp}>{ACADEMY.phone}</a>.
                  <br />
                  {ACADEMY.address}.
                </p>
              </section>
              <section>
                <h2>Know another parent?</h2>
                <p>Share this form with them:</p>
                <ShareForm url={`${SITE.url}/academy/form`} />
              </section>
            </aside>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
