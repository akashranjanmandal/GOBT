"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { WORKS, type Work as WorkItem } from "@/lib/content";
import { gsap, ScrollTrigger, useGSAP, MQ_MOTION_DESKTOP } from "@/lib/gsap";
import { scrollToTarget } from "@/lib/scroll";
import SectionHead from "@/components/ui/SectionHead";
import { IconArrow } from "@/components/ui/icons";

const FEATURED = WORKS.filter((w) => w.featured);
const pad = (n: number) => String(n).padStart(2, "0");
const PAGE = 5;
type Filter = "All" | "Web" | "App";

function FeaturedCard({ work, index }: { work: WorkItem; index: number }) {
  const body = (
    <>
      <div className="wf-frame">
        <div className="wf-chrome">
          <span className="wf-dot" />
          <span className="wf-dot" />
          <span className="wf-dot" />
          <span className="wf-url">{work.live || "gobt.in"}</span>
          <span className="wf-live">{work.live ? "● Live" : "Case study"}</span>
        </div>
        <div className="wf-media">
          <Image src={work.image} alt={`${work.title} — ${work.tag}`} fill sizes="(min-width: 1024px) 52vw, 86vw" className="wf-img" />
          <div className="wf-scan" />
        </div>
        <span className="wf-corner tl" />
        <span className="wf-corner br" />
      </div>
      <div className="wf-meta">
        <span className="wf-idx">{pad(index + 1)}</span>
        <div className="wf-heading">
          <span className="wf-tag">{work.tag}</span>
          <h3 className="wf-title">{work.title}</h3>
        </div>
        <p className="wf-desc">{work.desc}</p>
        <ul className="wf-tech">
          {work.tech.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>
    </>
  );
  return (
    <article className="wf-card">
      {work.live ? (
        <a className="wf-link" href={`https://${work.live}`} target="_blank" rel="noopener noreferrer">
          {body}
        </a>
      ) : (
        <div className="wf-link">{body}</div>
      )}
    </article>
  );
}

export default function Work() {
  const root = useRef<HTMLElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [filter, setFilter] = useState<Filter>("All");
  const [hovered, setHovered] = useState<number | null>(null);
  const [previewReady, setPreviewReady] = useState(false);
  const [visible, setVisible] = useState(PAGE);

  const list = filter === "All" ? WORKS : WORKS.filter((w) => w.category === filter);
  /* the index opens with a few rows; the last one shown fades out
     under a "See more" while more remain */
  const shown = list.slice(0, visible);
  const hasMore = list.length > visible;
  const counts: Record<Filter, number> = {
    All: WORKS.length,
    Web: WORKS.filter((w) => w.category === "Web").length,
    App: WORKS.filter((w) => w.category === "App").length,
  };

  /* pinned horizontal coverflow (desktop) */
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MQ_MOTION_DESKTOP, () => {
        const track = trackRef.current;
        const pin = pinRef.current;
        const scroller = scrollerRef.current;
        if (!track || !pin || !scroller) return;
        const cards = gsap.utils.toArray<HTMLElement>(".wf-card", track);
        const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
        /* sticky stage (CSS) inside a scroller exactly as tall as the
           horizontal travel needs — no JS pinning, no layout jumps */
        const size = () => {
          scroller.style.height = `${window.innerHeight + distance()}px`;
        };
        size();
        ScrollTrigger.addEventListener("refreshInit", size);

        gsap.to(track, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: scroller,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (barRef.current) barRef.current.style.transform = `scaleX(${self.progress})`;
              if (counterRef.current) {
                const n = Math.min(FEATURED.length, Math.floor(self.progress * FEATURED.length) + 1);
                counterRef.current.textContent = pad(n);
              }
            },
          },
        });

        gsap.to(".work-bgword", {
          xPercent: -30,
          ease: "none",
          scrollTrigger: { trigger: scroller, start: "top top", end: "bottom bottom", scrub: true },
        });

        /* coverflow: tilt and push back cards by distance from centre */
        let onScreen = false;
        const io = new IntersectionObserver(([e]) => (onScreen = e.isIntersecting));
        io.observe(pin);
        const tick = () => {
          if (!onScreen) return;
          const W = window.innerWidth;
          cards.forEach((card) => {
            const r = card.getBoundingClientRect();
            const d = Math.max(-1.5, Math.min(1.5, (r.left + r.width / 2 - W / 2) / W));
            card.style.setProperty("--d", d.toFixed(4));
            card.style.setProperty("--ad", Math.abs(d).toFixed(4));
          });
        };
        gsap.ticker.add(tick);
        return () => {
          gsap.ticker.remove(tick);
          io.disconnect();
          ScrollTrigger.removeEventListener("refreshInit", size);
          scroller.style.height = "";
          cards.forEach((c) => {
            c.style.removeProperty("--d");
            c.style.removeProperty("--ad");
          });
        };
      });
      return () => mm.revert();
    },
    { scope: root }
  );

  /* mount the hover-preview images only once the index is near */
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setPreviewReady(true);
          io.disconnect();
        }
      },
      { rootMargin: "60% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* preview follows the pointer with a little lag and lean */
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || !window.matchMedia("(pointer: fine)").matches) return;
    const xTo = gsap.quickTo(preview, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(preview, "y", { duration: 0.6, ease: "power3" });
    const rTo = gsap.quickTo(preview, "rotation", { duration: 0.8, ease: "power3" });
    let lastX = 0;
    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
      rTo(Math.max(-8, Math.min(8, (e.clientX - lastX) * 0.4)));
      lastX = e.clientX;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <section id="work" className="work" ref={root}>
      <div className="work-scroller" ref={scrollerRef}>
      <div className="work-pin" ref={pinRef}>
        <div className="work-bgword" aria-hidden="true">
          Selected Work · Selected Work
        </div>
        <div className="work-head wrap">
          <SectionHead title="Recent *builds.*" />
          <div className="work-counter" aria-hidden="true">
            <span className="work-counter-now" ref={counterRef}>
              01
            </span>
            <span className="work-counter-total">/ {pad(FEATURED.length)}</span>
            <span className="work-progress">
              <span ref={barRef} />
            </span>
          </div>
        </div>

        <div className="work-track" ref={trackRef}>
          {FEATURED.map((w, i) => (
            <FeaturedCard work={w} index={i} key={w.id} />
          ))}
          <div className="work-track-end">
            <p className="work-track-end-title">
              {WORKS.length} products shipped across web &amp; mobile.
            </p>
            <a
              href="#work-index"
              className="btn btn-ghost"
              data-magnetic
              onClick={(e) => {
                e.preventDefault();
                scrollToTarget("#work-index", -40);
              }}
            >
              <span className="btn-label">Browse all</span>
              <span className="btn-arrow" aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        <div className="work-fx" data-fx="wave" data-fx-fit="width" data-fx-opacity="0.55" data-fx-opacity-sm="0.4" data-fx-y="0.84" aria-hidden="true" />
      </div>

      </div>

      <div className="work-index wrap" id="work-index">
        <div className="wi-head">
          <h3 className="wi-title" data-reveal="fade">
            Project index <sup>{pad(list.length)}</sup>
          </h3>
          <div className="wi-controls" data-reveal="fade">
            <div className="wi-filters" role="group" aria-label="Filter projects">
              {(["All", "Web", "App"] as const).map((f) => (
                <button
                  key={f}
                  className={`wi-filter${filter === f ? " is-active" : ""}`}
                  aria-pressed={filter === f}
                  onClick={() => {
                    setFilter(f);
                    setVisible(PAGE);
                  }}
                >
                  {f}
                  <span>{pad(counts[f])}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <ul className={`wi-list${hasMore ? " has-more" : ""}`} key={filter} ref={listRef} onPointerLeave={() => setHovered(null)}>
          {shown.map((w, i) => {
            const faded = hasMore && i === shown.length - 1;
            const idx = WORKS.indexOf(w);
            const row = (
              <>
                <span className="wi-num">{pad(i + 1)}</span>
                <span className="wi-thumb">
                  <Image src={w.image} alt="" fill sizes="96px" />
                </span>
                <span className="wi-name">{w.title}</span>
                <span className="wi-tag">{w.tag}</span>
                <span className="wi-tech">{w.tech.join(" · ")}</span>
                <span className="wi-cat">{w.category}</span>
                <span className="wi-arrow" aria-hidden="true">
                  {w.live ? <IconArrow /> : <span className="wi-private">Private</span>}
                </span>
              </>
            );
            return (
              <li
                key={w.id}
                className={`wi-row${hovered === idx ? " is-hover" : ""}${faded ? " is-faded" : ""}`}
                style={{ "--i": i % PAGE } as React.CSSProperties}
                onPointerEnter={() => !faded && setHovered(idx)}
                aria-hidden={faded || undefined}
                inert={faded || undefined}
              >
                {w.live ? (
                  <a className="wi-link" href={`https://${w.live}`} target="_blank" rel="noopener noreferrer">
                    {row}
                  </a>
                ) : (
                  <div className="wi-link">{row}</div>
                )}
              </li>
            );
          })}
        </ul>
        {hasMore && (
          <div className="wi-more">
            <button className="btn btn-ghost" onClick={() => setVisible((v) => v + PAGE)}>
              <span className="btn-label">See more</span>
              <span className="btn-arrow" aria-hidden="true">↓</span>
            </button>
          </div>
        )}
      </div>

      <div className={`wi-preview${hovered !== null ? " is-on" : ""}`} ref={previewRef} aria-hidden="true">
        <div className="wi-preview-inner">
          {previewReady &&
            WORKS.map((w, i) => (
              <div key={w.id} className={`wi-preview-img${hovered === i ? " is-on" : ""}`}>
                <Image src={w.image} alt="" fill sizes="440px" />
              </div>
            ))}
          <span className="wi-preview-label">{hovered !== null ? WORKS[hovered].live || "Private build" : ""}</span>
        </div>
      </div>

    </section>
  );
}
