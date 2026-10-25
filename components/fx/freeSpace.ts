/* Free-space finder for Bloom: maps what's on screen (text, media,
   cards, controls, particle shapes) into a coarse occupancy grid and
   finds the nearest spot where the creature and its bubble cover
   nothing. Text is measured glyph-tight, so the empty space to the
   right of a short heading counts as free. */

const CELL = 12;
const PAD = 8;
const MEDIA = new Set(["IMG", "VIDEO", "CANVAS", "svg", "INPUT", "TEXTAREA", "SELECT", "IFRAME", "PICTURE", "BUTTON"]);

export type Side = "right" | "left" | "none";
/* covered: how much content it would sit on (0 = none) */
export type Spot = { x: number; y: number; side: Side; cost: number; covered: number };

type Plan = {
  size: number; // blob box
  bw: number; // bubble width
  bh: number; // bubble height
  top: number; // keep clear of the nav
  px: number; // preferred blob centre (beside the section's words)
  py: number;
  prev: { x: number; y: number; side: Side } | null;
};

const alphaOf = (color: string) => {
  const m = color.match(/rgba?\(([^)]+)\)/);
  if (!m) return color === "transparent" ? 0 : 1;
  const parts = m[1].split(/[\s,/]+/).filter(Boolean);
  return parts.length > 3 ? parseFloat(parts[3]) : 1;
};

export function createSpaceFinder(exclude: () => Element[]) {
  let texts: Element[] = [];
  let solids: Element[] = [];
  let softs: Element[] = [];
  let scannedAt = -Infinity;
  let dirty = true;

  /* re-map content whenever the page's DOM changes (split headings,
     "See more", drawers, the form's states) */
  const watcher =
    typeof MutationObserver !== "undefined"
      ? new MutationObserver((records) => {
          const skip = exclude();
          if (records.some((r) => !skip.some((x) => x.contains(r.target)))) dirty = true;
        })
      : null;
  const main = typeof document !== "undefined" ? document.getElementById("main") : null;
  if (watcher && main) watcher.observe(main, { childList: true, subtree: true, characterData: true });

  /* which elements are content — rescanned every few seconds, since
     lists grow ("See more"), drawers open and states change */
  const scan = () => {
    const main = document.getElementById("main");
    texts = [];
    solids = [];
    softs = [];
    if (!main) return;
    const skip = exclude();
    const W = window.innerWidth;
    for (const el of Array.from(main.querySelectorAll("*"))) {
      if (skip.some((x) => x.contains(el))) continue;
      /* purely decorative washes and glows aren't content */
      if (el.closest("[data-decor]")) continue;
      if (el instanceof HTMLElement && el.dataset.fx !== undefined) {
        softs.push(el);
        continue;
      }
      const inSvg = el.closest("svg");
      if (inSvg && inSvg !== el) continue;
      const cs = getComputedStyle(el);
      /* opacity is checked per plan instead: lots of content fades in later */
      if (cs.display === "none") continue;
      if (MEDIA.has(el.tagName)) {
        solids.push(el);
        continue;
      }
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) {
          texts.push(el);
          break;
        }
      }
      const framed =
        alphaOf(cs.backgroundColor) > 0.05 ||
        cs.backgroundImage !== "none" ||
        (["Top", "Right", "Bottom", "Left"] as const).some(
          (s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none"
        );
      /* cards and panels count; full-bleed section backgrounds don't */
      if (framed && el.getBoundingClientRect().width < W * 0.97) solids.push(el);
    }
  };

  const range = typeof document !== "undefined" ? document.createRange() : null;

  function plan(o: Plan): { talk: Spot; quiet: Spot; peek: Spot } {
    const now = performance.now();
    if (dirty || now - scannedAt > 2500) {
      scan();
      scannedAt = now;
      dirty = false;
    }
    const W = window.innerWidth;
    const H = window.innerHeight;
    const cols = Math.ceil(W / CELL);
    const rows = Math.ceil(H / CELL);
    const occ = new Float32Array(cols * rows);

    const fill = (l: number, t: number, r: number, b: number, w: number) => {
      if (r < 0 || b < 0 || l > W || t > H) return;
      const c0 = Math.max(0, Math.floor((l - PAD) / CELL));
      const c1 = Math.min(cols - 1, Math.floor((r + PAD) / CELL));
      const r0 = Math.max(0, Math.floor((t - PAD) / CELL));
      const r1 = Math.min(rows - 1, Math.floor((b + PAD) / CELL));
      for (let y = r0; y <= r1; y++) {
        const row = y * cols;
        for (let x = c0; x <= c1; x++) if (occ[row + x] < w) occ[row + x] = w;
      }
    };
    const onScreen = (r: DOMRect) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < H && r.right > 0 && r.left < W;
    const shown = (el: Element) =>
      typeof el.checkVisibility !== "function" || el.checkVisibility({ opacityProperty: true, visibilityProperty: true });

    for (const el of texts) {
      const box = el.getBoundingClientRect();
      if (!onScreen(box) || !range || !shown(el)) continue;
      for (const n of Array.from(el.childNodes)) {
        if (n.nodeType !== Node.TEXT_NODE || !n.textContent?.trim()) continue;
        range.selectNodeContents(n);
        for (const r of Array.from(range.getClientRects())) fill(r.left, r.top, r.right, r.bottom, 1);
      }
    }
    for (const el of solids) {
      const r = el.getBoundingClientRect();
      if (onScreen(r) && shown(el)) fill(r.left, r.top, r.right, r.bottom, 1);
    }
    for (const el of softs) {
      const r = el.getBoundingClientRect();
      if (onScreen(r)) fill(r.left, r.top, r.right, r.bottom, 0.002);
    }

    /* summed-area table → any rectangle's cover in O(1) */
    const sat = new Float32Array((cols + 1) * (rows + 1));
    for (let y = 0; y < rows; y++) {
      let run = 0;
      for (let x = 0; x < cols; x++) {
        run += occ[y * cols + x];
        sat[(y + 1) * (cols + 1) + x + 1] = sat[y * (cols + 1) + x + 1] + run;
      }
    }
    const cover = (l: number, t: number, r: number, b: number) => {
      const c0 = Math.max(0, Math.floor(l / CELL));
      const c1 = Math.min(cols, Math.ceil(r / CELL));
      const r0 = Math.max(0, Math.floor(t / CELL));
      const r1 = Math.min(rows, Math.ceil(b / CELL));
      if (c1 <= c0 || r1 <= r0) return 0;
      const k = cols + 1;
      return sat[r1 * k + c1] - sat[r0 * k + c1] - sat[r1 * k + c0] + sat[r0 * k + c0];
    };

    const S = o.size;
    const half = S * 0.42; // the blob is round; its box corners are empty
    const best = { talk: null as Spot | null, quiet: null as Spot | null };
    const score = (x: number, y: number, side: Side, covered: number) => {
      let c = covered * 1000 + Math.hypot(x - o.px, y - o.py) / 6;
      if (o.prev) {
        c += Math.hypot(x - o.prev.x, y - o.prev.y) / 14;
        if (side !== o.prev.side) c += 8;
      }
      return c;
    };

    const step = W < 700 ? 10 : 16;
    for (let y = o.top + S / 2; y <= H - S / 2 - 8; y += step) {
      for (let x = S / 2 + 8; x <= W - S / 2 - 8; x += step) {
        const blob = cover(x - half, y - half, x + half, y + half);
        const q = score(x, y, "none", blob);
        if (!best.quiet || q < best.quiet.cost) best.quiet = { x, y, side: "none", cost: q, covered: blob };

        const t = Math.max(o.top, y - o.bh / 2);
        const b = t + o.bh;
        if (b > H - 8) continue;
        const rl = x + S / 2 + 8;
        if (rl + o.bw <= W - 8) {
          const c = blob + cover(rl, t, rl + o.bw, b);
          const v = score(x, y, "right", c);
          if (!best.talk || v < best.talk.cost) best.talk = { x, y, side: "right", cost: v, covered: c };
        }
        const lr = x - S / 2 - 8;
        if (lr - o.bw >= 8) {
          const c = blob + cover(lr - o.bw, t, lr, b);
          const v = score(x, y, "left", c);
          if (!best.talk || v < best.talk.cost) best.talk = { x, y, side: "left", cost: v, covered: c };
        }
      }
    }

    /* last resort: peek in from the right edge, over the page gutter */
    const py = Math.max(o.top + S / 2, Math.min(H - S / 2 - 8, o.py));
    const px = W + S * 0.2;
    const peek: Spot = { x: px, y: py, side: "none", cost: 0, covered: cover(px - half, py - half, W, py + half) };
    const fallback: Spot = { x: o.px, y: py, side: "none", cost: Infinity, covered: Infinity };
    return { talk: best.talk ?? fallback, quiet: best.quiet ?? fallback, peek };
  }

  /* particle shapes only nudge the choice; anything else must be clear */
  const isFree = (s: Spot) => s.covered < 0.5;

  return { plan, isFree, dispose: () => watcher?.disconnect() };
}
