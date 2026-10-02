import type Lenis from "lenis";
import type { MouseEvent } from "react";

/* Lenis instance shared across components without a context: the
   Experience root creates it, everything else just asks for it. */
let lenis: Lenis | null = null;

export const setLenis = (instance: Lenis | null) => {
  lenis = instance;
};

export const getLenis = () => lenis;

export function scrollToTarget(target: string | number | HTMLElement, offset = 0) {
  const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (el === null) return;
  if (lenis) {
    lenis.scrollTo(el, { offset, duration: 1.6 });
    return;
  }
  if (typeof el === "number") window.scrollTo({ top: el, behavior: "smooth" });
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + offset, behavior: "smooth" });
}

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.classList.toggle("is-locked", locked);
}

/* Cross-component events — the estimator hands its selection to the
   contact form, the loader announces when the intro may begin. */
export const EVT_INTRO = "gobt:intro";
export const EVT_PREFILL = "gobt:prefill";

/* Set once the intro has fired, so anything mounting later (lazy
   chunks) starts in the finished state instead of waiting forever */
export const introState = { done: false };

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Section links work from every page: on the homepage they smooth-
   scroll in place, elsewhere the browser follows the real href
   (e.g. "/#contact") and the homepage scrolls there after loading. */
export function onSectionLink(e: MouseEvent, target: string | number) {
  if (window.location.pathname !== "/") return;
  e.preventDefault();
  scrollToTarget(target);
}
