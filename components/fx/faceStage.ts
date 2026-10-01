import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { samplePortraits } from "./portraitSampler";

/* ──────────────────────────────────────────
   PARTICLE PORTRAITS
   Each team card holds a <canvas> inside .idc-portrait[data-src].
   The source is a background-removed, head-to-chest cutout; it is
   sampled into gold particles — denser and brighter where the photo
   is lit or has edges (eyes, brows, beard lines), so the face reads
   like a light sculpture. Depth comes from brightness plus a soft
   bulge around the head, which gives real parallax when the face
   turns toward the pointer.

   One shared WebGL renderer draws every face and copies the frame
   into that card's 2D canvas, so four portraits cost one context.
   Sampling happens off the main thread (see portraitSampler).
────────────────────────────────────────── */

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uIntro;
uniform float uHover;
uniform float uSize;
uniform float uPixelRatio;
uniform float uBust;
uniform vec2 uMouse;
uniform vec2 uRot;

attribute vec4 aData;

varying vec3 vColor;
varying float vAlpha;

vec3 rotX(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }

void main() {
  vec3 p = position;
  float b = aData.x;

  p.xy += vec2(sin(uTime * 0.9 + aData.z * 40.0), cos(uTime * 0.8 + aData.w * 40.0)) * 0.0035;

  /* points near the pointer lift toward the viewer and part */
  vec2 d = p.xy - uMouse;
  float dist = length(d);
  float push = uHover * smoothstep(0.3, 0.0, dist);
  p.xy += (d / max(dist, 0.0001)) * push * 0.06;
  p.z += push * 0.2;

  p = rotX(rotY(p, uRot.y), uRot.x);

  /* assemble out of a scattered cloud the first time it is seen */
  vec3 scatter = (vec3(aData.z, aData.w, fract(aData.z * 13.7)) - 0.5) * vec3(5.0, 5.0, 3.0);
  float ii = clamp((uIntro - aData.w * 0.45) / 0.55, 0.0, 1.0);
  ii = 1.0 - pow(1.0 - ii, 3.0);
  p = mix(scatter, p, ii);

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;

  gl_PointSize = uSize * uPixelRatio * (0.45 + b * 0.95 + aData.y * 0.2 + push * 0.8) * (4.3 / -mv.z);

  vec3 deep = vec3(0.42, 0.26, 0.05);
  vec3 gold = vec3(1.0, 0.72, 0.24);
  vec3 pale = vec3(1.0, 0.93, 0.74);
  vec3 col = mix(deep, gold, smoothstep(0.0, 0.5, b));
  col = mix(col, pale, smoothstep(0.62, 1.0, b));
  vColor = col;

  /* busts dissolve toward the chest instead of ending in a hard cut */
  float fade = mix(1.0, smoothstep(-1.0, -0.55, position.y), uBust);
  float tw = 0.82 + 0.18 * sin(uTime * 2.2 + aData.z * 60.0);
  vAlpha = min(1.0, 0.2 + 0.95 * b + aData.y * 0.2) * tw * ii * fade;
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 1.6);
  gl_FragColor = vec4(vColor, a * vAlpha);
}
`;

/* Viewing frustum at z = 0 for the shared camera (fov 30°, z 4.3) */
const VIEW_H = 2 * 4.3 * Math.tan((15 * Math.PI) / 180);

type Face = {
  slot: HTMLElement;
  card: HTMLElement;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scene: THREE.Scene;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  visible: boolean;
  started: boolean;
  intro: { v: number };
  hover: number;
  hoverTarget: number;
  mouse: THREE.Vector2;
  rot: THREE.Vector2;
  rotTarget: THREE.Vector2;
  w: number;
  h: number;
  dirty: boolean;
};

export async function createFaceStage(root: HTMLElement) {
  const slots = Array.from(root.querySelectorAll<HTMLElement>(".idc-portrait[data-src]"));
  const small = window.matchMedia("(max-width: 768px)").matches;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover)").matches;
  const dpr = Math.min(window.devicePixelRatio || 1, small ? 2 : 1.5);
  const count = small ? 9000 : 15000;

  const sources = await samplePortraits(
    slots.map((slot, i) => ({
      src: slot.dataset.src as string,
      count: slot.dataset.bust === "0" ? 5000 : count,
      seed: 7 + i * 101,
      bust: slot.dataset.bust !== "0",
    }))
  );

  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x000000, 0);
  const camera = new THREE.PerspectiveCamera(30, 0.8, 0.1, 50);
  camera.position.set(0, 0, 4.3);

  const faces: Face[] = slots.map((slot, i) => {
    const canvas = slot.querySelector("canvas") as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(sources[i].positions, 3));
    geo.setAttribute("aData", new THREE.BufferAttribute(sources[i].data, 4));
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uIntro: { value: reduced ? 1 : 0 },
        uHover: { value: 0 },
        uSize: { value: small ? 2.4 : 2.25 },
        uPixelRatio: { value: dpr },
        uBust: { value: slot.dataset.bust === "0" ? 0 : 1 },
        uMouse: { value: new THREE.Vector2(9, 9) },
        uRot: { value: new THREE.Vector2() },
      },
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    const scene = new THREE.Scene();
    scene.add(points);
    return {
      slot,
      card: (slot.closest(".idc") as HTMLElement) ?? slot,
      canvas,
      ctx,
      scene,
      geo,
      mat,
      visible: false,
      started: reduced,
      intro: { v: reduced ? 1 : 0 },
      hover: 0,
      hoverTarget: 0,
      mouse: new THREE.Vector2(9, 9),
      rot: new THREE.Vector2(),
      rotTarget: new THREE.Vector2(),
      w: 0,
      h: 0,
      dirty: true,
    };
  });

  /* sizes: canvases match their slot in device pixels; the shared
     renderer is as large as the biggest one */
  let rw = 0, rh = 0;
  const measure = () => {
    faces.forEach((f) => {
      const r = f.slot.getBoundingClientRect();
      f.w = Math.max(1, Math.round(r.width * dpr));
      f.h = Math.max(1, Math.round(r.height * dpr));
      if (f.canvas.width !== f.w || f.canvas.height !== f.h) {
        f.canvas.width = f.w;
        f.canvas.height = f.h;
      }
      f.dirty = true;
    });
    const nw = Math.max(...faces.map((f) => f.w));
    const nh = Math.max(...faces.map((f) => f.h));
    if (nw !== rw || nh !== rh) {
      rw = nw;
      rh = nh;
      renderer.setSize(rw, rh, false);
    }
  };
  measure();
  faces.forEach((f) => renderer.compile(f.scene, camera));
  const ro = new ResizeObserver(measure);
  faces.forEach((f) => ro.observe(f.slot));

  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        const f = faces.find((x) => x.slot === e.target);
        if (!f) return;
        f.visible = e.isIntersecting;
        f.dirty = true;
        if (f.visible && !f.started) {
          f.started = true;
          gsap.to(f.intro, { v: 1, duration: 1.6, ease: "power2.inOut", delay: faces.indexOf(f) * 0.1 });
        }
      }),
    { threshold: 0.15 }
  );
  faces.forEach((f) => io.observe(f.slot));

  /* pointer: the face turns toward it and parts around it */
  const cleanups: (() => void)[] = [];
  if (finePointer) {
    faces.forEach((f) => {
      const move = (e: PointerEvent) => {
        const r = f.slot.getBoundingClientRect();
        const u = (e.clientX - r.left) / r.width;
        const v = (e.clientY - r.top) / r.height;
        f.mouse.set((u - 0.5) * VIEW_H * (r.width / r.height), -(v - 0.5) * VIEW_H);
        f.rotTarget.set((v - 0.5) * 0.35, (u - 0.5) * 0.6);
        f.hoverTarget = 1;
      };
      const leave = () => {
        f.hoverTarget = 0;
        f.rotTarget.set(0, 0);
      };
      f.card.addEventListener("pointermove", move);
      f.card.addEventListener("pointerleave", leave);
      cleanups.push(() => {
        f.card.removeEventListener("pointermove", move);
        f.card.removeEventListener("pointerleave", leave);
      });
    });
  }

  let time = 0;
  const tick = (_t: number, dms: number) => {
    const dt = Math.min(dms / 1000, 0.05);
    if (!reduced) time += dt;
    const k = 1 - Math.exp(-dt * 6);
    faces.forEach((f, i) => {
      if (!f.visible || (reduced && !f.dirty)) return;
      f.hover += (f.hoverTarget - f.hover) * k;
      const idle = f.hoverTarget ? 0 : Math.sin(time * 0.45 + i * 1.7) * 0.08;
      f.rot.x += (f.rotTarget.x - f.rot.x) * k;
      f.rot.y += (f.rotTarget.y + idle - f.rot.y) * k;
      const u = f.mat.uniforms;
      u.uTime.value = time;
      u.uIntro.value = f.intro.v;
      u.uHover.value = f.hover;
      u.uMouse.value.copy(f.mouse);
      u.uRot.value.copy(f.rot);

      camera.aspect = f.w / f.h;
      camera.updateProjectionMatrix();
      renderer.setViewport(0, 0, f.w, f.h);
      renderer.render(f.scene, camera);
      f.ctx.clearRect(0, 0, f.w, f.h);
      f.ctx.drawImage(renderer.domElement, 0, rh - f.h, f.w, f.h, 0, 0, f.w, f.h);
      f.dirty = false;
    });
  };
  gsap.ticker.add(tick);

  return () => {
    gsap.ticker.remove(tick);
    io.disconnect();
    ro.disconnect();
    cleanups.forEach((c) => c());
    faces.forEach((f) => {
      gsap.killTweensOf(f.intro);
      f.geo.dispose();
      f.mat.dispose();
    });
    renderer.dispose();
  };
}
