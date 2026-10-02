"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SERVICES, TECH_RING } from "@/lib/content";
import { gsap, ScrollTrigger, SplitText, useGSAP, MQ_MOTION, MQ_MOTION_DESKTOP, MQ_STATIC } from "@/lib/gsap";
import { getLenis } from "@/lib/scroll";
import SectionHead from "@/components/ui/SectionHead";
import { SERVICE_ICONS } from "@/components/ui/icons";

const N = SERVICES.length;
const MANIFESTO =
  "From <em>first sketch</em> to <em>shipped product</em> — GOBT covers the <em>full stack</em> of what a modern business needs to show up online and run better.";
const pad = (n: number) => String(n).padStart(2, "0");

/* ──────────────────────────────────────────
   SERVICES — "capability core"
   Eleven capabilities ride a tilted orbit around the GOBT core
   (where the particle field forms a globe). On desktop the
   section pins and scrolling turns the orbit, bringing each
   capability to the front in turn; the panel beside it reads
   out the one in focus. Smaller screens get the orbit on a slow
   idle spin above a plain list.
────────────────────────────────────────── */
export default function Services() {
  const root = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const orbitRef = useRef<HTMLDivElement>(null);
  const stRef = useRef<ScrollTrigger | null>(null);
  const target = useRef(0);
  const autoSpin = useRef(false);
  const [active, setActive] = useState(0);

  /* scroll → orbit target (desktop pin), manifesto word scrub */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION_DESKTOP, () => {
        autoSpin.current = false;
        /* the stage is position: sticky inside a tall scroller (CSS),
           so no JS pinning — scrolling through it turns the orbit */
        stRef.current = ScrollTrigger.create({
          trigger: scrollerRef.current,
          start: "top top",
          end: "bottom bottom",
          onUpdate: (self) => {
            target.current = self.progress * (N - 1);
          },
        });
        return () => {
          stRef.current = null;
          autoSpin.current = true;
        };
      });
      mm.add(MQ_STATIC, () => {
        autoSpin.current = true;
      });
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference), (hover: none) and (prefers-reduced-motion: no-preference)", () => {
        gsap.from(".svc-card", {
          y: 50,
          autoAlpha: 0,
          duration: 1,
          ease: "expo.out",
          stagger: 0.06,
          scrollTrigger: { trigger: ".svc-cards", start: "top 88%", once: true },
        });
      });
      mm.add(MQ_MOTION, () => {
        const split = SplitText.create(".manifesto-text", { type: "words", wordsClass: "mf-word" });
        gsap.fromTo(
          split.words,
          { opacity: 0.12 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.08,
            scrollTrigger: { trigger: ".manifesto-text", start: "top 82%", end: "bottom 42%", scrub: true },
          }
        );
        return () => split.revert();
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  /* idle spin for small screens / reduced motion */
  useEffect(() => {
    const id = window.setInterval(() => {
      if (autoSpin.current) target.current = Math.round(target.current) + 1;
    }, 2800);
    return () => window.clearInterval(id);
  }, []);

  /* orbit renderer — runs only while the section is near view */
  useEffect(() => {
    const orbit = orbitRef.current;
    if (!orbit) return;
    const nodes = Array.from(orbit.querySelectorAll<HTMLElement>(".svc-node"));
    const techs = Array.from(orbit.querySelectorAll<HTMLElement>(".svc-tech"));
    const beam = orbit.querySelector<SVGLineElement>(".svc-beam line");
    const comet = orbit.querySelector<HTMLElement>(".svc-comet");
    let rot = 0;
    let time = 0;
    let lastActive = -1;
    let visible = false;
    let w = 0, h = 0, cx = 0, cy = 0, rx = 0, ry = 0;

    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting), { rootMargin: "20% 0px" });
    io.observe(orbit);
    /* measure once per resize, never inside the frame loop */
    const measure = () => {
      w = orbit.clientWidth;
      h = orbit.clientHeight;
      cx = w / 2;
      cy = h / 2;
      rx = w * 0.47;
      ry = Math.min(h * 0.38, rx * 0.42);
      orbit.style.setProperty("--rx", rx + "px");
      orbit.style.setProperty("--ry", ry + "px");
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(orbit);

    const tick = (_t: number, dms: number) => {
      if (!visible) return;
      const dt = Math.min(dms / 1000, 0.05);
      time += dt;
      rot += (target.current - rot) * (1 - Math.exp(-dt * 6));

      let front = { x: cx, y: cy + ry };
      nodes.forEach((el, i) => {
        const th = ((i - rot) / N) * Math.PI * 2 + Math.PI / 2;
        const depth = Math.sin(th);
        const f = (depth + 1) / 2;
        const x = cx + Math.cos(th) * rx;
        const y = cy + depth * ry;
        const isFront = i === (((Math.round(rot) % N) + N) % N);
        const scale = 0.55 + 0.45 * f + (isFront ? 0.18 : 0);
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`;
        el.style.opacity = (0.18 + 0.82 * Math.pow(f, 1.6)).toFixed(3);
        el.style.zIndex = String(depth > 0 ? 10 + Math.round(depth * 10) : 1);
        el.classList.toggle("is-front", isFront);
        el.classList.toggle("show-label", depth > 0.55);
        if (isFront) front = { x, y };
      });

      techs.forEach((el, i) => {
        const th = (i / techs.length) * Math.PI * 2 - time * 0.12 - rot * 0.25;
        const depth = Math.sin(th);
        const f = (depth + 1) / 2;
        const x = cx + Math.cos(th) * rx * 0.66;
        const y = cy + depth * ry * 0.66;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${(0.7 + 0.3 * f).toFixed(3)})`;
        el.style.opacity = (0.06 + 0.5 * Math.pow(f, 2)).toFixed(3);
        el.style.zIndex = String(depth > 0 ? 6 : 1);
      });

      if (beam) {
        beam.setAttribute("x1", String(cx));
        beam.setAttribute("y1", String(cy));
        beam.setAttribute("x2", String(front.x));
        beam.setAttribute("y2", String(front.y));
      }
      if (comet) {
        const th = time * 0.9;
        const x = cx + Math.cos(th) * rx;
        const y = cy + Math.sin(th) * ry;
        comet.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%)`;
        comet.style.zIndex = Math.sin(th) > 0 ? "12" : "1";
      }

      const idx = ((Math.round(rot) % N) + N) % N;
      if (idx !== lastActive) {
        lastActive = idx;
        setActive(idx);
      }
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
    };
  }, []);

  /* bring capability i to the front */
  const jump = (i: number) => {
    const st = stRef.current;
    if (st) {
      const pos = st.start + (i / (N - 1)) * (st.end - st.start);
      const lenis = getLenis();
      if (lenis) lenis.scrollTo(pos, { duration: 1.2 });
      else window.scrollTo({ top: pos, behavior: "smooth" });
    } else {
      const cur = Math.round(target.current);
      const delta = ((((i - cur) % N) + N + Math.floor(N / 2)) % N) - Math.floor(N / 2);
      target.current = cur + delta;
    }
  };

  const svc = SERVICES[active];

  return (
    <section id="services" className="svc" ref={root}>
      <div className="manifesto wrap">
        {/* opaque HTML: SplitText splits it into words */}
        <p className="manifesto-text" dangerouslySetInnerHTML={{ __html: MANIFESTO }} />
      </div>

      <div className="svc-scroller" ref={scrollerRef}>
      <div className="svc-pin">
        <div className="svc-stage wrap">
          <div className="svc-left">
            <SectionHead title="Everything you need to *go digital,* under one roof." />

            <div className="svc-detail">
              <div className="svc-detail-index">
                <span className="svc-detail-num">{pad(active + 1)}</span>
                <span className="svc-detail-total">/ {pad(N)}</span>
                <span className="svc-detail-icon">{SERVICE_ICONS[active]}</span>
              </div>
              <h3 className="svc-detail-title" key={`t-${active}`}>
                {svc.label}
              </h3>
              <p className="svc-detail-desc" key={`d-${active}`}>
                {svc.desc}
              </p>
              <ul className="svc-detail-tags" key={`g-${active}`}>
                {svc.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <Link href={svc.page} className="svc-detail-link" key={`l-${active}`}>
                Explore {svc.label} <span aria-hidden="true">→</span>
              </Link>
            </div>

            <div className="svc-ticks" aria-hidden="true">
              {SERVICES.map((s, i) => (
                <button
                  key={s.label}
                  tabIndex={-1}
                  className={`svc-tick${i === active ? " is-active" : ""}`}
                  onClick={() => jump(i)}
                  aria-label={s.label}
                />
              ))}
            </div>
          </div>

          <div className="svc-orbit" ref={orbitRef} aria-hidden="true">
            <div className="svc-ring svc-ring-outer" />
            <div className="svc-ring svc-ring-inner" />
            <svg className="svc-beam">
              <defs>
                <linearGradient id="svc-beam-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ffe08a" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#e7b53c" stopOpacity="0.15" />
                </linearGradient>
              </defs>
              <line stroke="url(#svc-beam-grad)" strokeWidth="1" strokeDasharray="3 5" />
            </svg>
            <div className="svc-core" data-fx="globe" data-fx-opacity="0.95" data-fx-opacity-sm="0.75">
              <div className="svc-core-glow" />
              <span className="svc-core-ring r1" />
              <span className="svc-core-ring r2" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" width={389} height={363} />
            </div>
            <span className="svc-comet" />
            {TECH_RING.map((t) => (
              <span className="svc-tech" key={t}>
                {t}
              </span>
            ))}
            {SERVICES.map((s, i) => (
              <button key={s.label} className="svc-node" tabIndex={-1} onClick={() => jump(i)}>
                <span className="svc-node-icon">{SERVICE_ICONS[i]}</span>
                <span className="svc-node-label">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      </div>

      {/* Full list: the layout on small screens, and the accessible
          version of the orbit everywhere else */}
      <ol className="svc-cards wrap">
        {SERVICES.map((s, i) => (
          <li className="svc-card" key={s.label}>
            <span className="svc-card-num">{pad(i + 1)}</span>
            <span className="svc-card-icon">{SERVICE_ICONS[i]}</span>
            <h3 className="svc-card-title">
              <Link href={s.page}>{s.label}</Link>
            </h3>
            <p className="svc-card-desc">{s.desc}</p>
            <ul className="svc-card-tags">
              {s.tags.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}
