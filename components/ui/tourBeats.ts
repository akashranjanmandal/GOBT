import { WORKS } from "@/lib/content";
import { GUIDE_STOPS } from "@/lib/guide";

/* The guided tour as a list of beats: where to scroll, and what to say
   once there. Text is read from the page on arrival, so Bloom describes
   exactly what's on screen — the active service, the centred project,
   the step in view. Scroll-driven (sticky) sections get a beat per item
   along their travel; on layouts where they're plain lists, a beat per
   card instead. */
export type Beat = { index: number; y: () => number; text: () => string };

const indexOf = (id: string) => GUIDE_STOPS.findIndex((s) => s.id === id);
const pageTop = (el: Element | null | undefined, offset = 0) =>
  el ? el.getBoundingClientRect().top + window.scrollY + offset : 0;
const read = (root: ParentNode | null | undefined, sel: string) => root?.querySelector(sel)?.textContent?.trim() ?? "";
const section = (id: string) => document.getElementById(id);
/* a scroller taller than the screen means its stage is sticky */
const isSticky = (el: HTMLElement | null | undefined) => !!el && el.offsetHeight > window.innerHeight * 1.3;

/* Horizontal reels (work, process) move one pixel sideways per pixel
   scrolled, so the scroll that centres a card is "now + its offset
   from the middle", kept inside the reel's sticky range. */
function centreOn(el: Element, scroller: HTMLElement) {
  const r = el.getBoundingClientRect();
  const start = pageTop(scroller);
  const end = start + scroller.offsetHeight - window.innerHeight;
  return Math.max(start, Math.min(end, window.scrollY + (r.left + r.width / 2 - window.innerWidth / 2)));
}

export function buildBeats(): Beat[] {
  const beats: Beat[] = [];
  const intro = (id: string, at: () => number = () => pageTop(section(id), -40)) =>
    beats.push({ index: indexOf(id), y: at, text: () => GUIDE_STOPS[indexOf(id)].text });

  /* evenly through a sticky scroller's travel */
  const through = (id: string, scroller: HTMLElement, count: number, say: (i: number) => string) => {
    for (let i = 0; i < count; i++)
      beats.push({
        index: indexOf(id),
        y: () => pageTop(scroller) + (scroller.offsetHeight - window.innerHeight) * (count === 1 ? 0 : i / (count - 1)),
        text: () => say(i),
      });
  };

  /* a beat per card of a sideways reel, each scrolled to the centre */
  const reel = (id: string, scroller: HTMLElement, els: Element[], say: (el: Element) => string) => {
    for (const el of els) beats.push({ index: indexOf(id), y: () => centreOn(el, scroller), text: () => say(el) });
  };

  /* one beat per card */
  const each = (id: string, sel: string, say: (el: Element) => string, offset = -160) => {
    for (const el of Array.from(section(id)?.querySelectorAll(sel) ?? []))
      beats.push({ index: indexOf(id), y: () => pageTop(el, offset), text: () => say(el) });
  };

  /* hero */
  intro("home", () => 0);

  /* services: the manifesto, then every service */
  const svc = section("services");
  intro("services", () => pageTop(svc?.querySelector(".manifesto"), -90));
  const svcScroller = svc?.querySelector<HTMLElement>(".svc-scroller");
  if (isSticky(svcScroller) && svcScroller) {
    const n = svc?.querySelectorAll(".svc-tick").length || 1;
    through("services", svcScroller, n, () => `${read(svc, ".svc-detail-num")}. ${read(svc, ".svc-detail-title")}: ${read(svc, ".svc-detail-desc")}`);
  } else {
    each("services", ".svc-card", (el) => `${read(el, ".svc-card-title")}: ${read(el, ".svc-card-desc")}`);
  }

  /* work: the featured reel, then the full list */
  const work = section("work");
  const workScroller = work?.querySelector<HTMLElement>(".work-scroller");
  const cards = Array.from(work?.querySelectorAll(".wf-card") ?? []);
  const describe = (el: Element) => `${read(el, ".wf-title")} (${read(el, ".wf-tag").toLowerCase()}): ${read(el, ".wf-desc")}`;
  if (isSticky(workScroller) && workScroller) {
    intro("work", () => pageTop(workScroller));
    reel("work", workScroller, cards, describe);
    const end = work?.querySelector(".work-track-end");
    if (end)
      reel("work", workScroller, [end], () => `And that's just the highlights! We've shipped ${WORKS.length} products across web and mobile.`);
  } else {
    intro("work");
    each("work", ".wf-card", describe);
  }
  beats.push({
    index: indexOf("work"),
    y: () => pageTop(document.getElementById("work-index"), -100),
    text: () => "Here's every project we've built. Filter by Web or App, tap “See more” for the rest, or open one for its case study.",
  });

  intro("clients");

  /* process: the intro, then each step */
  const proc = section("process");
  const procScroller = proc?.querySelector<HTMLElement>(".proc-scroller");
  const steps = Array.from(proc?.querySelectorAll(".proc-step") ?? []);
  const step = (el: Element) => `${read(el, ".proc-step-kicker").replace(" / 03", "")}: ${read(el, ".proc-step-title")}. ${read(el, ".proc-step-desc")}`;
  if (isSticky(procScroller) && procScroller) {
    intro("process", () => pageTop(procScroller));
    reel("process", procScroller, steps, step);
  } else {
    intro("process");
    each("process", ".proc-step", step);
  }

  intro("why");
  intro("security");
  intro("estimate");
  intro("voices");

  /* team: who's who */
  intro("team");
  each("team", ".idc", (el) => `This is ${read(el, ".idc-name")}, our ${read(el, ".idc-title")}.`, -120);

  intro("careers");
  intro("faq");
  intro("contact");
  return beats;
}
