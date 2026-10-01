"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/scroll";

/* Elements marked [data-magnetic] lean toward a nearby mouse pointer
   and spring back when it leaves. Mouse/trackpad only. */
export default function Magnetic() {
  useEffect(() => {
    if (!window.matchMedia("(hover: hover)").matches || prefersReducedMotion()) return;

    let magnet: HTMLElement | null = null;
    const release = (el: HTMLElement) => gsap.to(el, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const target = (e.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-magnetic]") ?? null;
      if (target !== magnet) {
        if (magnet) release(magnet);
        magnet = target;
      }
      if (magnet) {
        const r = magnet.getBoundingClientRect();
        gsap.to(magnet, {
          x: (e.clientX - (r.left + r.width / 2)) * 0.28,
          y: (e.clientY - (r.top + r.height / 2)) * 0.32,
          duration: 0.6,
          ease: "power3",
        });
      }
    };
    const onLeave = () => {
      if (magnet) release(magnet);
      magnet = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return null;
}
