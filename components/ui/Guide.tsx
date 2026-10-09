"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  EVT_GUIDE,
  GUIDE_STOPS,
  GUIDE_SULKS,
  GUIDE_WELCOMES,
  type GuideMessage,
  type GuideShape,
} from "@/lib/guide";
import { prefersReducedMotion } from "@/lib/scroll";

type Phase = "hidden" | "on" | "angry" | "quiet";

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

/* Harmonic weights (cos kθ for k = 1…6) that give each body shape */
const SHAPES: Record<GuideShape, number[]> = {
  round: [0, 0.02, 0.03, 0, 0, 0],
  flower: [0, 0, 0, 0, 0.13, 0],
  star: [0, 0, 0, 0, 0.19, 0],
  bean: [0, 0.12, 0.05, 0, 0, 0],
  cloud: [0, 0, 0.03, 0, 0, 0.085],
  drop: [0.13, 0.06, 0, 0, 0, 0],
  squircle: [0, 0, 0, 0.09, 0, 0],
};

/* faces: which eyes / mouth / brows to show */
const FACES = {
  happy: ["happy", "open", ""],
  curious: ["round", "small", ""],
  wink: ["wink", "smile", ""],
  love: ["heart", "smile", ""],
  star: ["star", "open", ""],
  wow: ["big", "o", ""],
  focused: ["narrow", "flat", "focused"],
  cat: ["happy", "cat", ""],
  worried: ["round", "wavy", "worried"],
  angry: ["narrow", "frown", "angry"],
  sleepy: ["sleepy", "small", ""],
} as const;
type Face = keyof typeof FACES;

const N = 30; // outline points
const R = 34; // body radius in SVG units (viewBox ±60)
const TRAIL = 7;

/* smooth closed path through points (Catmull-Rom → cubic Bézier) */
function blobPath(pts: number[][]) {
  const n = pts.length;
  let d = `M${pts[0][0].toFixed(2)},${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = pts[(i + 2) % n];
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d + "Z";
}

/* the heading's real text extent: block headings span the full width,
   so measure the glyphs to sit just right of the words */
function measure(el: Element) {
  const box = el.getBoundingClientRect();
  const rects: DOMRect[] = [];
  const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let node = walk.nextNode(); node; node = walk.nextNode()) {
    if (!node.textContent?.trim()) continue;
    range.selectNodeContents(node);
    for (const r of Array.from(range.getClientRects())) if (r.width > 1 && r.height > 1) rects.push(r);
  }
  if (!rects.length) return { right: box.width, top: 0, bottom: box.height };
  return {
    right: Math.max(...rects.map((r) => r.right)) - box.left,
    top: Math.min(...rects.map((r) => r.top)) - box.top,
    bottom: Math.max(...rects.map((r) => r.bottom)) - box.top,
  };
}

/* Types the text out while keeping the bubble at its final size */
function Typed({ text, onTalk }: { text: string; onTalk: (talking: boolean) => void }) {
  const [count, setCount] = useState(() => (prefersReducedMotion() ? text.length : 0));

  useEffect(() => {
    if (count >= text.length) {
      onTalk(false);
      return;
    }
    onTalk(true);
    const id = window.setTimeout(() => setCount((n) => Math.min(text.length, n + 2)), 24);
    return () => window.clearTimeout(id);
  }, [count, text, onTalk]);

  return (
    <p className="gd-text" aria-hidden="true">
      {text.slice(0, count)}
      <span className="gd-ghost">{text.slice(count)}</span>
    </p>
  );
}

/* Bloom — a gooey gold creature that swims around the homepage, parks
   beside whichever section is on screen and tells you about it,
   changing shape and face as it goes. Close makes it sulk and doze off
   beside the section; tapping it brings it back. */
export default function Guide({ active }: { active: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const faceRef = useRef<SVGGElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);

  const [phase, setPhase] = useState<Phase>("hidden");
  const [index, setIndex] = useState(0);
  const [say, setSay] = useState<(GuideMessage & { seq: number }) | null>(null);
  const [line, setLine] = useState("");
  const seq = useRef(0);
  const live = useRef({ phase: "hidden" as Phase, index: 0, talking: false });
  useEffect(() => {
    live.current.phase = phase;
    live.current.index = index;
    /* form help and mood lines always get the bubble */
    live.current.talking = !!say || phase === "angry";
  }, [phase, index, say]);

  const shown = phase !== "hidden";

  const pulse = useCallback((cls: string, ms: number) => {
    const el = rootRef.current;
    if (!el) return;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    window.setTimeout(() => el.classList.remove(cls), ms);
  }, []);

  const onTalk = useCallback((talking: boolean) => {
    rootRef.current?.classList.toggle("is-talking", talking);
  }, []);

  /* every page load starts with Bloom awake, a beat after the loader */
  useEffect(() => {
    if (!active) return;
    const t = window.setTimeout(() => setPhase("on"), 1000);
    return () => window.clearTimeout(t);
  }, [active]);

  /* which section is on screen */
  useEffect(() => {
    if (!shown) return;
    const sections = GUIDE_STOPS.map((s) => document.getElementById(s.id));
    let current = -1;
    let raf = 0;
    let settle = 0;
    const check = () => {
      const lineY = window.innerHeight * 0.45;
      let found = -1;
      sections.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.top <= lineY && r.bottom > lineY) found = i;
      });
      if (found < 0 || found === current) return;
      const first = current < 0;
      current = found;
      setIndex(found);
      if (!first) pulse("is-morphing", 700);
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        window.clearTimeout(settle);
        settle = window.setTimeout(check, 220);
      });
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
    };
  }, [shown, pulse]);

  /* form help from the page */
  useEffect(() => {
    if (phase !== "on") return;
    const onSay = (e: Event) => {
      const msg = (e as CustomEvent<GuideMessage>).detail;
      setSay({ ...msg, seq: ++seq.current });
      if (msg.mood === "happy") pulse("is-cheering", 1300);
      if (msg.mood === "worried") pulse("is-shaking", 600);
    };
    window.addEventListener(EVT_GUIDE, onSay);
    return () => window.removeEventListener(EVT_GUIDE, onSay);
  }, [phase, pulse]);

  useEffect(() => {
    if (!say) return;
    const id = window.setTimeout(() => setSay(null), say.ttl || 6000);
    return () => window.clearTimeout(id);
  }, [say]);

  /* ── the swim: one rAF loop for position, outline, face and trail ── */
  useEffect(() => {
    if (!shown) return;
    const root = rootRef.current;
    const path = pathRef.current;
    const face = faceRef.current;
    const bubble = bubbleRef.current;
    const trail = trailRef.current;
    if (!root || !path || !face || !bubble || !trail) return;

    const reduced = prefersReducedMotion();
    const dots = Array.from(trail.children) as HTMLElement[];
    const vw = () => window.innerWidth;
    const vh = () => window.innerHeight;
    const size = () => (vw() < 700 ? 64 : 96);

    const s = {
      x: vw() / 2,
      y: vh() + 90,
      vx: 0,
      vy: 0,
      w: [...SHAPES.round],
      lx: 0,
      ly: 0,
      side: "",
      history: [] as number[][],
      anchor: null as Element | null,
      anchorIndex: -1,
      ext: { right: 0, top: 0, bottom: 0 },
      measuredAt: 0,
    };
    let pointer: { x: number; y: number } | null = null;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === "mouse") pointer = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let last = performance.now();
    let raf = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const t = now / 1000;
      const L = live.current;
      const S = size();
      const W = vw();
      const H = vh();
      const small = W < 700;
      const bw = bubble.offsetWidth;
      const bh = bubble.offsetHeight;

      /* where to swim */
      let tx: number;
      let ty: number;
      let side: string;
      /* asleep or awake, it stays beside the section — asleep just means no bubble */
      {
        const stop = GUIDE_STOPS[L.index];
        if (s.anchorIndex !== L.index || now - s.measuredAt > 700) {
          s.anchor = document.querySelector(`#${stop.id} ${stop.anchor}`);
          s.anchorIndex = L.index;
          if (s.anchor) s.ext = measure(s.anchor);
          s.measuredAt = now;
        }
        const r = s.anchor?.getBoundingClientRect();
        const ext = stop.place === "above" && r ? { right: r.width, top: 0, bottom: r.height } : s.ext;
        if (!r) {
          tx = W - S / 2 - 20;
          ty = H / 2;
          side = "left";
        } else if (small || stop.place === "above") {
          /* perch at the right, just above the heading (or the form),
             talking to the left into the empty space over it */
          tx = small ? W - S / 2 - 10 : r.left + ext.right - S / 2;
          ty = r.top + ext.top - S / 2 - 6;
          side = "left";
        } else {
          tx = r.left + ext.right + 28 + S / 2;
          ty = r.top + ext.top + S / 2 + 4;
          if (tx + S / 2 > W - 24) {
            /* the words run to the edge: hover above their right end */
            tx = W - S / 2 - 40;
            ty = r.top + ext.top - S / 2 - 10;
          }
          side = tx + S / 2 + 14 + bw < W - 20 ? "right" : "left";
        }
        /* once the heading has scrolled away, stop talking over the content */
        if (r && r.top + ext.bottom < 96 && stop.place !== "above" && !L.talking) side = "none";
        if (L.phase === "quiet") side = "none";
        /* never leave the screen; ride the edge while the heading is away */
        ty = Math.max(84 + S / 2, Math.min(H - S / 2 - 16 - (side === "none" ? 0 : Math.max(0, bh - S) / 2), ty));
        tx = Math.max(S / 2 + 12, Math.min(W - S / 2 - 12, tx));
      }

      /* gentle wander so it never sits dead still */
      if (!reduced) {
        tx += Math.sin(t * 0.8) * 7 + Math.sin(t * 1.9) * 3;
        ty += Math.sin(t * 1.1 + 1.3) * 6;
      }

      /* underdamped spring = a soft, swimmy follow */
      if (reduced) {
        s.x = tx;
        s.y = ty;
        s.vx = s.vy = 0;
      } else {
        const k = 15;
        const c = 6.2;
        s.vx += (k * (tx - s.x) - c * s.vx) * dt;
        s.vy += (k * (ty - s.y) - c * s.vy) * dt;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      }
      const speed = Math.hypot(s.vx, s.vy);

      /* morph toward this section's shape */
      const shape =
        L.phase === "quiet" || L.phase === "angry" ? SHAPES.round : SHAPES[GUIDE_STOPS[L.index].shape];
      const ease = Math.min(1, dt * 2.6);
      for (let k = 0; k < 6; k++) s.w[k] += (shape[k] - s.w[k]) * ease;

      /* outline: harmonics + a living wobble, stretched along the swim */
      const stretch = reduced ? 0 : Math.min(0.38, speed / 1500);
      const ux = speed > 1 ? s.vx / speed : 0;
      const uy = speed > 1 ? s.vy / speed : 0;
      const wob = reduced ? 0 : L.phase === "angry" ? 0.05 : 0.028;
      const pts: number[][] = [];
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2;
        const spin = t * 0.25;
        let rr = 1;
        for (let k = 0; k < 6; k++) rr += s.w[k] * Math.cos((k + 1) * (a - spin) + k * 0.7);
        rr += wob * Math.sin(3 * a + t * 2.1) + wob * 0.8 * Math.sin(5 * a - t * 2.7);
        let px = Math.cos(a) * R * rr;
        let py = Math.sin(a) * R * rr;
        if (stretch > 0.002) {
          const along = px * ux + py * uy;
          const f = along < 0 ? 1 + stretch * 1.3 : 1 + stretch * 0.5;
          const qx = px - along * ux;
          const qy = py - along * uy;
          px = qx * (1 - stretch * 0.4) + along * ux * f;
          py = qy * (1 - stretch * 0.4) + along * uy * f;
        }
        pts.push([px, py]);
      }
      path.setAttribute("d", blobPath(pts));

      /* the face looks where it's swimming, or at the pointer when resting */
      let gx = ux * Math.min(1, speed / 300);
      let gy = uy * Math.min(1, speed / 300);
      if (speed < 120 && pointer) {
        const dx = pointer.x - s.x;
        const dy = pointer.y - s.y;
        const d = Math.hypot(dx, dy) || 1;
        gx = (dx / d) * 0.8;
        gy = (dy / d) * 0.8;
      }
      s.lx += (gx * 7 - s.lx) * Math.min(1, dt * 6);
      s.ly += (gy * 6 - s.ly) * Math.min(1, dt * 6);
      face.setAttribute("transform", `translate(${s.lx.toFixed(2)} ${s.ly.toFixed(2)})`);

      root.style.transform = `translate3d(${(s.x - S / 2).toFixed(1)}px, ${(s.y - S / 2).toFixed(1)}px, 0)`;
      if (side !== s.side) {
        s.side = side;
        root.dataset.side = side;
      }
      root.classList.toggle("is-swimming", speed > 420);

      /* bubbles trail off its tail */
      s.history.unshift([s.x, s.y]);
      if (s.history.length > TRAIL * 4) s.history.pop();
      const show = reduced ? 0 : Math.min(1, Math.max(0, (speed - 140) / 500));
      dots.forEach((dot, i) => {
        const p = s.history[Math.min(s.history.length - 1, (i + 1) * 4)];
        dot.style.transform = `translate3d(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px, 0) scale(${(1 - i / TRAIL).toFixed(2)})`;
        dot.style.opacity = (show * (1 - i / TRAIL) * 0.8).toFixed(2);
      });
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
    };
  }, [shown]);

  /* told to hush: a grumpy line, then it dozes off where it is */
  const hush = () => {
    setLine(pick(GUIDE_SULKS));
    setSay(null);
    setPhase("angry");
    pulse("is-shaking", 600);
  };

  useEffect(() => {
    if (phase !== "angry") return;
    const id = window.setTimeout(() => setPhase("quiet"), 2600);
    return () => window.clearTimeout(id);
  }, [phase]);

  /* tapped while sulking: happily back to work */
  const wake = () => {
    setLine(pick(GUIDE_WELCOMES));
    setPhase("on");
    setSay({ text: "", mood: "happy", ttl: 3800, seq: ++seq.current });
    pulse("is-cheering", 1300);
  };

  if (phase === "hidden") return null;

  const stop = GUIDE_STOPS[index];
  const welcoming = !!say && say.text === "";
  const text = phase === "angry" ? line : welcoming ? line : say ? say.text : stop.text;
  const face: Face =
    phase === "angry"
      ? "angry"
      : phase === "quiet"
        ? "sleepy"
        : say
          ? say.mood === "worried"
            ? "worried"
            : say.mood === "happy"
              ? "happy"
              : stop.face
          : stop.face;
  const [eyes, mouth, brows] = FACES[face];
  const key = phase === "angry" ? "angry" : say ? `say-${say.seq}` : `stop-${index}`;

  return (
    <>
      <div className="gd-trail" ref={trailRef} aria-hidden="true">
        {Array.from({ length: TRAIL }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div
        className={`gd is-${phase}`}
        ref={rootRef}
        data-face={face}
        data-eyes={eyes}
        data-mouth={mouth}
        data-brows={brows}
      >
        <button
          className="gd-blob"
          onClick={phase === "quiet" ? wake : undefined}
          tabIndex={phase === "quiet" ? 0 : -1}
          aria-hidden={phase !== "quiet"}
          aria-label="Wake Bloom, the site guide"
        >
          <span className="gd-steam p1" />
          <span className="gd-steam p2" />
          <span className="gd-zz" aria-hidden="true">
            z<i>z</i>
          </span>
          <svg className="gd-svg" viewBox="-60 -60 120 120" aria-hidden="true">
            <defs>
              <radialGradient id="gd-fill" cx="0.36" cy="0.3" r="0.8">
                <stop offset="0" stopColor="#fff4c4" />
                <stop offset="0.3" stopColor="#ffd766" />
                <stop offset="0.7" stopColor="#e7a92c" />
                <stop offset="1" stopColor="#a8761a" />
              </radialGradient>
            </defs>
            <path className="gd-body" ref={pathRef} fill="url(#gd-fill)" />
            <ellipse className="gd-shine" cx="-14" cy="-19" rx="9" ry="5" transform="rotate(-28 -14 -19)" />
            <circle className="gd-shine2" cx="-24" cy="-8" r="2.4" />
            <g ref={faceRef}>
              <g className="gd-face">
                {/* brows */}
                <path className="gd-b gd-b-worried" d="M-17 -15l9 -3M17 -15l-9 -3" />
                <path className="gd-b gd-b-angry" d="M-18 -19l10 4.5M18 -19l-10 4.5" />
                <path className="gd-b gd-b-focused" d="M-17 -15.5h9M8 -15.5h9" />
                {/* eyes */}
                <g className="gd-e gd-e-round gd-blink">
                  <ellipse cx="-12" cy="-4" rx="5" ry="6.4" />
                  <ellipse cx="12" cy="-4" rx="5" ry="6.4" />
                  <circle className="gd-glint" cx="-10.4" cy="-6.6" r="1.9" />
                  <circle className="gd-glint" cx="13.6" cy="-6.6" r="1.9" />
                  <circle className="gd-glint" cx="-13.6" cy="-1.6" r="0.9" />
                  <circle className="gd-glint" cx="10.4" cy="-1.6" r="0.9" />
                </g>
                <g className="gd-e gd-e-big gd-blink">
                  <ellipse cx="-12.5" cy="-5" rx="6.6" ry="8.2" />
                  <ellipse cx="12.5" cy="-5" rx="6.6" ry="8.2" />
                  <circle className="gd-glint" cx="-10.2" cy="-8.4" r="2.6" />
                  <circle className="gd-glint" cx="14.8" cy="-8.4" r="2.6" />
                  <circle className="gd-glint" cx="-14.6" cy="-1.6" r="1.1" />
                  <circle className="gd-glint" cx="10.4" cy="-1.6" r="1.1" />
                </g>
                <path className="gd-e gd-e-happy gd-stroke" d="M-17 -2.5q5 -7 10 0M7 -2.5q5 -7 10 0" />
                <g className="gd-e gd-e-wink">
                  <ellipse cx="-12" cy="-4" rx="5" ry="6.4" />
                  <circle className="gd-glint" cx="-10.4" cy="-6.6" r="1.9" />
                  <path className="gd-stroke" d="M7 -3.5q5 -5 10 0" />
                </g>
                <g className="gd-e gd-e-heart">
                  <path d="M-12 2.5c-6-4-8.5-7-8.5-10a4.3 4.3 0 0 1 8.5-1.4a4.3 4.3 0 0 1 8.5 1.4c0 3-2.5 6-8.5 10z" />
                  <path d="M12 2.5c-6-4-8.5-7-8.5-10a4.3 4.3 0 0 1 8.5-1.4a4.3 4.3 0 0 1 8.5 1.4c0 3-2.5 6-8.5 10z" />
                </g>
                <g className="gd-e gd-e-star">
                  <path d="M-12 -12l2.2 4.9 5.3.5-4 3.6 1.2 5.2-4.7-2.7-4.7 2.7 1.2-5.2-4-3.6 5.3-.5z" />
                  <path d="M12 -12l2.2 4.9 5.3.5-4 3.6 1.2 5.2-4.7-2.7-4.7 2.7 1.2-5.2-4-3.6 5.3-.5z" />
                </g>
                <g className="gd-e gd-e-narrow">
                  <ellipse cx="-12" cy="-3" rx="5" ry="2.8" />
                  <ellipse cx="12" cy="-3" rx="5" ry="2.8" />
                </g>
                <path className="gd-e gd-e-sleepy gd-stroke" d="M-17 -3q5 3.5 10 0M7 -3q5 3.5 10 0" />
                {/* cheeks */}
                <ellipse className="gd-cheek" cx="-21" cy="6" rx="4.6" ry="2.6" />
                <ellipse className="gd-cheek" cx="21" cy="6" rx="4.6" ry="2.6" />
                {/* mouths */}
                <g className="gd-mouths">
                  <path className="gd-m gd-m-smile gd-stroke" d="M-5.5 7q5.5 5 11 0" />
                  <path className="gd-m gd-m-open" d="M-6.5 6.5h13q-1 8.5-6.5 8.5t-6.5-8.5z" />
                  <path className="gd-m gd-m-small gd-stroke" d="M-2.5 8.5q2.5 2 5 0" />
                  <ellipse className="gd-m gd-m-o" cx="0" cy="10" rx="3.8" ry="4.6" />
                  <path className="gd-m gd-m-flat gd-stroke" d="M-4.5 9h9" />
                  <path className="gd-m gd-m-cat gd-stroke" d="M-7 7q3.5 4 7 0q3.5 4 7 0" />
                  <path className="gd-m gd-m-wavy gd-stroke" d="M-7 10q1.75 -2.5 3.5 0t3.5 0 3.5 0 3.5 0" />
                  <path className="gd-m gd-m-frown gd-stroke" d="M-6 12q6 -6 12 0" />
                  <ellipse className="gd-m-talk" cx="0" cy="9.5" rx="3.6" ry="3.4" />
                </g>
              </g>
            </g>
          </svg>
        </button>

        <div className="gd-bubble" ref={bubbleRef} aria-hidden={phase === "quiet"} inert={phase === "quiet"}>
          {phase === "on" && (
            <button className="gd-close" onClick={hush} aria-label="Hush Bloom, the site guide">
              <svg viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
              </svg>
            </button>
          )}
          <div className="gd-msg" key={key}>
            <Typed text={text} onTalk={onTalk} />
          </div>
          {/* screen readers hear form help and mood changes, not every section */}
          <span className="sr-only" role="status">
            {phase === "angry" || welcoming ? line : say?.text}
          </span>
        </div>
      </div>
    </>
  );
}
