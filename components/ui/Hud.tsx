"use client";

import { useRef } from "react";
import { ScrollTrigger, useGSAP } from "@/lib/gsap";

/* A thin scroll-depth line on the right edge — nothing else */
export default function Hud() {
  const fillRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const st = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        if (fillRef.current) fillRef.current.style.transform = `scaleY(${self.progress})`;
      },
    });
    return () => st.kill();
  });

  return (
    <div className="hud" aria-hidden="true">
      <span className="hud-track">
        <span className="hud-fill" ref={fillRef} />
      </span>
    </div>
  );
}
