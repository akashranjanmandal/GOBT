"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { CLIENTS, GOBT_STATS, type Client } from "@/lib/content";
import { gsap, ScrollTrigger, useGSAP, MQ_MOTION } from "@/lib/gsap";
import { getLenis, prefersReducedMotion } from "@/lib/scroll";
import SectionHead from "@/components/ui/SectionHead";

function Plate({ client, hidden }: { client: Client; hidden?: boolean }) {
  return (
    <a
      className={`cl-plate cl-${client.logoMode}${client.hoverColor ? " cl-hover-color" : ""}`}
      href={`https://${client.url}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <span className="cl-logo">
        <Image src={client.logo} alt={hidden ? "" : client.name} fill sizes="140px" />
      </span>
      <span className="cl-info">
        <span className="cl-name">{client.name}</span>
        <span className="cl-meta">
          {client.type} · Since {client.since}
        </span>
      </span>
    </a>
  );
}

/* ──────────────────────────────────────────
   CLIENTS + STATS
   Two counter-running rows of client plates whose speed and skew
   react to scroll velocity, then the numbers counting up.
────────────────────────────────────────── */
export default function Clients() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const tracks = Array.from(el.querySelectorAll<HTMLElement>(".cl-track"));
    const reduced = prefersReducedMotion();
    const pos = tracks.map(() => 0);
    const paused = tracks.map(() => false);
    const cleanups = tracks.map((t, i) => {
      const on = () => (paused[i] = true);
      const off = () => (paused[i] = false);
      t.addEventListener("pointerenter", on);
      t.addEventListener("pointerleave", off);
      t.addEventListener("focusin", on);
      t.addEventListener("focusout", off);
      return () => {
        t.removeEventListener("pointerenter", on);
        t.removeEventListener("pointerleave", off);
        t.removeEventListener("focusin", on);
        t.removeEventListener("focusout", off);
      };
    });
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    let skew = 0;
    /* loop width, measured on resize rather than every frame */
    const halves = tracks.map((t) => t.scrollWidth / 2);
    const ro = new ResizeObserver(() => tracks.forEach((t, i) => (halves[i] = t.scrollWidth / 2)));
    tracks.forEach((t) => ro.observe(t));

    const tick = (_t: number, dms: number) => {
      if (!visible || reduced) return;
      const dt = Math.min(dms / 1000, 0.05);
      const v = getLenis()?.velocity ?? 0;
      skew += (Math.max(-7, Math.min(7, v * 0.25)) - skew) * 0.1;
      tracks.forEach((track, i) => {
        const half = halves[i];
        if (!half) return;
        const dir = i % 2 === 0 ? -1 : 1;
        const speed = paused[i] ? 0 : 38 + Math.min(Math.abs(v) * 30, 900);
        pos[i] = gsap.utils.wrap(-half, 0, pos[i] + dir * speed * dt);
        track.style.transform = `translate3d(${pos[i]}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
      });
    };
    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
      io.disconnect();
      ro.disconnect();
      cleanups.forEach((c) => c());
    };
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        gsap.utils.toArray<HTMLElement>(".stat-num").forEach((el) => {
          const target = Number(el.dataset.val);
          const obj = { v: 0 };
          el.textContent = "0";
          ScrollTrigger.create({
            trigger: el,
            start: "top 90%",
            once: true,
            onEnter: () =>
              gsap.to(obj, {
                v: target,
                duration: 2,
                ease: "power3.out",
                onUpdate: () => {
                  el.textContent = String(Math.round(obj.v));
                },
              }),
          });
        });
        gsap.from(".stat-rule", {
          scaleX: 0,
          transformOrigin: "left",
          duration: 1.4,
          ease: "expo.out",
          stagger: 0.08,
          scrollTrigger: { trigger: ".stats", start: "top 88%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  const rows = [CLIENTS.slice(0, 5), CLIENTS.slice(5)];

  return (
    <section id="clients" className="clients" ref={root}>
      <div className="wrap">
        <SectionHead title="Businesses we’ve helped *go digital.*" className="sh-center" />
      </div>

      <div className="cl-rows">
        {rows.map((row, r) => (
          <div className="cl-row" key={r}>
            <div className="cl-track">
              {row.map((c) => (
                <Plate client={c} key={c.name} />
              ))}
              {row.map((c) => (
                <Plate client={c} key={`${c.name}-dup`} hidden />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="stats wrap">
        {GOBT_STATS.map((s) => (
          <div className="stat" key={s.label}>
            <span className="stat-value">
              <span className="stat-num" data-val={s.val}>
                {s.val}
              </span>
              <span className="stat-sup">{s.sup}</span>
            </span>
            <span className="stat-rule" />
            <span className="stat-label">{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
