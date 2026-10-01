import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";

/* Registered once for the whole app; every client module imports
   gsap from here so plugins are guaranteed to be available. */
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP);
  ScrollTrigger.config({ ignoreMobileResize: true });
}

/* Where the pinned, scroll-driven scenes switch on: wide screens with
   a mouse or trackpad. Touch devices (phones, tablets) and reduced-
   motion users get plain vertical layouts instead — pinning fights
   native momentum scrolling. CSS mirrors this with the same queries. */
export const MQ_MOTION_DESKTOP = "(min-width: 1024px) and (prefers-reduced-motion: no-preference) and (hover: hover)";
export const MQ_STATIC = "(max-width: 1023px), (prefers-reduced-motion: reduce), (hover: none)";
export const MQ_MOTION = "(prefers-reduced-motion: no-preference)";

export { gsap, ScrollTrigger, SplitText, useGSAP };
