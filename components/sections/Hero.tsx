"use client";

import { useEffect, useRef } from "react";
import { GOBT_STATS, HERO } from "@/lib/content";
import { gsap, SplitText, useGSAP, MQ_MOTION } from "@/lib/gsap";
import { EVT_INTRO, introState, scrollToTarget } from "@/lib/scroll";

const HERO_STATS = [GOBT_STATS[0], GOBT_STATS[1], GOBT_STATS[2], GOBT_STATS[5]];

/* Rosette outline for the recognition seal, computed once so server
   and client render the identical path */
const SEAL = (() => {
  const pts: string[] = [];
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 ? 9.3 : 10.8;
    pts.push(`${(12 + Math.cos(a) * r).toFixed(2)} ${(12 + Math.sin(a) * r).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  /* Depth: the copy drifts gently against the pointer while the
     particle gears (ParticleField) lean toward it */
  useEffect(() => {
    const copy = root.current?.querySelector<HTMLElement>(".hero-copy");
    if (!copy) return;
    if (!window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
    const xTo = gsap.quickTo(copy, "x", { duration: 1.4, ease: "power3" });
    const yTo = gsap.quickTo(copy, "y", { duration: 1.4, ease: "power3" });
    const onMove = (e: PointerEvent) => {
      xTo((e.clientX / window.innerWidth - 0.5) * -20);
      yTo((e.clientY / window.innerHeight - 0.5) * -12);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(MQ_MOTION, () => {
        const splits = gsap.utils
          .toArray<HTMLElement>(".ht-split")
          .map((el) => SplitText.create(el, { type: "chars", charsClass: "ht-char" }));

        const counters = gsap.utils.toArray<HTMLElement>(".hero-stat-num");
        const tl = gsap.timeline({ paused: true });
        tl.from(".hero-corner", { scale: 0.4, autoAlpha: 0, duration: 1, ease: "expo.out", stagger: 0.06 }, 0)
          .from(".hero-badge", { autoAlpha: 0, y: 18, duration: 1, ease: "expo.out" }, 0.05)
          .from(".hero-eyebrow", { autoAlpha: 0, y: 16, duration: 0.9, ease: "expo.out" }, 0.12)
          .from(splits[0]?.chars ?? [], { yPercent: 125, rotate: 10, duration: 1.3, ease: "expo.out", stagger: 0.028 }, 0.15)
          .from(".ht-gold", { yPercent: 125, duration: 1.4, ease: "expo.out" }, 0.32)
          .from(splits[1]?.chars ?? [], { yPercent: 125, rotate: 10, duration: 1.3, ease: "expo.out", stagger: 0.022 }, 0.42)
          .from(".hero-lede", { autoAlpha: 0, y: 30, duration: 1.1, ease: "expo.out" }, 0.75)
          .from(".hero-chip", { autoAlpha: 0, y: 14, duration: 0.8, ease: "expo.out", stagger: 0.05 }, 0.85)
          .from(".hero-ctas > *", { autoAlpha: 0, y: 22, duration: 0.9, ease: "expo.out", stagger: 0.08 }, 0.95)
          .from(".hero-stat", { autoAlpha: 0, y: 36, duration: 1, ease: "expo.out", stagger: 0.08 }, 1.05);
        counters.forEach((el, i) => {
          const target = Number(el.dataset.val);
          const obj = { v: 0 };
          tl.to(
            obj,
            {
              v: target,
              duration: 1.6,
              ease: "power3.out",
              onUpdate: () => {
                el.textContent = String(Math.round(obj.v));
              },
            },
            1.15 + i * 0.08
          );
        });

        const play = () => tl.play();
        if (introState.done) play();
        else window.addEventListener(EVT_INTRO, play, { once: true });

        /* scroll-out: the copy lifts away faster than the page while
           the particles take the stage */
        gsap
          .timeline({
            scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
          })
          .to(".hero-copy", { yPercent: -22, autoAlpha: 0, ease: "power1.in" }, 0)
          .to(".hero-stats", { y: -80, autoAlpha: 0, ease: "none" }, 0)
          .to(".hero-frame", { autoAlpha: 0, ease: "none" }, 0);

        return () => {
          window.removeEventListener(EVT_INTRO, play);
          splits.forEach((s) => s.revert());
        };
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="home" className="hero" ref={root}>
      <div className="hero-fx" data-fx="gear" data-fx-opacity="1" data-fx-opacity-sm="0.6" aria-hidden="true" />

      <div className="hero-frame" aria-hidden="true">
        <span className="hero-corner tl" />
        <span className="hero-corner tr" />
        <span className="hero-corner bl" />
        <span className="hero-corner br" />
      </div>

      <div className="hero-copy wrap">
        <div className="hero-badge">
          <span className="hero-badge-seal" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d={SEAL} className="seal-rim" />
              <path d="M8.2 12.3l2.6 2.6 5-5.2" className="seal-check" />
            </svg>
          </span>
          <span className="hero-badge-text">
            <strong>{HERO.badge.title}</strong>
            <span>{HERO.badge.sub}</span>
          </span>
          <span className="hero-badge-shine" aria-hidden="true" />
        </div>

        <p className="hero-eyebrow">
          <span className="hero-eyebrow-mark" />
          <span>{HERO.eyebrow}</span>
        </p>

        {/* Split text lines are rendered as opaque HTML so React never
            reconciles the characters SplitText creates inside them */}
        <h1 className="hero-title">
          <span className="ht-line">
            <span className="ht-split" dangerouslySetInnerHTML={{ __html: "We pioneer" }} />
          </span>
          <span className="ht-line">
            <span className="ht-gold text-metal">Deep-Tech AI</span>
          </span>
          <span className="ht-line">
            <span className="ht-split" dangerouslySetInnerHTML={{ __html: "that Automates." }} />
          </span>
        </h1>
        <p className="hero-lede">{HERO.lede}</p>
        <ul className="hero-chips" aria-label="Focus areas">
          {HERO.chips.map((c) => (
            <li className="hero-chip" key={c}>
              {c}
            </li>
          ))}
        </ul>
        <div className="hero-ctas">
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
          <a
            href="#work"
            className="btn btn-ghost btn-lg"
            data-magnetic
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#work");
            }}
          >
            <span className="btn-label">See our work</span>
            <span className="btn-arrow" aria-hidden="true">→</span>
          </a>
        </div>
      </div>

      <div className="hero-stats wrap">
        {HERO_STATS.map((s) => (
          <div className="hero-stat" key={s.label}>
            <span className="hero-stat-value">
              <span className="hero-stat-num" data-val={s.val}>
                {s.val}
              </span>
              <span className="hero-stat-sup">{s.sup}</span>
            </span>
            <span className="hero-stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
