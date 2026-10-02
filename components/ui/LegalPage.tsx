import type { ReactNode } from "react";
import Link from "next/link";
import Nav from "@/components/ui/Nav";
import Footer from "@/components/sections/Footer";

/* Shell for plain-text pages (privacy, terms) */
export default function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <>
      <div className="bg-layer" aria-hidden="true" />
      <Nav />
      <main id="main" className="sp">
        <article className="wrap legal">
          <nav className="sp-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{title}</span>
          </nav>
          <h1 className="sp-title">{title}</h1>
          <p className="legal-updated">Last updated: {updated}</p>
          {children}
        </article>
      </main>
      <Footer />
    </>
  );
}
