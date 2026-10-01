"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import Lenis from "lenis";
import { gsap, ScrollTrigger, SplitText, useGSAP, MQ_MOTION } from "@/lib/gsap";
import { EVT_INTRO, getLenis, introState, prefersReducedMotion, scrollToTarget, setLenis } from "@/lib/scroll";
import Nav from "@/components/ui/Nav";
import Hud from "@/components/ui/Hud";
import Magnetic from "@/components/fx/Magnetic";
import { createLogoLoader } from "@/components/fx/logoLoader";

const ParticleField = dynamic(() => import("@/components/fx/ParticleField"), { ssr: false });

/* ──────────────────────────────────────────
   EXPERIENCE ROOT
   Owns everything page-wide: smooth scroll and its sync with
   ScrollTrigger, the loader and the intro hand-off, the declarative
   reveal / parallax system (data-reveal, data-speed), and the fixed
   layers — particles, nav, scroll line, grain.
────────────────────────────────────────── */
export default function Experience({ children }: { children: ReactNode }) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [booted, setBooted] = useState(false);

  /* Smooth scroll — paused until the loader has gone */
  useEffect(() => {
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    if (prefersReducedMotion()) return;

    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, autoRaf: false });
    setLenis(lenis);
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  /* Loader: the GOBT mark gathers as a point cloud while fonts and
     the page settle (never shorter than a beat, never stuck past a
     hard cap), then disperses as the page takes over */
  useEffect(() => {
    const loader = loaderRef.current;
    const canvas = canvasRef.current;
    if (!loader || !canvas) return;
    const reduced = prefersReducedMotion();

    /* the intro event fires exactly once, as the particles disperse */
    const reveal = () => {
      if (introState.done) return;
      introState.done = true;
      window.dispatchEvent(new Event(EVT_INTRO));
    };
    const finish = () => {
      reveal();
      loader.style.display = "none";
      setBooted(true);
    };

    /* the CSS failsafe already hid it (scripts were very slow): skip
       straight to the page instead of animating an invisible loader */
    if (getComputedStyle(loader).visibility === "hidden") {
      const id = requestAnimationFrame(finish);
      return () => cancelAnimationFrame(id);
    }

    let seen = false;
    try {
      seen = sessionStorage.getItem("gobt-booted") === "1";
      sessionStorage.setItem("gobt-booted", "1");
    } catch {
      /* storage blocked — play the full intro */
    }

    const fx = createLogoLoader(canvas, { reduced, small: window.innerWidth < 700 });
    const minTime = reduced ? 0.3 : seen ? 1.1 : 2.0;
    const pageReady = new Promise<void>((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    });
    const settled = Promise.race([
      Promise.all([pageReady, document.fonts?.ready ?? Promise.resolve(), fx.ready]),
      new Promise((r) => setTimeout(r, 4500)),
    ]);

    let cancelled = false;
    Promise.all([settled, new Promise((r) => setTimeout(r, minTime * 1000))])
      .then(() => {
        if (cancelled) return;
        return fx.exit(() => {
          reveal();
          gsap.to(loader, { backgroundColor: "rgba(5, 4, 3, 0)", duration: reduced ? 0.2 : 0.9, ease: "power2.inOut" });
        });
      })
      .then(() => {
        if (!cancelled) finish();
      });

    return () => {
      cancelled = true;
      fx.dispose();
      gsap.killTweensOf(loader);
    };
  }, []);

  /* After boot: release scroll, honour a deep link, resync triggers */
  useEffect(() => {
    if (!booted) return;
    document.documentElement.classList.add("is-booted");
    getLenis()?.start();
    ScrollTrigger.refresh();
    if (window.location.hash.length > 1) {
      const id = window.location.hash;
      window.setTimeout(() => scrollToTarget(id), 200);
    }
  }, [booted]);

  /* Declarative reveals + parallax. Runs after every section has
     created its own pins (child effects run first), so these
     triggers measure positions that already include pin spacing. */
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MQ_MOTION, () => {
      gsap.utils.toArray<HTMLElement>("[data-reveal='lines']").forEach((el) => {
        SplitText.create(el, {
          type: "lines",
          mask: "lines",
          autoSplit: true,
          linesClass: "split-line",
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 118,
              duration: 1.2,
              ease: "expo.out",
              stagger: 0.09,
              scrollTrigger: { trigger: el, start: "top 90%", once: true },
            }),
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal='fade']").forEach((el) => {
        gsap.from(el, {
          y: 40,
          autoAlpha: 0,
          duration: 1.1,
          ease: "expo.out",
          scrollTrigger: { trigger: el, start: "top 92%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-reveal='stagger']").forEach((el) => {
        gsap.from(el.children, {
          y: 50,
          autoAlpha: 0,
          duration: 1.05,
          ease: "expo.out",
          stagger: 0.07,
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const speed = parseFloat(el.dataset.speed ?? "0");
        gsap.fromTo(
          el,
          { y: () => speed * window.innerHeight * 0.3 },
          {
            y: () => -speed * window.innerHeight * 0.3,
            ease: "none",
            scrollTrigger: {
              trigger: el.parentElement ?? el,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
              invalidateOnRefresh: true,
            },
          }
        );
      });
    });

    /* fonts change line breaks and section heights */
    document.fonts?.ready.then(() => ScrollTrigger.refresh());
    return () => mm.revert();
  });

  return (
    <>
      <div className="loader" ref={loaderRef} aria-hidden="true">
        <canvas className="loader-canvas" ref={canvasRef} />
      </div>
      <noscript>
        <style>{`.loader{display:none!important}`}</style>
      </noscript>

      <div className="bg-layer" aria-hidden="true" />
      <ParticleField />
      <Nav />
      <main id="main">{children}</main>
      <Hud />
      <Magnetic />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
