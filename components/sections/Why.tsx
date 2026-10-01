"use client";

import { useRef, useState } from "react";
import { COMPARE_ROWS } from "@/lib/content";
import { gsap, ScrollTrigger, useGSAP, MQ_MOTION } from "@/lib/gsap";
import SectionHead from "@/components/ui/SectionHead";
import { IconCheck, IconCross } from "@/components/ui/icons";

const TOTAL = COMPARE_ROWS.length;

/* ──────────────────────────────────────────
   WHY GOBT — the comparison as a scan. A sticky laser line holds
   at a fixed height while the table scrolls through it; every row
   it crosses gets evaluated, and the score below keeps count.
────────────────────────────────────────── */
export default function Why() {
  const root = useRef<HTMLElement>(null);
  const [scanned, setScanned] = useState(0);
  /* rows are scanned top-down, so the first `scanned` rows are done */
  const done = COMPARE_ROWS.slice(0, scanned);
  const agencyScore = done.filter((r) => r.agency).length;
  const gobtScore = done.filter((r) => r.gobt).length;

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>(".why-row");
      const recount = () => setScanned(rows.filter((r) => r.classList.contains("is-scanned")).length);
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION, () => {
        rows.forEach((row) => {
          ScrollTrigger.create({
            trigger: row,
            start: "center 56%",
            onEnter: () => {
              row.classList.add("is-scanned");
              recount();
            },
            onLeaveBack: () => {
              row.classList.remove("is-scanned");
              recount();
            },
          });
        });
        return () => rows.forEach((r) => r.classList.remove("is-scanned"));
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        rows.forEach((r) => r.classList.add("is-scanned"));
        recount();
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  return (
    <section id="why" className="why" ref={root}>
      <div className="wrap">
        <SectionHead title="What you get that a typical agency *won’t give you.*" lede="No lock-in, no black-box billing, no disappearing after launch." />

        <div className="why-table" role="table" aria-label="GOBT compared with a typical agency">
          <div className="why-head" role="row">
            <span className="why-idx" role="columnheader" aria-label="Number" />
            <span className="why-feature" role="columnheader">Capability</span>
            <span className="why-cell why-agency" role="columnheader">Typical agency</span>
            <span className="why-cell why-gobt" role="columnheader">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" width={389} height={363} /> GOBT
            </span>
          </div>

          <div className="why-scanner" aria-hidden="true">
            <span className="why-scanner-line" />
          </div>

          {COMPARE_ROWS.map((row, i) => (
            <div className="why-row" role="row" key={row.feature}>
              <span className="why-idx" role="cell">{String(i + 1).padStart(2, "0")}</span>
              <span className="why-feature" role="cell">{row.feature}</span>
              {[
                { key: "agency", yes: row.agency },
                { key: "gobt", yes: row.gobt },
              ].map((c) => (
                <span className={`why-cell why-${c.key}${c.yes ? " is-yes" : " is-no"}`} role="cell" key={c.key}>
                  <span className="why-pending" aria-hidden="true">— — —</span>
                  <span className="why-result">
                    {c.yes ? <IconCheck className="why-icon" /> : <IconCross className="why-icon" />}
                    <span className="why-word">{c.yes ? "Included" : "Not included"}</span>
                  </span>
                </span>
              ))}
            </div>
          ))}

          <div className="why-score" aria-live="polite">
            <div className="why-score-item">
              <span className="why-score-label">Typical agency</span>
              <span className="why-score-bar">
                <span style={{ transform: `scaleX(${agencyScore / TOTAL})` }} />
              </span>
              <span className="why-score-val">
                {agencyScore}/{TOTAL}
              </span>
            </div>
            <div className="why-score-item is-gobt">
              <span className="why-score-label">GOBT</span>
              <span className="why-score-bar">
                <span style={{ transform: `scaleX(${gobtScore / TOTAL})` }} />
              </span>
              <span className="why-score-val">
                {gobtScore}/{TOTAL}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
