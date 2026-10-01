/* ──────────────────────────────────────────
   PORTRAIT SAMPLER
   Turns a background-removed cutout into particle positions. The
   work (contrast stretch, local-contrast boost, Sobel edges,
   weighted sampling) takes tens of milliseconds per image, so it
   runs in a Web Worker on an OffscreenCanvas and never blocks
   scrolling. Browsers without OffscreenCanvas run the same code on
   the main thread.

   The core is kept as plain-JS source (not a compiled function's
   toString) so the worker never depends on bundler helpers.
────────────────────────────────────────── */

export type PortraitPoints = { positions: Float32Array; data: Float32Array };

const CORE = /* js */ `
function samplePortrait(px, SW, SH, count, seed, bust) {
  var n = SW * SH;
  var smooth = function (a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  var A = new Float32Array(n), L = new Float32Array(n), lums = [];
  for (var i = 0; i < n; i++) {
    A[i] = smooth(0.25, 0.65, px[i * 4 + 3] / 255);
    if (A[i] > 0) {
      L[i] = (0.2126 * px[i * 4] + 0.7152 * px[i * 4 + 1] + 0.0722 * px[i * 4 + 2]) / 255;
      lums.push(L[i]);
    }
  }
  lums.sort(function (a, b) { return a - b; });
  var lo = lums.length ? lums[Math.floor(lums.length * 0.02)] : 0;
  var hi = lums.length ? lums[Math.floor(lums.length * 0.98)] : 1;
  for (i = 0; i < n; i++) if (A[i] > 0) L[i] = Math.min(1, Math.max(0, (L[i] - lo) / ((hi - lo) || 1)));

  /* local contrast: amplify each pixel against an alpha-weighted
     blurred neighbourhood so eyes, nostrils and lips carve out */
  var R = Math.max(3, Math.round(SW / 36));
  var blurPass = function (src, horizontal) {
    var out = new Float32Array(n);
    for (var y = 0; y < SH; y++) {
      for (var x = 0; x < SW; x++) {
        var acc = 0;
        for (var k = -R; k <= R; k++) {
          var xx = horizontal ? Math.min(SW - 1, Math.max(0, x + k)) : x;
          var yy = horizontal ? y : Math.min(SH - 1, Math.max(0, y + k));
          acc += src[yy * SW + xx];
        }
        out[y * SW + x] = acc / (2 * R + 1);
      }
    }
    return out;
  };
  var LA = new Float32Array(n);
  for (i = 0; i < n; i++) LA[i] = L[i] * A[i];
  var bLA = blurPass(blurPass(LA, true), false);
  var bA = blurPass(blurPass(A, true), false);
  for (i = 0; i < n; i++) {
    if (A[i] <= 0) continue;
    var local = bA[i] > 0.001 ? bLA[i] / bA[i] : L[i];
    L[i] = Math.min(1, Math.max(0, 0.5 + (L[i] - 0.5) * 0.75 + (L[i] - local) * 2.4));
  }

  /* Sobel edges carry the features */
  var E = new Float32Array(n), edges = [];
  var at = function (j) { return L[j] * A[j]; };
  for (var y = 1; y < SH - 1; y++) {
    for (var x = 1; x < SW - 1; x++) {
      var c = y * SW + x;
      if (A[c] <= 0) continue;
      var gx = -at(c - SW - 1) - 2 * at(c - 1) - at(c + SW - 1) + at(c - SW + 1) + 2 * at(c + 1) + at(c + SW + 1);
      var gy = -at(c - SW - 1) - 2 * at(c - SW) - at(c - SW + 1) + at(c + SW - 1) + 2 * at(c + SW) + at(c + SW + 1);
      E[c] = Math.sqrt(gx * gx + gy * gy);
      edges.push(E[c]);
    }
  }
  edges.sort(function (a, b) { return a - b; });
  var eMax = edges.length ? edges[Math.floor(edges.length * 0.96)] || 1 : 1;

  /* head centre: mean x across the top 35% of the figure */
  var top = SH;
  for (i = 0; i < n && top === SH; i++) if (A[i] > 0.5) top = Math.floor(i / SW);
  var sx = 0, cnt = 0, headEnd = top + Math.round((SH - top) * 0.35);
  for (y = top; y < headEnd; y++) for (x = 0; x < SW; x++) if (A[y * SW + x] > 0.5) { sx += x; cnt++; }
  var aspect = SW / SH;
  var fit = bust ? 1 : 0.62 * Math.min(1, 0.8 / aspect);
  var toX = function (v) { return (v / SW - 0.5) * 2 * aspect * fit; };
  var toY = function (v) { return -(v / SH - 0.5) * 2 * fit; };
  var hx = cnt ? toX(sx / cnt) : 0;
  var hy = toY(top + (SH - top) * 0.22);

  var W = new Float32Array(n), sum = 0;
  for (i = 0; i < n; i++) {
    if (A[i] <= 0) continue;
    E[i] = Math.min(1, E[i] / eMax);
    W[i] = A[i] * (0.22 + 0.78 * Math.pow(L[i], 1.25) + 0.4 * E[i]);
    sum += W[i];
  }

  var s = seed | 0;
  var rnd = function () {
    s = (s + 0x6d2b79f5) | 0;
    var t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  var cap = Math.ceil(count * 1.1) + 64;
  var pos = new Float32Array(cap * 3), dat = new Float32Array(cap * 4), m = 0;
  for (i = 0; i < n && m < cap; i++) {
    if (W[i] <= 0) continue;
    var expect = (W[i] * count) / sum;
    var kk = Math.floor(expect);
    if (rnd() < expect - kk) kk++;
    var x0 = i % SW, y0 = Math.floor(i / SW);
    for (var j = 0; j < kk && m < cap; j++) {
      var px_ = toX(x0 + rnd()), py_ = toY(y0 + rnd());
      var bulge = 0.24 * Math.exp(-(((px_ - hx) * (px_ - hx)) / 0.2 + ((py_ - hy) * (py_ - hy)) / 0.34));
      pos[m * 3] = px_;
      pos[m * 3 + 1] = py_;
      pos[m * 3 + 2] = (L[i] - 0.5) * 0.12 + bulge + (rnd() - 0.5) * 0.01;
      dat[m * 4] = L[i];
      dat[m * 4 + 1] = E[i];
      dat[m * 4 + 2] = rnd();
      dat[m * 4 + 3] = rnd();
      m++;
    }
  }
  return { positions: pos.slice(0, m * 3), data: dat.slice(0, m * 4) };
}
`;

const WORKER = /* js */ `
${CORE}
self.onmessage = function (e) {
  var d = e.data;
  try {
    var SW = 220, SH = Math.max(1, Math.round((SW * d.bitmap.height) / d.bitmap.width));
    var c = new OffscreenCanvas(SW, SH);
    var g = c.getContext("2d", { willReadFrequently: true });
    g.drawImage(d.bitmap, 0, 0, SW, SH);
    if (d.bitmap.close) d.bitmap.close();
    var r = samplePortrait(g.getImageData(0, 0, SW, SH).data, SW, SH, d.count, d.seed, d.bust);
    self.postMessage({ id: d.id, positions: r.positions, data: r.data }, [r.positions.buffer, r.data.buffer]);
  } catch (err) {
    self.postMessage({ id: d.id, error: String(err) });
  }
};
`;

type Job = { src: string; count: number; seed: number; bust: boolean };

async function decode(src: string) {
  const blob = await (await fetch(src)).blob();
  return createImageBitmap(blob);
}

/* main-thread fallback: same core, run between frames */
async function sampleOnMainThread(job: Job): Promise<PortraitPoints> {
  const core = new Function(`${CORE}; return samplePortrait;`)() as (
    px: Uint8ClampedArray, sw: number, sh: number, count: number, seed: number, bust: boolean
  ) => PortraitPoints;
  const bitmap = await decode(job.src);
  const SW = 220;
  const SH = Math.max(1, Math.round((SW * bitmap.height) / bitmap.width));
  const c = document.createElement("canvas");
  c.width = SW;
  c.height = SH;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) throw new Error("2d context unavailable");
  g.drawImage(bitmap, 0, 0, SW, SH);
  bitmap.close();
  await new Promise((r) => setTimeout(r, 0));
  return core(g.getImageData(0, 0, SW, SH).data, SW, SH, job.count, job.seed, job.bust);
}

export async function samplePortraits(jobs: Job[]): Promise<PortraitPoints[]> {
  const canWork = typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined" && typeof createImageBitmap !== "undefined";
  if (!canWork) {
    const out: PortraitPoints[] = [];
    for (const job of jobs) out.push(await sampleOnMainThread(job));
    return out;
  }

  const url = URL.createObjectURL(new Blob([WORKER], { type: "text/javascript" }));
  const worker = new Worker(url);
  try {
    const bitmaps = await Promise.all(jobs.map((j) => decode(j.src)));
    return await Promise.all(
      jobs.map(
        (job, id) =>
          new Promise<PortraitPoints>((resolve, reject) => {
            const onMessage = (e: MessageEvent) => {
              if (e.data.id !== id) return;
              worker.removeEventListener("message", onMessage);
              if (e.data.error) reject(new Error(e.data.error));
              else resolve({ positions: e.data.positions, data: e.data.data });
            };
            worker.addEventListener("message", onMessage);
            worker.postMessage({ id, bitmap: bitmaps[id], count: job.count, seed: job.seed, bust: job.bust }, [bitmaps[id]]);
          })
      )
    );
  } finally {
    worker.terminate();
    URL.revokeObjectURL(url);
  }
}
