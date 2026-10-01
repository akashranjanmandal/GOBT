"use client";

import { useEffect, useRef } from "react";
import { scrollToTarget } from "@/lib/scroll";

/* Minimal header: the mark on the left, one call to action on the
   right. It never hides, and picks up a dark backing once the page
   has scrolled so the button stays legible over content. */
export default function Nav() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    let scrolled = false;
    const onScroll = () => {
      const next = window.scrollY > 40;
      if (next !== scrolled) {
        scrolled = next;
        nav.classList.toggle("is-scrolled", next);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="nav" ref={navRef}>
      <div className="nav-inner">
        <a
          href="#home"
          className="nav-logo"
          aria-label="GOBT — back to top"
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget(0);
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="GOBT" width={389} height={363} />
        </a>

        <a
          href="#contact"
          className="btn btn-gold nav-cta"
          data-magnetic
          onClick={(e) => {
            e.preventDefault();
            scrollToTarget("#contact");
          }}
        >
          <span className="btn-label">Start a project</span>
          <span className="btn-arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </header>
  );
}
