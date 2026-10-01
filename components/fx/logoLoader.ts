/* ──────────────────────────────────────────
   LOADER — the GOBT mark as a point cloud
   Gold particles gather out of a wide scatter into the logo,
   shimmer while the page settles, then drift outward and fade as
   the page (and its own particle gears) takes over. Plain canvas 2D
   so it runs before three.js has even downloaded.
────────────────────────────────────────── */

type Particle = {
  nx: number; // position within the mark, -0.5..0.5 of its height
  ny: number;
  b: number; // brightness 0..1
  delay: number;
  size: number;
  phase: number;
  ang: number;
  spread: number;
  sr: number; // scatter radius factor
};

const ASSEMBLE = 1.25;
const EXIT = 0.9;

function glowSprite() {
  const s = document.createElement("canvas");
  s.width = s.height = 32;
  const g = s.getContext("2d") as CanvasRenderingContext2D;
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, "rgba(255, 242, 205, 1)");
  grd.addColorStop(0.22, "rgba(255, 208, 112, 0.95)");
  grd.addColorStop(0.55, "rgba(231, 165, 45, 0.28)");
  grd.addColorStop(1, "rgba(231, 165, 45, 0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  return s;
}

function mulberry32(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

async function sampleMark(src: string, target: number) {
  const img = new Image();
  img.src = src;
  await img.decode();
  const SW = 150;
  const SH = Math.round((SW * img.naturalHeight) / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = SW;
  c.height = SH;
  const g = c.getContext("2d", { willReadFrequently: true }) as CanvasRenderingContext2D;
  g.drawImage(img, 0, 0, SW, SH);
  const px = g.getImageData(0, 0, SW, SH).data;
  const cells: { x: number; y: number; b: number }[] = [];
  for (let y = 0; y < SH; y++) {
    for (let x = 0; x < SW; x++) {
      const i = (y * SW + x) * 4;
      if (px[i + 3] < 140) continue;
      const lum = (0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]) / 255;
      cells.push({ x, y, b: Math.min(1, Math.max(0, (lum - 0.35) / 0.55)) });
    }
  }
  /* centre on the mark's visible pixels, not the image box — the
     PNG's transparent margins and the offset gears would skew it */
  let minX = SW, maxX = 0, minY = SH, maxY = 0;
  for (const c of cells) {
    minX = Math.min(minX, c.x);
    maxX = Math.max(maxX, c.x + 1);
    minY = Math.min(minY, c.y);
    maxY = Math.max(maxY, c.y + 1);
  }
  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const rnd = mulberry32(31);
  const keep = Math.min(1, target / Math.max(1, cells.length));
  const out: Particle[] = [];
  for (const cell of cells) {
    if (rnd() > keep) continue;
    out.push({
      nx: (cell.x + rnd() - minX - bw / 2) / bh,
      ny: (cell.y + rnd() - minY - bh / 2) / bh,
      b: cell.b,
      delay: rnd() * 0.55,
      size: 2.1 + Math.pow(rnd(), 3) * 3,
      phase: rnd() * Math.PI * 2,
      ang: rnd() * Math.PI * 2,
      spread: 0.35 + rnd() * 0.9,
      sr: 0.55 + rnd() * 0.6,
    });
  }
  return out;
}

export function createLogoLoader(canvas: HTMLCanvasElement, opts: { reduced: boolean; small: boolean }) {
  const ctx = canvas.getContext("2d");
  let parts: Particle[] = [];
  let W = 0, H = 0, dpr = 1, markH = 0;
  let raf = 0;
  let exitStart = -1;
  let exitDone: (() => void) | null = null;
  let disposed = false;
  /* the clock starts once the mark is sampled, not at mount */
  let t0 = performance.now();
  let formedAt = Infinity;
  const sprite = glowSprite();

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    /* pin the display size here too: on a 2x screen the backing store
       is twice the viewport, and without this the canvas would render
       at that size if the stylesheet ever lags behind */
    canvas.style.position = "absolute";
    canvas.style.left = "0";
    canvas.style.top = "0";
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    markH = Math.min(W * 0.62, H * (opts.small ? 0.3 : 0.34));
  };
  resize();
  window.addEventListener("resize", resize);

  const draw = (now: number) => {
    if (!ctx || disposed) return;
    const t = (now - t0) / 1000;
    const ex = exitStart < 0 || now < exitStart ? 0 : Math.min(1, (now - exitStart) / 1000 / EXIT);
    const cx = W / 2;
    const cy = H / 2;
    const far = Math.max(W, H) * 0.7;
    const sweep = ((t * 0.5) % 1.9) - 0.45;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = "lighter";
    for (const p of parts) {
      const k = opts.reduced ? 1 : Math.min(1, Math.max(0, (t - p.delay) / ASSEMBLE));
      const e = 1 - Math.pow(1 - k, 3);
      const tx = cx + p.nx * markH;
      const ty = cy + p.ny * markH;
      const sx = cx + Math.cos(p.ang) * far * p.sr;
      const sy = cy + Math.sin(p.ang) * far * p.sr;
      let x = sx + (tx - sx) * e + Math.sin(t * 1.3 + p.phase) * 0.7 * e;
      let y = sy + (ty - sy) * e + Math.cos(t * 1.1 + p.phase) * 0.7 * e;
      if (ex > 0) {
        const q = ex * ex;
        x += (tx - cx) * q * p.spread + Math.cos(p.ang) * q * 90;
        y += (ty - cy) * q * p.spread + Math.sin(p.ang) * q * 90;
      }
      /* a soft band of light slides diagonally across the mark */
      const d = (p.nx + p.ny) * 0.5 + 0.5 - sweep;
      const glint = Math.exp(-(d * d) / 0.008) * e;
      const twinkle = opts.reduced ? 1 : 0.62 + 0.38 * Math.sin(t * 2.4 + p.phase * 6);
      const alpha = ((0.55 + 0.45 * p.b) * twinkle * (0.15 + 0.85 * e) + glint * 0.55) * (1 - ex);
      if (alpha <= 0.004) continue;
      const s = p.size * (1 + glint * 0.7);
      ctx.globalAlpha = Math.min(1, alpha);
      ctx.drawImage(sprite, x - s / 2, y - s / 2, s, s);
    }
    if (ex >= 1 && exitDone) {
      const done = exitDone;
      exitDone = null;
      done();
      return;
    }
    raf = requestAnimationFrame(draw);
  };

  const ready = sampleMark("/logo.png", opts.small ? 2600 : 4200)
    .then((p) => {
      parts = p;
      t0 = performance.now();
      /* fully gathered (longest delay + assembly) plus a short hold */
      formedAt = t0 + (0.55 + ASSEMBLE + 0.45) * 1000;
      if (!disposed) raf = requestAnimationFrame(draw);
    })
    .catch(() => {
      /* without the mark the loader is just a dark beat */
    });

  return {
    ready,
    /* particles drift apart and fade; resolves when gone */
    exit(onStart?: () => void) {
      return new Promise<void>((resolve) => {
        if (disposed || !parts.length) {
          onStart?.();
          return resolve();
        }
        exitDone = resolve;
        /* never leave before the mark has actually formed */
        exitStart = Math.max(performance.now(), opts.reduced ? 0 : formedAt);
        window.setTimeout(() => onStart?.(), Math.max(0, exitStart - performance.now()));
      });
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    },
  };
}
