"use client";

import { useEffect, useRef, useState } from "react";
import { TESTIMONIALS } from "@/lib/content";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/scroll";
import SectionHead from "@/components/ui/SectionHead";

const N = TESTIMONIALS.length;
const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const DURATION = 7500;

export default function Testimonials() {
  const root = useRef<HTMLElement>(null);
  const quoteRef = useRef<HTMLParagraphElement>(null);
  const [idx, setIdx] = useState(0);
  const [hold, setHold] = useState(false);
  const [inView, setInView] = useState(false);
  const running = inView && !hold;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running || prefersReducedMotion()) return;
    const id = window.setTimeout(() => setIdx((i) => (i + 1) % N), DURATION);
    return () => window.clearTimeout(id);
  }, [idx, running]);

  /* each new quote resolves word by word out of a blur */
  useGSAP(
    () => {
      if (prefersReducedMotion() || !quoteRef.current) return;
      const split = SplitText.create(quoteRef.current, { type: "words", wordsClass: "tq-word" });
      gsap.from(split.words, {
        autoAlpha: 0,
        y: 16,
        filter: "blur(10px)",
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.016,
      });
      gsap.from(".tq-author > *", { autoAlpha: 0, y: 12, duration: 0.7, ease: "power3.out", stagger: 0.08, delay: 0.25 });
      return () => split.revert();
    },
    { scope: root, dependencies: [idx] }
  );

  const t = TESTIMONIALS[idx];

  return (
    <section id="voices" className="tq" ref={root}>
      <div className="rest-fx" data-fx="globe" data-fx-opacity="0" aria-hidden="true" />
      <div className="wrap">
        <SectionHead title="Don’t take *our word* for it." />

        <div
          className="tq-console"
          data-reveal="fade"
          onPointerEnter={() => setHold(true)}
          onPointerLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={() => setHold(false)}
        >
          <div className="tq-tabs" role="tablist" aria-label="Client testimonials">
            {TESTIMONIALS.map((item, i) => (
              <button
                key={item.name}
                role="tab"
                id={`tq-tab-${i}`}
                aria-selected={i === idx}
                aria-controls="tq-panel"
                className={`tq-tab${i === idx ? " is-active" : ""}`}
                onClick={() => setIdx(i)}
              >
                <span className="tq-tab-text">
                  <span className="tq-tab-name">{item.name}</span>
                  <span className="tq-tab-role">{item.role}</span>
                </span>
                {i === idx && (
                  <span className="tq-tab-progress" aria-hidden="true">
                    <span key={idx} style={{ animationDuration: `${DURATION}ms`, animationPlayState: running ? "running" : "paused" }} />
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="tq-stage" role="tabpanel" id="tq-panel" aria-labelledby={`tq-tab-${idx}`}>
            <span className="tq-mark" aria-hidden="true">“</span>
            {/* opaque HTML: SplitText splits the quote into words */}
            <p className="tq-quote" ref={quoteRef} key={`q-${idx}`} dangerouslySetInnerHTML={{ __html: escapeHtml(t.text) }} />
            <div className="tq-author" key={`a-${idx}`}>
              <span className="tq-avatar">{t.init}</span>
              <span className="tq-who">
                <span className="tq-name">{t.name}</span>
                <span className="tq-role">{t.role}</span>
              </span>
            </div>
            <div className="tq-nav">
              <button className="tq-arrow" onClick={() => setIdx((i) => (i - 1 + N) % N)} aria-label="Previous testimonial">
                ←
              </button>
              <button className="tq-arrow" onClick={() => setIdx((i) => (i + 1) % N)} aria-label="Next testimonial">
                →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
