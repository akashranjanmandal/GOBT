"use client";

import { useEffect, useRef } from "react";
import { MARQUEE_WORDS, NAV_ITEMS, SOCIALS, CONTACT } from "@/lib/content";
import { gsap, useGSAP, MQ_MOTION } from "@/lib/gsap";
import { getLenis, onSectionLink, prefersReducedMotion, scrollToTarget } from "@/lib/scroll";
import { markup } from "@/lib/markup";
import Link from "next/link";
import { SERVICE_PAGES, servicePath } from "@/lib/seo";

const ICON = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const SOCIAL_ICONS: Record<string, React.ReactNode> = {
  Instagram: (
    <svg {...ICON} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" /></svg>
  ),
  Facebook: (
    <svg {...ICON} aria-hidden="true"><path d="M15 3h-2a4 4 0 00-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 011-1h2z" /></svg>
  ),
  WhatsApp: (
    <svg {...ICON} aria-hidden="true"><path d="M20 11.5a8.5 8.5 0 01-12.6 7.4L3.5 20l1.2-3.8A8.5 8.5 0 1120 11.5z" /><path d="M9 8.5c0 3 2.5 6.5 6 6.8l1.2-1.4-1.9-.9-.8.8c-1.1-.4-2.4-1.7-2.8-2.8l.8-.8-.9-1.9L9 8.5z" /></svg>
  ),
  LinkedIn: (
    <svg {...ICON} aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M7.5 10v6.5M7.5 7.5v.01M11 16.5V13a2.5 2.5 0 015 0v3.5M11 10v6.5" /></svg>
  ),
};

export default function Footer() {
  const root = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  /* marquee: constant drift, accelerated and skewed by scroll speed */
  useEffect(() => {
    const track = trackRef.current;
    if (!track || prefersReducedMotion()) return;
    let x = 0;
    let skew = 0;
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(track);
    let half = track.scrollWidth / 2;
    const ro = new ResizeObserver(() => (half = track.scrollWidth / 2));
    ro.observe(track);
    const tick = (_t: number, dms: number) => {
      if (!visible) return;
      const dt = Math.min(dms / 1000, 0.05);
      const v = getLenis()?.velocity ?? 0;
      if (!half) return;
      x = gsap.utils.wrap(-half, 0, x - (60 + Math.min(Math.abs(v) * 40, 1400)) * dt);
      skew += (Math.max(-10, Math.min(10, v * 0.35)) - skew) * 0.1;
      track.style.transform = `translate3d(${x}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  /* the wordmark fills with gold as you arrive at the bottom */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.fromTo(
          ".fw-fill",
          { clipPath: "inset(100% 0 0 0)" },
          {
            clipPath: "inset(0% 0 0 0)",
            ease: "none",
            scrollTrigger: { trigger: ".fw", start: "top 95%", end: "bottom bottom", scrub: true },
          }
        );
        gsap.from(".fw-letter", {
          yPercent: 60,
          ease: "none",
          stagger: 0.06,
          scrollTrigger: { trigger: ".fw", start: "top bottom", end: "bottom bottom", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  const words = [...MARQUEE_WORDS, ...MARQUEE_WORDS];

  return (
    <footer className="footer" ref={root}>
      <div className="fm" aria-hidden="true">
        <div className="fm-track" ref={trackRef}>
          {words.map((w, i) => (
            <span className={`fm-word${i % 2 ? " is-solid" : ""}`} key={i}>
              {w}
              <i>✦</i>
            </span>
          ))}
        </div>
      </div>

      <div className="wrap fc">
        <p className="fc-title" data-reveal="lines" dangerouslySetInnerHTML={{ __html: markup("Have a project in mind? *Let’s make it real.*") }} />
        <Link
          href="/#contact"
          className="btn btn-gold btn-lg"
          data-magnetic
          onClick={(e) => onSectionLink(e, "#contact")}
        >
          <span className="btn-label">Start a project</span>
          <span className="btn-arrow" aria-hidden="true">↗</span>
        </Link>
      </div>

      <div className="wrap fg">
        <div className="fg-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="GOBT" width={389} height={363} className="fg-logo" />
          <p>
            GOBT — Group Of Blooming Technicians. A Kolkata-based digital engineering studio building web platforms,
            mobile apps and custom software.
          </p>
          <div className="fg-socials">
            {SOCIALS.map((s) => (
              <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}>
                {SOCIAL_ICONS[s.label]}
              </a>
            ))}
          </div>
        </div>
        <nav className="fg-col fg-nav" aria-label="Footer">
          <span className="fg-title">Navigate</span>
          <div className="fg-nav-grid">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                href={`/#${item.id}`}
                onClick={(e) => onSectionLink(e, `#${item.id}`)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <div className="fg-col">
          <span className="fg-title">Reach</span>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <span>{CONTACT.location}</span>
        </div>
      </div>

      <nav className="wrap fs" aria-label="Services">
        <span className="fg-title">Services</span>
        <ul>
          {SERVICE_PAGES.map((sp) => (
            <li key={sp.slug}>
              <Link href={servicePath(sp.slug)}>{sp.name}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="wrap fb">
        <span>Kolkata, India — {new Date().getFullYear()} GOBT Inc. All rights reserved.</span>
        <div className="fb-links">
          <Link
            href="/#contact"
            onClick={(e) => onSectionLink(e, "#contact")}
          >
            Privacy Policy
          </Link>
          <Link
            href="/#contact"
            onClick={(e) => onSectionLink(e, "#contact")}
          >
            Terms of Use
          </Link>
          <button className="fb-top" onClick={() => (window.location.pathname === "/" ? scrollToTarget(0) : window.scrollTo({ top: 0, behavior: "smooth" }))}>
            Back to top ↑
          </button>
        </div>
      </div>

      <div className="fw" aria-hidden="true">
        <span className="fw-outline">
          {"GOBT".split("").map((l, i) => (
            <span className="fw-letter" key={i}>
              {l}
            </span>
          ))}
        </span>
        <span className="fw-fill">
          {"GOBT".split("").map((l, i) => (
            <span className="fw-letter" key={i}>
              {l}
            </span>
          ))}
        </span>
      </div>
    </footer>
  );
}
