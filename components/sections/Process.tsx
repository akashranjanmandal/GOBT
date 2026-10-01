"use client";

import { useRef } from "react";
import { PROCESS_STEPS } from "@/lib/content";
import { gsap, ScrollTrigger, useGSAP, MQ_MOTION_DESKTOP } from "@/lib/gsap";
import SectionHead from "@/components/ui/SectionHead";
import { IconCheck } from "@/components/ui/icons";

/* ── mock "screens" that act out each step ── */

function BriefMock() {
  const rows = [
    ["Business", "Who you are and where you're heading"],
    ["Users", "Who it's for and what they need"],
    ["Success", "The number that proves it worked"],
    ["Scope", "What's in, what's out, what's later"],
  ];
  return (
    <div className="mock">
      <div className="mock-bar m-in">
        <span>Project brief</span>
      </div>
      <div className="mock-body">
        {rows.map(([k, v]) => (
          <div className="brief-row m-in" key={k}>
            <span className="brief-check m-pop"><IconCheck /></span>
            <span className="brief-key">{k}</span>
            <span className="brief-val m-type">{v}</span>
          </div>
        ))}
        <div className="brief-meter m-in">
          <span className="brief-meter-label">Problem scoped</span>
          <span className="brief-meter-track"><span className="m-grow" /></span>
          <span className="brief-meter-pct">100%</span>
        </div>
      </div>
      <div className="mock-stamp m-pop">Scope locked</div>
    </div>
  );
}

function BuildMock() {
  const code = [
    ["k", "export default function", "f", " Home", "p", "() {"],
    ["p", "  return ("],
    ["t", "    <Hero", "a", " headline", "p", "={brief.goal} />"],
    ["t", "    <Features", "a", " items", "p", "={scope.core} />"],
    ["t", "    <Checkout", "a", " provider", "s", '="razorpay"', "p", " />"],
    ["p", "  );"],
    ["p", "}"],
  ];
  return (
    <div className="mock mock-build">
      <div className="mock-bar m-in">
        <span>home.tsx</span>
        <span>Live preview</span>
      </div>
      <div className="build-split">
        <pre className="build-code">
          {code.map((line, i) => (
            <span className="build-line m-in" key={i}>
              <span className="build-ln">{i + 1}</span>
              {line.reduce<React.ReactNode[]>((acc, part, j) => {
                if (j % 2 === 0) return acc;
                acc.push(
                  <span className={`tok-${line[j - 1]}`} key={j}>
                    {part}
                  </span>
                );
                return acc;
              }, [])}
            </span>
          ))}
        </pre>
        <div className="build-preview">
          <span className="bp-nav m-in" />
          <span className="bp-hero m-in"><i /><i /><b /></span>
          <span className="bp-cards">
            <span className="m-in" />
            <span className="m-in" />
            <span className="m-in" />
          </span>
          <span className="bp-cta m-pop" />
        </div>
      </div>
      <div className="build-days">
        {["Day 03", "Day 06", "Day 09"].map((d) => (
          <span className="build-day m-in" key={d}>
            <i className="m-pop" /> {d} · preview shared
          </span>
        ))}
      </div>
    </div>
  );
}

function LaunchMock() {
  const log = [
    ["Build passed", "12.4s"],
    ["Security & QA scan · 0 issues", "OK"],
    ["Deployed to production", "LIVE"],
  ];
  return (
    <div className="mock mock-launch">
      <div className="mock-bar m-in">
        <span>Deployment</span>
        <span className="mock-live">Live</span>
      </div>
      <div className="mock-body">
        {log.map(([a, b]) => (
          <div className="launch-log m-in" key={a}>
            <span className="launch-ok m-pop"><IconCheck /></span>
            <span className="launch-text">{a}</span>
            <span className="launch-meta">{b}</span>
          </div>
        ))}
        <div className="launch-chart m-in">
          <span className="launch-chart-label">Growth after launch</span>
          <svg viewBox="0 0 320 110" preserveAspectRatio="none">
            <defs>
              <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e7b53c" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#e7b53c" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path className="lc-area m-fade" d="M0 100 C40 96 60 90 90 84 S140 70 170 58 S230 36 260 24 S300 10 320 6 L320 110 L0 110Z" fill="url(#lc-fill)" />
            <path className="m-draw" d="M0 100 C40 96 60 90 90 84 S140 70 170 58 S230 36 260 24 S300 10 320 6" fill="none" stroke="#ffe08a" strokeWidth="2" />
          </svg>
        </div>
        <div className="launch-handover">
          {["Source code", "Ownership", "Roadmap"].map((h) => (
            <span className="handover-chip m-pop" key={h}>
              <IconCheck /> {h}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

const MOCKS = [BriefMock, BuildMock, LaunchMock];

/* Build the "acting out" timeline for one step's mock */
function mockTimeline(panel: HTMLElement) {
  const tl = gsap.timeline({ paused: true });
  const all = (sel: string) => Array.from(panel.querySelectorAll<HTMLElement>(sel));
  const add = (sel: string, vars: gsap.TweenVars, at: number) => {
    const els = all(sel);
    if (els.length) tl.from(els, vars, at);
  };
  add(".proc-step-copy > *", { autoAlpha: 0, y: 34, duration: 1, ease: "expo.out", stagger: 0.08 }, 0);
  add(".m-in", { autoAlpha: 0, y: 14, duration: 0.55, ease: "power3.out", stagger: 0.12 }, 0.1);
  panel.querySelectorAll<SVGPathElement>(".m-draw").forEach((path) => {
    const len = path.getTotalLength();
    tl.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut" }, 0.5);
  });
  add(".m-fade", { autoAlpha: 0, duration: 1.2 }, 1.1);
  add(".m-grow", { scaleX: 0, transformOrigin: "left", duration: 1.4, ease: "power2.inOut" }, 0.6);
  add(".m-pop", { scale: 0, autoAlpha: 0, duration: 0.5, ease: "back.out(2.2)", stagger: 0.14 }, 0.7);
  return tl;
}

/* ──────────────────────────────────────────
   PROCESS — three chapters on a horizontal rail
────────────────────────────────────────── */
export default function Process() {
  const root = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const panels = gsap.utils.toArray<HTMLElement>(".proc-step");

      mm.add(MQ_MOTION_DESKTOP, () => {
        const track = trackRef.current;
        const scroller = scrollerRef.current;
        if (!track || !scroller) return;
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        /* sticky stage (CSS) inside a scroller as tall as the travel */
        const size = () => {
          scroller.style.height = `${window.innerHeight + distance()}px`;
        };
        size();
        ScrollTrigger.addEventListener("refreshInit", size);
        const slide = gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: scroller,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (fillRef.current) fillRef.current.style.transform = `scaleX(${self.progress})`;
              railRef.current?.setAttribute("data-step", String(Math.round(self.progress * 3)));
            },
          },
        });

        panels.forEach((panel) => {
          const tl = mockTimeline(panel);
          ScrollTrigger.create({
            trigger: panel,
            containerAnimation: slide,
            start: "left 55%",
            onEnter: () => tl.play(),
          });
          /* the big outline number drifts against the slide */
          const num = panel.querySelector(".proc-num");
          if (num) {
            gsap.fromTo(
              num,
              { xPercent: 30 },
              { xPercent: -30, ease: "none", scrollTrigger: { trigger: panel, containerAnimation: slide, start: "left right", end: "right left", scrub: true } }
            );
          }
        });

        return () => {
          ScrollTrigger.removeEventListener("refreshInit", size);
          scroller.style.height = "";
        };
      });

      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference), (hover: none) and (prefers-reduced-motion: no-preference)", () => {
        panels.forEach((panel) => {
          const tl = mockTimeline(panel);
          ScrollTrigger.create({ trigger: panel, start: "top 70%", onEnter: () => tl.play() });
        });
      });

      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="process" className="proc" ref={root}>
      <div className="proc-scroller" ref={scrollerRef}>
      <div className="proc-pin">
        <div className="proc-rail wrap" ref={railRef} data-step="0" aria-hidden="true">
          <span className="proc-rail-track">
            <span className="proc-rail-fill" ref={fillRef} />
          </span>
          {PROCESS_STEPS.map((s, i) => (
            <span className={`proc-station s${i + 1}`} key={s.title}>
              <i />
              {String(i + 1).padStart(2, "0")} {s.title}
            </span>
          ))}
        </div>

        <div className="proc-track" ref={trackRef}>
          <div className="proc-panel proc-intro">
            <div className="wrap">
              <SectionHead title="Three steps. *No black box.*" lede="You always know what stage your project is at, and you always see it working before it's finished." />
              <p className="proc-hint">
                <span className="proc-hint-line" /> Follow a project from first call to launch
              </p>
            </div>
          </div>

          {PROCESS_STEPS.map((step, i) => {
            const Mock = MOCKS[i];
            return (
              <div className="proc-panel proc-step" key={step.title}>
                <span className="proc-num" aria-hidden="true">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="proc-step-copy">
                  <span className="proc-step-kicker">Step {String(i + 1).padStart(2, "0")} / 03</span>
                  <h3 className="proc-step-title">{step.title}</h3>
                  <p className="proc-step-desc">{step.desc}</p>
                </div>
                <div className="proc-step-mock">
                  <Mock />
                </div>
              </div>
            );
          })}
        </div>

        <div className="proc-fx" data-fx="helix" data-fx-fit="width" data-fx-opacity="0.5" data-fx-opacity-sm="0.35" data-fx-y="0.9" aria-hidden="true" />
      </div>
      </div>
    </section>
  );
}
