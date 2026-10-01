/* ──────────────────────────────────────────
   PARTICLE SHAPES
   Each generator fills N points inside roughly a unit radius. All
   shapes share one particle count, so particle i of the gear is
   also particle i of the globe, and the shader can morph between
   any two of them by interpolating per-particle positions.
────────────────────────────────────────── */

export const SHAPE_NAMES = ["gear", "globe", "wave", "helix", "shield", "ring"] as const;
export type ShapeName = (typeof SHAPE_NAMES)[number];

type Rand = () => number;

function mulberry32(seed: number): Rand {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const fract = (x: number) => x - Math.floor(x);

/* Two meshing gears, echoing the pair in the GOBT logo. Teeth share
   one pitch so the shader can spin them at inverse speeds (ratio of
   tooth counts) and they stay engaged. spin = [cx, cy, ω, 0]. */
function gear(n: number, rnd: Rand) {
  const pos = new Float32Array(n * 3);
  const spin = new Float32Array(n * 4);

  const h = 0.13;
  const bigPitch = 0.805;
  const smallPitch = (bigPitch * 8) / 12;
  const dist = bigPitch + smallPitch;
  const dir = (5 * Math.PI) / 4;
  const big = { cx: 0.2, cy: 0.18, R: bigPitch - h / 2, teeth: 12, w: 0.3, phase: 0.3, inner: 0.6, share: 0.66 };
  const small = {
    cx: 0.2 + Math.cos(dir) * dist,
    cy: 0.18 + Math.sin(dir) * dist,
    R: smallPitch - h / 2,
    teeth: 8,
    w: -0.3 * (12 / 8),
    phase: 0.3,
    inner: 0.5,
    share: 0.34,
  };

  /* normalise the pair into [-1, 1] */
  const minX = small.cx - small.R - h, maxX = big.cx + big.R + h;
  const minY = small.cy - small.R - h, maxY = big.cy + big.R + h;
  const ox = (minX + maxX) / 2, oy = (minY + maxY) / 2;
  const k = 2 / Math.max(maxX - minX, maxY - minY);

  const T = 0.2;
  const tooth = (f: number) => smooth(0.06, 0.14, f) * (1 - smooth(0.46, 0.54, f));

  for (let i = 0; i < n; i++) {
    const g = rnd() < big.share ? big : small;
    const profile = (theta: number) => g.R + h * tooth(fract((theta * g.teeth) / TAU + g.phase));
    const rIn = g.R * g.inner;
    const pick = rnd();
    let theta = rnd() * TAU;
    let r: number;
    let face = true;
    if (pick < 0.34) {
      r = profile(theta);
    } else if (pick < 0.48) {
      /* tooth flanks — sampling theta uniformly under-represents the
         near-radial edges, so place points on them explicitly */
      const tIdx = Math.floor(rnd() * g.teeth);
      const f = rnd() < 0.5 ? 0.1 : 0.5;
      theta = ((tIdx + f - g.phase) / g.teeth) * TAU;
      r = g.R + h * rnd();
    } else if (pick < 0.66) {
      r = rIn;
    } else if (pick < 0.88) {
      r = Math.sqrt(rnd() * (g.R * g.R - rIn * rIn) + rIn * rIn);
    } else {
      const tIdx = Math.floor(rnd() * g.teeth);
      const f = 0.14 + rnd() * 0.32;
      theta = ((tIdx + f - g.phase) / g.teeth) * TAU;
      r = g.R + h * rnd();
    }
    if (rnd() < 0.3) face = false;
    const z = face ? (rnd() < 0.5 ? -T / 2 : T / 2) : (rnd() - 0.5) * T;
    const j = 0.006;
    const x = g.cx + Math.cos(theta) * r + (rnd() - 0.5) * j;
    const y = g.cy + Math.sin(theta) * r + (rnd() - 0.5) * j;
    pos[i * 3] = (x - ox) * k;
    pos[i * 3 + 1] = (y - oy) * k;
    pos[i * 3 + 2] = z * k;
    spin[i * 4] = (g.cx - ox) * k;
    spin[i * 4 + 1] = (g.cy - oy) * k;
    spin[i * 4 + 2] = g.w;
  }
  return { pos, spin };
}

/* Wireframe planet: latitude rings + meridians + surface dust + a
   dense core that glows through */
function globe(n: number, rnd: Rand) {
  const pos = new Float32Array(n * 3);
  const R = 0.95;
  for (let i = 0; i < n; i++) {
    const pick = rnd();
    let x: number, y: number, z: number;
    if (pick < 0.4) {
      const lat = (((Math.floor(rnd() * 11) - 5) * 15) * Math.PI) / 180;
      const th = rnd() * TAU;
      x = Math.cos(lat) * Math.cos(th);
      y = Math.sin(lat);
      z = Math.cos(lat) * Math.sin(th);
    } else if (pick < 0.7) {
      const ph = (Math.floor(rnd() * 14) / 14) * Math.PI;
      const lat = (rnd() - 0.5) * Math.PI;
      x = Math.cos(lat) * Math.cos(ph);
      y = Math.sin(lat);
      z = Math.cos(lat) * Math.sin(ph);
      if (rnd() < 0.5) { x = -x; z = -z; }
    } else if (pick < 0.92) {
      const u = rnd() * 2 - 1;
      const th = rnd() * TAU;
      const s = Math.sqrt(1 - u * u);
      x = s * Math.cos(th);
      y = u;
      z = s * Math.sin(th);
    } else {
      const u = rnd() * 2 - 1;
      const th = rnd() * TAU;
      const s = Math.sqrt(1 - u * u);
      const rr = 0.32 * Math.cbrt(rnd());
      x = s * Math.cos(th) * rr / R;
      y = u * rr / R;
      z = s * Math.sin(th) * rr / R;
    }
    pos[i * 3] = x * R + (rnd() - 0.5) * 0.008;
    pos[i * 3 + 1] = y * R + (rnd() - 0.5) * 0.008;
    pos[i * 3 + 2] = z * R + (rnd() - 0.5) * 0.008;
  }
  return pos;
}

/* Data terrain: a grid of lines on the x/z plane; the shader adds
   the rolling height field and tilts it into a receding floor */
function wave(n: number, rnd: Rand) {
  const pos = new Float32Array(n * 3);
  const rows = 26, cols = 46;
  for (let i = 0; i < n; i++) {
    const pick = rnd();
    let x: number, z: number;
    if (pick < 0.62) {
      z = (Math.floor(rnd() * rows) / (rows - 1)) * 2 - 1;
      x = rnd() * 2 - 1;
    } else if (pick < 0.88) {
      x = (Math.floor(rnd() * cols) / (cols - 1)) * 2 - 1;
      z = rnd() * 2 - 1;
    } else {
      x = rnd() * 2 - 1;
      z = rnd() * 2 - 1;
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = 0;
    pos[i * 3 + 2] = z * 0.55;
  }
  return pos;
}

/* Double helix along x — the "DNA" of the process timeline */
function helix(n: number, rnd: Rand) {
  const pos = new Float32Array(n * 3);
  const r = 0.17, turns = 3.5, rungs = 36;
  for (let i = 0; i < n; i++) {
    const pick = rnd();
    let x: number, y: number, z: number;
    if (pick < 0.64) {
      const t = rnd();
      const ph = t * turns * TAU + (rnd() < 0.5 ? 0 : Math.PI);
      x = -1 + 2 * t;
      y = Math.cos(ph) * r + (rnd() - 0.5) * 0.02;
      z = Math.sin(ph) * r + (rnd() - 0.5) * 0.02;
    } else if (pick < 0.86) {
      const t = (Math.floor(rnd() * rungs) + 0.5) / rungs;
      const ph = t * turns * TAU;
      const u = rnd() * 2 - 1;
      x = -1 + 2 * t;
      y = Math.cos(ph) * r * u;
      z = Math.sin(ph) * r * u;
    } else {
      const t = rnd();
      const a = rnd() * TAU;
      const rr = 0.27 + rnd() * 0.14;
      x = -1 + 2 * t;
      y = Math.cos(a) * rr;
      z = Math.sin(a) * rr;
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
  }
  return pos;
}

/* Heater shield with a check mark — security */
function shield(n: number, rnd: Rand) {
  const pos = new Float32Array(n * 3);
  const W = 0.72;
  const topY = (x: number) => 0.82 - 0.08 * (1 - (x / W) * (x / W));
  const halfW = (y: number) => {
    if (y >= 0.05) return W;
    const u = Math.min(1, (0.05 - y) / 1.05);
    return W * Math.pow(Math.cos((u * Math.PI) / 2), 0.85);
  };

  /* outline as a dense polyline, then sample by arc length */
  const outline: [number, number][] = [];
  const S = 240;
  for (let s = 0; s <= S; s++) {
    const x = -W + (2 * W * s) / S;
    outline.push([x, topY(x)]);
  }
  for (let s = 0; s <= S; s++) {
    const y = 0.8 - (1.8 * s) / S;
    outline.push([halfW(y), y]);
  }
  for (let s = S; s >= 0; s--) {
    const y = 0.8 - (1.8 * s) / S;
    outline.push([-halfW(y), y]);
  }
  const cum = [0];
  for (let s = 1; s < outline.length; s++) {
    const [ax, ay] = outline[s - 1];
    const [bx, by] = outline[s];
    cum.push(cum[s - 1] + Math.hypot(bx - ax, by - ay));
  }
  const total = cum[cum.length - 1];
  const onOutline = (u: number): [number, number] => {
    const target = u * total;
    let lo = 0, hi = cum.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (cum[mid] < target) lo = mid + 1;
      else hi = mid;
    }
    const s = Math.max(1, lo);
    const seg = cum[s] - cum[s - 1] || 1;
    const f = (target - cum[s - 1]) / seg;
    const [ax, ay] = outline[s - 1];
    const [bx, by] = outline[s];
    return [ax + (bx - ax) * f, ay + (by - ay) * f];
  };
  const check: [number, number][] = [[-0.3, -0.04], [-0.07, -0.3], [0.34, 0.22]];
  const checkLen = [Math.hypot(0.23, 0.26), Math.hypot(0.41, 0.52)];

  for (let i = 0; i < n; i++) {
    const pick = rnd();
    let x: number, y: number;
    let z = 0;
    if (pick < 0.38) {
      [x, y] = onOutline(rnd());
      z = rnd() < 0.5 ? -0.04 : 0.04;
    } else if (pick < 0.58) {
      [x, y] = onOutline(rnd());
      x *= 0.8;
      y = (y + 0.05) * 0.8 - 0.05;
    } else if (pick < 0.78) {
      const a = rnd() * (checkLen[0] + checkLen[1]);
      const seg = a < checkLen[0] ? 0 : 1;
      const f = seg === 0 ? a / checkLen[0] : (a - checkLen[0]) / checkLen[1];
      const [ax, ay] = check[seg];
      const [bx, by] = check[seg + 1];
      x = ax + (bx - ax) * f + (rnd() - 0.5) * 0.05;
      y = ay + (by - ay) * f + (rnd() - 0.5) * 0.05;
      z = 0.06;
    } else {
      do {
        x = (rnd() * 2 - 1) * W;
        y = rnd() * 1.82 - 1;
      } while (Math.abs(x) > halfW(y) || y > topY(x));
      z = (rnd() - 0.5) * 0.05;
    }
    const bulge = 0.16 * Math.max(0, 1 - (x * x) / 0.7 - ((y + 0.1) * (y + 0.1)) / 1.1);
    pos[i * 3] = x;
    pos[i * 3 + 1] = y + 0.08;
    pos[i * 3 + 2] = z + bulge;
  }
  return pos;
}

/* Portal: a bright torus with a three-armed vortex spiralling into
   it — the shader spins inner particles faster than outer ones */
function ring(n: number, rnd: Rand) {
  const pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const pick = rnd();
    let x: number, y: number, z: number;
    if (pick < 0.5) {
      const u = rnd() * TAU;
      const v = rnd() * TAU;
      const R = 0.86, r = 0.05;
      x = (R + r * Math.cos(v)) * Math.cos(u);
      y = (R + r * Math.cos(v)) * Math.sin(u);
      z = r * Math.sin(v);
    } else if (pick < 0.62) {
      const u = rnd() * TAU;
      x = Math.cos(u) * 1.0;
      y = Math.sin(u) * 1.0;
      z = (rnd() - 0.5) * 0.02;
    } else {
      const rr = 0.12 + 0.72 * Math.sqrt(rnd());
      const arm = Math.floor(rnd() * 3);
      const a = (arm * TAU) / 3 + rr * 4.2 + (rnd() - 0.5) * 0.55;
      x = Math.cos(a) * rr;
      y = Math.sin(a) * rr;
      z = (rnd() - 0.5) * 0.06 * (1 - rr);
    }
    pos[i * 3] = x;
    pos[i * 3 + 1] = y;
    pos[i * 3 + 2] = z;
  }
  return pos;
}

export function buildShapes(n: number) {
  const rnd = mulberry32(20260101);
  const g = gear(n, rnd);
  const rand = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    rand[i * 4] = rnd();
    rand[i * 4 + 1] = rnd();
    rand[i * 4 + 2] = rnd();
    rand[i * 4 + 3] = 0.5 + Math.pow(rnd(), 2.2) * 1.3;
  }
  return {
    gear: g.pos,
    spin: g.spin,
    globe: globe(n, rnd),
    wave: wave(n, rnd),
    helix: helix(n, rnd),
    shield: shield(n, rnd),
    ring: ring(n, rnd),
    rand,
  };
}
