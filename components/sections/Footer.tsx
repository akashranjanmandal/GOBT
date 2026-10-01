"use client";

import { useEffect, useRef } from "react";
import { MARQUEE_WORDS, NAV_ITEMS, SOCIALS, CONTACT } from "@/lib/content";
import { gsap, useGSAP, MQ_MOTION } from "@/lib/gsap";
import { getLenis, prefersReducedMotion, scrollToTarget } from "@/lib/scroll";
import { markup } from "@/lib/markup";

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
        <a
          href="#contact"
          className="btn btn-gold btn-lg"
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

      <div className="wrap fg">
        <div className="fg-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="GOBT" width={389} height={363} className="fg-logo" />
          <p>
            GOBT — Group Of Blooming Technicians. A Kolkata-based digital engineering studio building web platforms,
            mobile apps and custom software.
          </p>
        </div>
        <nav className="fg-col" aria-label="Footer">
          <span className="fg-title">Navigate</span>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget(`#${item.id}`);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="fg-col">
          <span className="fg-title">Social</span>
          {SOCIALS.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label} <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
        <div className="fg-col">
          <span className="fg-title">Reach</span>
          <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
          <span>{CONTACT.location}</span>
        </div>
      </div>

      <div className="wrap fb">
        <span>Kolkata, India — {new Date().getFullYear()} GOBT Inc. All rights reserved.</span>
        <div className="fb-links">
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#contact");
            }}
          >
            Privacy Policy
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#contact");
            }}
          >
            Terms of Use
          </a>
          <button className="fb-top" onClick={() => scrollToTarget(0)}>
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
