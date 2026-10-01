"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { gsap } from "@/lib/gsap";
import { EVT_INTRO, getLenis, introState, prefersReducedMotion } from "@/lib/scroll";
import { buildShapes, SHAPE_NAMES } from "./shapes";

/* ──────────────────────────────────────────
   PARTICLE FIELD
   One fixed WebGL layer behind the whole page. Sections place
   anchors — `<div data-fx="globe" />` — and the field travels
   between them as you scroll: it docks on the anchor nearest the
   viewport centre, morphs shape on the way to the next, scales to
   the anchor's size and fades with its opacity.

   Anchor attributes:
     data-fx            shape name (see SHAPE_NAMES)
     data-fx-opacity    0–1, default 1
     data-fx-opacity-sm opacity on small screens
     data-fx-fit        "min" (default) | "width" — which side sizes it
     data-fx-y          optional fixed viewport position (0–1) instead
                        of following the anchor's own centre
────────────────────────────────────────── */

const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);
  const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));
  vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);
  vec3 l=1.0-g;
  vec3 i1=min(g.xyz,l.zxy);
  vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;
  vec3 x2=x0-i2+C.yyy;
  vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;
  vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z);
  vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;
  vec4 y=y_*ns.x+ns.yyyy;
  vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);
  vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;
  vec4 s1=floor(b1)*2.0+1.0;
  vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
  vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);
  vec3 p1=vec3(a0.zw,h.y);
  vec3 p2=vec3(a1.xy,h.z);
  vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);
  m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uIntro;
uniform float uMix;
uniform float uA;
uniform float uB;
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uMouse;
uniform float uMouseForce;
uniform float uEnergy;

attribute vec3 aGlobe;
attribute vec3 aWave;
attribute vec3 aHelix;
attribute vec3 aShield;
attribute vec3 aRing;
attribute vec4 aRand;
attribute vec4 aSpin;

varying vec3 vColor;
varying float vAlpha;

${NOISE}

vec3 rotX(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(p.x, c*p.y - s*p.z, s*p.y + c*p.z); }
vec3 rotY(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x + s*p.z, p.y, -s*p.x + c*p.z); }
vec3 rotZ(vec3 p, float a){ float c=cos(a), s=sin(a); return vec3(c*p.x - s*p.y, s*p.x + c*p.y, p.z); }

vec3 shapePos(float k) {
  if (k < 0.5) {
    vec2 c = aSpin.xy;
    vec3 d = rotZ(vec3(position.xy - c, 0.0), uTime * aSpin.z);
    vec3 p = vec3(c + d.xy, position.z);
    return rotY(rotX(p, -0.22), 0.38 + sin(uTime * 0.25) * 0.08);
  } else if (k < 1.5) {
    return rotX(rotY(aGlobe, uTime * 0.22), 0.36);
  } else if (k < 2.5) {
    vec3 p = aWave;
    p.y = sin(p.x * 5.0 + uTime * 0.9) * 0.07
        + cos(p.z * 9.0 - uTime * 0.7) * 0.05
        + sin((p.x + p.z) * 3.0 + uTime * 0.5) * 0.06;
    return rotX(p, 1.05);
  } else if (k < 3.5) {
    return rotX(aHelix, uTime * 0.55);
  } else if (k < 4.5) {
    return rotY(aShield, sin(uTime * 0.5) * 0.4);
  }
  float r = length(aRing.xy);
  vec3 p = rotZ(aRing, uTime * (0.06 + 0.55 * (1.0 - clamp(r, 0.0, 1.0))));
  return rotX(p, 0.3);
}

void main() {
  vec3 pA = shapePos(uA);
  vec3 pB = shapePos(uB);

  /* stagger every particle's departure so the morph ripples
     through the cloud instead of snapping as one block */
  float st = aRand.x * 0.4;
  float m = clamp((uMix - st) / 0.6, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 p = mix(pA, pB, m);

  float burst = sin(m * 3.14159265) * step(0.5, abs(uA - uB));
  vec3 q = p * 1.4 + uTime * 0.12;
  vec3 n = vec3(snoise(q), snoise(q + 17.3), snoise(q + 41.7));
  p += n * (0.26 * burst + 0.014 + uEnergy * 0.04);

  /* intro: particles fly in from a wide scatter and assemble */
  vec3 scatter = (aRand.xyz - 0.5) * vec3(10.0, 7.0, 8.0);
  float ii = clamp((uIntro - aRand.y * 0.45) / 0.55, 0.0, 1.0);
  ii = 1.0 - pow(1.0 - ii, 3.0);
  p = mix(scatter, p, ii);

  vec4 world = modelMatrix * vec4(p, 1.0);
  vec2 dm = world.xy - uMouse;
  float dist = length(dm);
  float push = uMouseForce * smoothstep(1.5, 0.0, dist);
  world.xy += (dm / max(dist, 0.001)) * push * 0.75;
  world.z += push * 0.9;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * aRand.w * uPixelRatio * (18.0 / -mv.z) * (1.0 + push * 0.6 + burst * 0.35);

  float c = aRand.z;
  vec3 deep = vec3(0.62, 0.40, 0.07);
  vec3 gold = vec3(1.0, 0.73, 0.24);
  vec3 pale = vec3(1.0, 0.9, 0.62);
  vec3 col = mix(deep, gold, smoothstep(0.0, 0.6, c));
  col = mix(col, pale, smoothstep(0.78, 0.96, c));
  col = mix(col, vec3(1.0), step(0.986, c));
  vColor = col;

  float tw = 0.62 + 0.38 * sin(uTime * (1.4 + aRand.y * 2.6) + aRand.x * 6.2831);
  vAlpha = tw * ii * (1.0 + burst * 0.5 + push * 0.6);
}
`;

const FRAGMENT = /* glsl */ `
uniform float uOpacity;
varying vec3 vColor;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = pow(smoothstep(0.5, 0.0, d), 1.7);
  gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
}
`;

type Anchor = {
  el: HTMLElement;
  shape: number;
  opacity: number;
  fitWidth: boolean;
  fy: number | null;
};

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export default function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
    } catch {
      canvas.remove();
      return;
    }

    const small = window.matchMedia("(max-width: 768px)").matches;
    const reduced = prefersReducedMotion();
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const count = small ? 7000 : 16000;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 1.75 : 1.5);

    /* The canvas is 100lvh tall in CSS, so a phone's address bar
       showing or hiding never resizes (and visibly rescales) it */
    let cw = canvas.clientWidth || window.innerWidth;
    let ch = canvas.clientHeight || window.innerHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(cw, ch, false);
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, cw / ch, 0.1, 100);
    camera.position.set(0, 0, 18);
    const viewH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));

    const shapes = buildShapes(count);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(shapes.gear, 3));
    geo.setAttribute("aGlobe", new THREE.BufferAttribute(shapes.globe, 3));
    geo.setAttribute("aWave", new THREE.BufferAttribute(shapes.wave, 3));
    geo.setAttribute("aHelix", new THREE.BufferAttribute(shapes.helix, 3));
    geo.setAttribute("aShield", new THREE.BufferAttribute(shapes.shield, 3));
    geo.setAttribute("aRing", new THREE.BufferAttribute(shapes.ring, 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(shapes.rand, 4));
    geo.setAttribute("aSpin", new THREE.BufferAttribute(shapes.spin, 4));

    const uniforms = {
      uTime: { value: 0 },
      uIntro: { value: reduced || introState.done ? 1 : 0 },
      uMix: { value: 0 },
      uA: { value: 0 },
      uB: { value: 0 },
      uSize: { value: small ? 2.4 : 2.6 },
      uPixelRatio: { value: dpr },
      uMouse: { value: new THREE.Vector2(999, 999) },
      uMouseForce: { value: 0 },
      uEnergy: { value: 0 },
      uOpacity: { value: 0 },
    };

    const mat = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    /* ── anchors ── */
    let anchors: Anchor[] = [];
    const collect = () => {
      anchors = Array.from(document.querySelectorAll<HTMLElement>("[data-fx]"))
        .map((el) => {
          const d = el.dataset;
          const base = parseFloat(d.fxOpacity ?? "1");
          return {
            el,
            shape: Math.max(0, SHAPE_NAMES.indexOf((d.fx ?? "gear") as (typeof SHAPE_NAMES)[number])),
            opacity: small && d.fxOpacitySm ? parseFloat(d.fxOpacitySm) : base,
            fitWidth: d.fxFit === "width",
            fy: d.fxY ? parseFloat(d.fxY) : null,
          };
        });
    };
    collect();
    const recollect = window.setTimeout(collect, 600);

    /* ── pointer ── */
    let px = -9999, py = -9999, lastMove = 0;
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      px = e.clientX;
      py = e.clientY;
      lastMove = performance.now();
    };
    if (finePointer && !reduced) window.addEventListener("pointermove", onPointer, { passive: true });

    /* ── intro ── */
    const startIntro = () => {
      gsap.to(uniforms.uIntro, { value: 1, duration: 3, ease: "power2.inOut" });
    };
    if (uniforms.uIntro.value < 1) window.addEventListener(EVT_INTRO, startIntro, { once: true });

    const onResize = () => {
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;
      if (w === cw && h === ch) return;
      cw = w;
      ch = h;
      renderer.setSize(cw, ch, false);
      camera.aspect = cw / ch;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    let lost = false;
    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
    };
    const onRestored = () => {
      lost = false;
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    /* ── per-frame state ── */
    let progress = -1;
    const state = { x: 0, y: 0, s: 1, o: 0, rx: 0, ry: 0, energy: 0, force: 0 };
    let elapsed = 0;

    const tick = (_t: number, deltaMs: number) => {
      if (lost || anchors.length === 0) return;
      const dt = Math.min(deltaMs / 1000, 0.05);
      if (!reduced) elapsed += dt;

      /* layout space is the visual viewport; projection space is the
         canvas (taller than the viewport while a phone toolbar shows) */
      const W = cw;
      const H = window.innerHeight;
      const k = viewH / ch;
      const c = H / 2;

      const geom = anchors.map((a) => {
        const r = a.el.getBoundingClientRect();
        const cy = r.top + r.height / 2;
        const docked = a.fy !== null ? a.fy * H : clamp(cy, H * 0.16, H * 0.84);
        /* fade an anchor's contribution once its section has
           scrolled well outside the viewport */
        const outside = cy < -H * 0.25 ? -H * 0.25 - cy : cy > H * 1.25 ? cy - H * 1.25 : 0;
        const fade = 1 - smoothstep(0, H * 0.7, outside);
        return {
          cx: r.left + r.width / 2,
          cy,
          docked,
          size: a.fitWidth ? r.width : Math.min(r.width, r.height),
          fade,
        };
      });

      const last = anchors.length - 1;
      let target: number;
      if (geom[0].cy >= c) target = 0;
      else if (geom[last].cy <= c) target = last;
      else {
        let i = 0;
        while (i < last && geom[i + 1].cy <= c) i++;
        const span = geom[i + 1].cy - geom[i].cy || 1;
        target = i + clamp((c - geom[i].cy) / span, 0, 1);
      }
      if (progress < 0) progress = target;
      progress += (target - progress) * (1 - Math.exp(-dt * 12));

      const i0 = Math.min(last, Math.floor(progress));
      const i1 = Math.min(last, i0 + 1);
      const te = smoothstep(0.16, 0.84, progress - i0);
      const a0 = anchors[i0], a1 = anchors[i1];
      const g0 = geom[i0], g1 = geom[i1];

      const tx = (lerp(g0.cx, g1.cx, te) - W / 2) * k;
      const ty = -(lerp(g0.docked, g1.docked, te) - ch / 2) * k;
      const ts = (lerp(g0.size, g1.size, te) / 2) * k;
      /* dip while one shape dissolves into the next, so the swap
         reads as a re-form rather than a cloud flying across */
      const morphing = a0.shape !== a1.shape ? Math.sin(Math.PI * te) : 0;
      const to = lerp(a0.opacity * g0.fade, a1.opacity * g1.fade, te) * (1 - 0.5 * morphing);

      const ease = 1 - Math.exp(-dt * 10);
      state.x += (tx - state.x) * ease;
      state.y += (ty - state.y) * ease;
      state.s += (ts - state.s) * ease;
      state.o += (to - state.o) * ease;

      /* pointer: subtle parallax tilt + local repulsion */
      const active = finePointer && !reduced && performance.now() - lastMove < 2500;
      const nx = active ? (px / W) * 2 - 1 : 0;
      const ny = active ? (py / H) * 2 - 1 : 0;
      state.ry += (nx * 0.22 - state.ry) * ease * 0.5;
      state.rx += (ny * 0.14 - state.rx) * ease * 0.5;
      state.force += ((active ? 1 : 0) - state.force) * ease * 0.6;

      const vel = Math.abs(getLenis()?.velocity ?? 0);
      state.energy += (clamp(vel / 45, 0, 1) - state.energy) * ease;

      group.position.set(state.x, state.y, 0);
      group.scale.setScalar(Math.max(0.0001, state.s));
      group.rotation.set(state.rx, state.ry, 0);

      uniforms.uTime.value = elapsed;
      uniforms.uA.value = a0.shape;
      uniforms.uB.value = a1.shape;
      uniforms.uMix.value = i0 === i1 ? 0 : te;
      uniforms.uOpacity.value = state.o;
      uniforms.uEnergy.value = state.energy;
      uniforms.uMouseForce.value = state.force;
      uniforms.uMouse.value.set((px - W / 2) * k, -(py - ch / 2) * k);

      if (state.o > 0.003) renderer.render(scene, camera);
      else renderer.clear();
    };

    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      window.clearTimeout(recollect);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener(EVT_INTRO, startIntro);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      geo.dispose();
      mat.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="fx-canvas" aria-hidden="true" />;
}
