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
      draggable={false}
    >
      <span className="cl-logo">
        <Image src={client.logo} alt={hidden ? "" : client.name} fill sizes="140px" draggable={false} />
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
    /* drag / swipe: the rows keep scrolling on their own, and can also be
       pulled either way by hand (mouse or finger), with a little glide
       after letting go. No buttons. */
    const drag = tracks.map(() => ({ on: false, id: -1, x: 0, moved: 0, vel: 0, t: 0 }));
    const halves = tracks.map((t) => t.scrollWidth / 2);
    let skew = 0;
    const paint = (i: number) => {
      tracks[i].style.transform = `translate3d(${pos[i]}px,0,0) skewX(${(-skew).toFixed(2)}deg)`;
    };
    const nudge = (i: number, dx: number) => {
      const half = halves[i];
      if (!half) return;
      pos[i] = gsap.utils.wrap(-half, 0, pos[i] + dx);
      paint(i);
    };
    const cleanups = tracks.map((t, i) => {
      const row = t.parentElement as HTMLElement;
      const on = () => (paused[i] = true);
      const off = () => {
        if (!drag[i].on) paused[i] = false;
      };
      const down = (e: PointerEvent) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        const d = drag[i];
        Object.assign(d, { on: true, id: e.pointerId, x: e.clientX, moved: 0, vel: 0, t: performance.now() });
        paused[i] = true;
      };
      const move = (e: PointerEvent) => {
        const d = drag[i];
        if (!d.on || e.pointerId !== d.id) return;
        const dx = e.clientX - d.x;
        if (d.moved < 6 && Math.abs(dx) >= 6 && !row.hasPointerCapture(e.pointerId)) {
          row.setPointerCapture(e.pointerId);
          row.classList.add("is-dragging");
        }
        const now = performance.now();
        d.vel = (dx / Math.max(1, now - d.t)) * 1000;
        d.t = now;
        d.x = e.clientX;
        d.moved += Math.abs(dx);
        nudge(i, dx);
      };
      const up = (e: PointerEvent) => {
        const d = drag[i];
        if (!d.on || e.pointerId !== d.id) return;
        d.on = false;
        row.classList.remove("is-dragging");
        if (row.hasPointerCapture(e.pointerId)) row.releasePointerCapture(e.pointerId);
        if (e.pointerType !== "mouse" || !row.matches(":hover")) paused[i] = false;
        /* a fling keeps going for a moment (unless motion is reduced) */
        if (reduced) d.vel = 0;
      };
      /* a drag must not open the client's website */
      const click = (e: MouseEvent) => {
        if (drag[i].moved > 6) {
          e.preventDefault();
          e.stopPropagation();
        }
        drag[i].moved = 0;
      };
      t.addEventListener("pointerenter", on);
      t.addEventListener("pointerleave", off);
      t.addEventListener("focusin", on);
      t.addEventListener("focusout", off);
      row.addEventListener("pointerdown", down);
      row.addEventListener("pointermove", move);
      row.addEventListener("pointerup", up);
      row.addEventListener("pointercancel", up);
      row.addEventListener("click", click, true);
      return () => {
        t.removeEventListener("pointerenter", on);
        t.removeEventListener("pointerleave", off);
        t.removeEventListener("focusin", on);
        t.removeEventListener("focusout", off);
        row.removeEventListener("pointerdown", down);
        row.removeEventListener("pointermove", move);
        row.removeEventListener("pointerup", up);
        row.removeEventListener("pointercancel", up);
        row.removeEventListener("click", click, true);
      };
    });
    let visible = false;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);
    /* loop width, measured on resize rather than every frame */
    const ro = new ResizeObserver(() => tracks.forEach((t, i) => (halves[i] = t.scrollWidth / 2)));
    tracks.forEach((t) => ro.observe(t));

    const tick = (_t: number, dms: number) => {
      if (!visible || reduced) return;
      const dt = Math.min(dms / 1000, 0.05);
      const v = getLenis()?.velocity ?? 0;
      skew += (Math.max(-7, Math.min(7, v * 0.25)) - skew) * 0.1;
      tracks.forEach((_track, i) => {
        const half = halves[i];
        if (!half) return;
        const d = drag[i];
        if (d.on) {
          paint(i);
          return;
        }
        const dir = i % 2 === 0 ? -1 : 1;
        const speed = paused[i] ? 0 : 38 + Math.min(Math.abs(v) * 30, 900);
        /* the glide left over from a fling fades out smoothly */
        d.vel *= Math.pow(0.04, dt);
        if (Math.abs(d.vel) < 4) d.vel = 0;
        pos[i] = gsap.utils.wrap(-half, 0, pos[i] + (dir * speed + d.vel) * dt);
        paint(i);
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
