"use client";

import { useEffect, useRef } from "react";
import { TEAM } from "@/lib/content";
import { EVT_INTRO, introState } from "@/lib/scroll";
import SectionHead from "@/components/ui/SectionHead";

export default function Team() {
  const gridRef = useRef<HTMLDivElement>(null);

  /* The portrait engine (three.js + off-thread image sampling) warms
     up in idle time shortly after the intro, so nothing is being set
     up while someone is mid-scroll; reaching the team first also
     starts it */
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    let dispose: (() => void) | null = null;
    let cancelled = false;
    let started = false;
    let timer = 0;
    let idleId = 0;
    const start = () => {
      if (started || cancelled) return;
      started = true;
      import("@/components/fx/faceStage")
        .then(({ createFaceStage }) => createFaceStage(grid))
        .then((d) => {
          if (cancelled) d();
          else dispose = d;
        })
        .catch(() => grid.classList.add("no-webgl"));
    };
    const scheduleIdle = () => {
      timer = window.setTimeout(() => {
        if ("requestIdleCallback" in window) idleId = window.requestIdleCallback(start, { timeout: 3000 });
        else start();
      }, 2500);
    };
    if (introState.done) scheduleIdle();
    else window.addEventListener(EVT_INTRO, scheduleIdle, { once: true });
    const io = new IntersectionObserver(([e]) => e.isIntersecting && start(), { rootMargin: "150% 0px" });
    io.observe(grid);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleId) window.cancelIdleCallback(idleId);
      window.removeEventListener(EVT_INTRO, scheduleIdle);
      io.disconnect();
      dispose?.();
    };
  }, []);

  return (
    <section id="team" className="team">
      <div className="rest-fx" data-fx="globe" data-fx-opacity="0" aria-hidden="true" />
      <div className="wrap">
        <SectionHead
          title="The people *behind GOBT.*"
          lede="A small, senior team — which means you talk to the people actually building your product, not an account manager."
        />
        <div className="team-grid" ref={gridRef} data-reveal="stagger">
          {TEAM.map((m) => (
            <article className="idc" key={m.name}>
              <div
                className="idc-portrait"
                data-src={m.photo ?? "/logo.png"}
                data-bust={m.photo ? "1" : "0"}
                role="img"
                aria-label={m.photo ? `Portrait of ${m.name}` : `${m.name} — GOBT`}
              >
                <canvas className="idc-canvas" />
                {/* shown only if WebGL is unavailable */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="idc-fallback" src={m.photo ?? "/logo.png"} alt="" loading="lazy" />
              </div>
              <div className="idc-info">
                <h3 className="idc-name">{m.name}</h3>
                <p className="idc-title">{m.title}</p>
                <blockquote className="idc-quote">“{m.quote}”</blockquote>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
