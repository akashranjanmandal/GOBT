"use client";

import { useEffect, useRef, useState } from "react";
import SectionHead from "@/components/ui/SectionHead";
import { prefersReducedMotion } from "@/lib/scroll";

/* Source shown on the scanner screen. Each line is [text, kind]
   tokens; a token whose kind starts with "bug:" is a planted flaw. */
type Tok = [string, string];
const CODE: Tok[][] = [
  [["import", "k"], [" { db } ", "p"], ["from", "k"], [' "./db"', "s"], [";", "p"]],
  [],
  [["export async function", "k"], [" getUser", "f"], ["(req) {", "p"]],
  [["  const", "k"], [" id = req.query.id;", "p"]],
  [["  return", "k"], [" db.query(", "p"], ['"SELECT * FROM users WHERE id=" + id', "bug:0"], [");", "p"]],
  [["}", "p"]],
  [],
  [["function", "k"], [" render", "f"], ["(params) {", "p"]],
  [["  el.", "p"], ["innerHTML = params.q", "bug:1"], [";", "p"]],
  [["}", "p"]],
  [],
  [["const", "k"], [" STRIPE_KEY = ", "p"], ['"sk_live_9fA2xQ7…"', "bug:2"], [";", "p"]],
  [],
  [["function", "k"], [" canDelete", "f"], ["(user) {", "p"]],
  [["  if", "k"], [" (", "p"], ['user.role = "admin"', "bug:3"], [") ", "p"], ["return", "k"], [" true", "s"], [";", "p"]],
  [["  return", "k"], [" false", "s"], [";", "p"]],
  [["}", "p"]],
  [],
  [["// package.json", "c"]],
  [['"dependencies"', "s"], [": { ", "p"], ['"lodash": "4.17.4"', "bug:4"], [" }", "p"]],
];

const THREATS = ["SQL injection", "XSS vector", "Hard-coded secret", "Auth logic flaw", "Vulnerable dependency"];

type Status = "hidden" | "detected" | "patched";

export default function Security() {
  const screenRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [statuses, setStatuses] = useState<Status[]>(THREATS.map(() => "hidden"));

  useEffect(() => {
    const screen = screenRef.current;
    const canvas = canvasRef.current;
    if (!screen || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = prefersReducedMotion();

    let W = 0, H = 0, dpr = 1;
    let fontPx = 13, lineH = 22, padX = 54, padY = 30, charW = 7.8;
    let family = "monospace";

    const status: Status[] = THREATS.map(() => "hidden");
    const dwell = THREATS.map(() => 0);
    let bugs: { x: number; y: number; w: number; line: number; id: number }[] = [];
    let lensR = 70;
    let codeCx = 0, codeW = 0;
    let lx = 0, ly = 0, mx = 0, my = 0;
    let manual = false;
    let lastPointer = 0;
    let t = 0;
    let clearAt = 0;
    let visible = false;
    let raf = 0;

    const layout = () => {
      const r = screen.getBoundingClientRect();
      W = r.width;
      H = r.height;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      family = getComputedStyle(canvas).fontFamily || "monospace";
      fontPx = W < 480 ? 10.5 : W < 640 ? 12 : 13;
      lineH = Math.min(24, (H - 40) / CODE.length);
      padX = W < 480 ? 34 : 54;
      padY = (H - lineH * CODE.length) / 2 + lineH * 0.6;
      ctx.font = `${fontPx}px ${family}`;
      charW = ctx.measureText("M").width;
      lensR = Math.max(48, Math.min(84, W * 0.12));
      codeW = Math.max(...CODE.map((line) => line.reduce((n, [text]) => n + text.length, 0))) * charW;
      codeCx = padX + codeW / 2;
      bugs = [];
      CODE.forEach((line, li) => {
        let col = 0;
        line.forEach(([text, kind]) => {
          if (kind.startsWith("bug:")) {
            bugs.push({ x: padX + (col + text.length / 2) * charW, y: padY + li * lineH, w: text.length * charW, line: li, id: Number(kind.slice(4)) });
          }
          col += text.length;
        });
      });
      if (!lx && !ly) {
        lx = W * 0.5;
        ly = H * 0.5;
      }
    };

    const COLORS: Record<string, string> = { k: "#e7b53c", f: "#ffe08a", s: "#c9a86a", p: "#b9ae93", c: "#6c6553" };
    const LENS_COLORS: Record<string, string> = { k: "#7a4f06", f: "#5a3b05", s: "#6b5523", p: "#2a2418", c: "#8a8068" };

    const drawCode = (inLens: boolean) => {
      ctx.font = `${fontPx}px ${family}`;
      ctx.textBaseline = "middle";
      CODE.forEach((line, li) => {
        const y = padY + li * lineH;
        ctx.fillStyle = inLens ? "rgba(40,30,10,0.35)" : "rgba(146,137,112,0.35)";
        ctx.textAlign = "right";
        ctx.fillText(String(li + 1), padX - 16, y);
        ctx.textAlign = "left";
        let x = padX;
        line.forEach(([text, kind]) => {
          if (kind.startsWith("bug:")) {
            const id = Number(kind.slice(4));
            if (inLens) {
              const patched = status[id] === "patched";
              ctx.fillStyle = patched ? "rgba(168,118,26,0.18)" : "rgba(255,70,50,0.16)";
              ctx.fillRect(x - 3, y - lineH / 2 + 2, text.length * charW + 6, lineH - 4);
              ctx.fillStyle = patched ? "#8a5d0c" : "#d0281b";
              ctx.fillText(text, x, y);
              /* squiggle or strike */
              ctx.beginPath();
              if (patched) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + text.length * charW, y);
              } else {
                for (let k = 0; k <= text.length * charW; k += 3) ctx.lineTo(x + k, y + lineH * 0.36 + Math.sin(k * 0.9) * 1.4);
              }
              ctx.strokeStyle = patched ? "#a8761a" : "#d0281b";
              ctx.lineWidth = 1.2;
              ctx.stroke();
            } else {
              ctx.fillStyle = COLORS.s;
              ctx.fillText(text, x, y);
            }
          } else {
            ctx.fillStyle = (inLens ? LENS_COLORS : COLORS)[kind] ?? COLORS.p;
            ctx.fillText(text, x, y);
          }
          x += text.length * charW;
        });
      });
    };

    const drawBugGlyph = (x: number, y: number, s: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.strokeStyle = "#d0281b";
      ctx.fillStyle = "#d0281b";
      ctx.lineWidth = 1.4;
      ctx.lineCap = "round";
      for (let i = -1; i <= 1; i++) {
        [-1, 1].forEach((side) => {
          ctx.beginPath();
          ctx.moveTo(side * s * 0.2, i * s * 0.22);
          ctx.lineTo(side * s * 0.5, i * s * 0.3 + i * 2);
          ctx.stroke();
        });
      }
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.22, s * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -s * 0.42, s * 0.13, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const drawCheck = (x: number, y: number) => {
      ctx.save();
      ctx.strokeStyle = "#e7b53c";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(x - 5, y);
      ctx.lineTo(x - 1, y + 4);
      ctx.lineTo(x + 6, y - 5);
      ctx.stroke();
      ctx.restore();
    };

    const frame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      /* base: dark screen + faint grid + code */
      ctx.fillStyle = "rgba(8, 6, 4, 0.7)";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(231,181,60,0.045)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= W; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      drawCode(false);
      bugs.forEach((b) => {
        if (status[b.id] === "patched") drawCheck(b.x + b.w / 2 + 14, b.y);
      });

      /* lens: x-ray view */
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = "#f3e9cf";
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(90,60,10,0.08)";
      for (let x = 0; x <= W; x += 24) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
      for (let y = 0; y <= H; y += 24) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
      drawCode(true);
      /* the bug glyph sits on the flagged token at the point nearest
         the lens, so it is always inside the x-ray view */
      bugs.forEach((b) => {
        if (status[b.id] === "patched") return;
        const gx = Math.max(b.x - b.w / 2 + 8, Math.min(b.x + b.w / 2 - 8, lx));
        const gy = b.y - lineH * 0.95;
        if (Math.hypot(lx - gx, ly - gy) < lensR) drawBugGlyph(gx, gy, 17);
      });
      ctx.restore();

      /* lens chrome */
      ctx.beginPath();
      ctx.arc(lx, ly, lensR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,224,138,0.85)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(lx, ly, lensR + 9, -t * 1.6, -t * 1.6 + Math.PI * 0.5);
      ctx.strokeStyle = "rgba(231,181,60,0.6)";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(lx, ly, lensR + 9, -t * 1.6 + Math.PI, -t * 1.6 + Math.PI * 1.5);
      ctx.stroke();
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => {
        ctx.beginPath();
        ctx.moveTo(lx + dx * (lensR + 4), ly + dy * (lensR + 4));
        ctx.lineTo(lx + dx * (lensR + 16), ly + dy * (lensR + 16));
        ctx.strokeStyle = "rgba(255,224,138,0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    };

    let last = performance.now();
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible) return;
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      t += dt;

      manual = performance.now() - lastPointer < 1600;
      let tx: number, ty: number;
      if (manual) {
        tx = mx;
        ty = my;
      } else {
        /* auto-patrol: hunt the next unpatched flaw top to bottom and
           circle it while the patch lands; wander once all are fixed */
        const next = bugs.find((b) => status[b.id] !== "patched");
        if (next) {
          tx = next.x + Math.cos(t * 2.1) * 12;
          ty = next.y + Math.sin(t * 2.6) * 8;
        } else {
          tx = codeCx + codeW * 0.38 * Math.sin(t * 0.55);
          ty = H * (0.5 + 0.3 * Math.sin(t * 0.83 + 1.3));
        }
      }
      const k = 1 - Math.exp(-dt * (manual ? 14 : 2.2));
      lx += (tx - lx) * k;
      ly += (ty - ly) * k;

      let changed = false;
      bugs.forEach((b) => {
        if (status[b.id] === "patched") return;
        const inLens = Math.hypot(lx - b.x, ly - b.y) < lensR * 0.7 + b.w * 0.22;
        dwell[b.id] = inLens ? dwell[b.id] + dt : Math.max(0, dwell[b.id] - dt * 0.5);
        const next: Status = dwell[b.id] > 0.55 ? "patched" : inLens ? "detected" : status[b.id] === "detected" && dwell[b.id] > 0 ? "detected" : "hidden";
        if (next !== status[b.id]) {
          status[b.id] = next;
          changed = true;
        }
      });

      const allDone = status.every((s) => s === "patched");
      if (allDone && !clearAt) clearAt = t;
      if (clearAt && t - clearAt > 4) {
        status.fill("hidden");
        dwell.fill(0);
        clearAt = 0;
        changed = true;
      }
      if (changed) setStatuses([...status]);
      frame();
    };

    const onMove = (e: PointerEvent) => {
      const r = screen.getBoundingClientRect();
      mx = e.clientX - r.left;
      my = e.clientY - r.top;
      lastPointer = performance.now();
    };
    const onLeave = () => {
      lastPointer = 0;
    };

    layout();
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(screen);
    const ro = new ResizeObserver(() => {
      layout();
      frame();
    });
    ro.observe(screen);
    document.fonts?.ready.then(() => {
      layout();
      frame();
    });
    screen.addEventListener("pointermove", onMove);
    screen.addEventListener("pointerdown", onMove);
    screen.addEventListener("pointerleave", onLeave);

    if (reduced) {
      status.fill("patched");
      setStatuses([...status]);
      frame();
    } else {
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      screen.removeEventListener("pointermove", onMove);
      screen.removeEventListener("pointerdown", onMove);
      screen.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  const patched = statuses.filter((s) => s === "patched").length;
  const detected = statuses.findIndex((s) => s === "detected");
  const allClear = patched === THREATS.length;
  const headline = allClear ? "All clear — ready to ship" : detected >= 0 ? `Threat detected · ${THREATS[detected]}` : "Scanning build…";

  return (
    <section id="security" className="sec">
      <div className="wrap sec-grid">
        <div className="sec-copy">
          <SectionHead title="We hunt bugs *before your users do.*" lede="Every build goes through a security and QA pass before launch. Take over the scanner — move your cursor across the screen and find the flaws hiding in this code." />
          <ul className="sec-threats" data-reveal="stagger">
            {THREATS.map((name, i) => (
              <li className={`sec-threat is-${statuses[i]}`} key={name}>
                <span className="sec-threat-idx">{String(i + 1).padStart(2, "0")}</span>
                <span className="sec-threat-name">{name}</span>
                <span className="sec-threat-state">{statuses[i] === "hidden" ? "Hidden" : statuses[i] === "detected" ? "Detected" : "Patched"}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="sec-device" data-reveal="fade">
          <div className="sec-fx" data-fx="shield" data-fx-opacity="0.6" data-fx-opacity-sm="0.45" aria-hidden="true" />
          <div className="sec-bar">
            <span>Security scan</span>
          </div>
          <div className="sec-screen" ref={screenRef}>
            <canvas ref={canvasRef} className="sec-canvas" aria-label="Animated code scanner revealing planted vulnerabilities" role="img" />
            <span className="sec-corner tl" />
            <span className="sec-corner tr" />
            <span className="sec-corner bl" />
            <span className="sec-corner br" />
          </div>
          <div className={`sec-status${allClear ? " is-clear" : detected >= 0 ? " is-alert" : ""}`} aria-live="polite">
            <span className="sec-status-text">{headline}</span>
            <span className="sec-status-count">
              Patched <b>{patched}</b>/{THREATS.length}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
