import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";
import { SERVICE_PAGES, servicePath } from "@/lib/seo";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

export default function NotFound() {
  return (
    <>
      <div className="bg-layer" aria-hidden="true" />
      <Nav />
      <main id="main" className="sp">
        <section className="wrap nf">
          <p className="cs-tag">404</p>
          <h1 className="sp-title">This page doesn&apos;t exist.</h1>
          <p className="sp-lede">The link may be old or mistyped. Here&apos;s where you can go instead:</p>
          <div className="sp-ctas">
            <Link href="/" className="btn btn-gold btn-lg">
              <span className="btn-label">Back to home</span>
            </Link>
            <Link href="/#contact" className="btn btn-ghost btn-lg">
              <span className="btn-label">Contact us</span>
            </Link>
          </div>
          <h2 className="sp-h2 nf-h2">Our services</h2>
          <ul className="sp-links">
            {SERVICE_PAGES.map((s) => (
              <li key={s.slug}>
                <Link href={servicePath(s.slug)}>{s.name} →</Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <Footer />
    </>
  );
}
