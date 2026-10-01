"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { WORKS } from "@/lib/content";
import { lockScroll } from "@/lib/scroll";

/* ──────────────────────────────────────────
   VR GALLERY
   Fullscreen overlay: work cards laid out as a gently curved row in
   3D space. Scrub the row by hovering the screen edges, dragging,
   scrolling the wheel, or with the arrow keys.
────────────────────────────────────────── */
export default function VRGallery({ category, onClose }: { category: "All" | "Web" | "App"; onClose: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    lockScroll(true);
    closeRef.current?.focus();
    return () => lockScroll(false);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const works = category === "All" ? WORKS : WORKS.filter((w) => w.category === category);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x050403, 0.045);

    const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 0.3, 10.5);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xfff4e0, 0.55));
    const key = new THREE.PointLight(0xffd06a, 2.2, 40, 2);
    key.position.set(0, 3, 7);
    scene.add(key);
    const rim = new THREE.PointLight(0xffb347, 0.9, 40, 2);
    rim.position.set(-5, -2, -5);
    scene.add(rim);
    const rim2 = new THREE.PointLight(0xff8a3c, 0.6, 40, 2);
    rim2.position.set(5, -1, -4);
    scene.add(rim2);

    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({ color: 0x0a0806, roughness: 0.35, metalness: 0.6 });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.6;
    scene.add(floor);

    const grid = new THREE.GridHelper(80, 60, 0xc8860c, 0x2a2216);
    grid.position.y = -2.59;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.22;
    scene.add(grid);

    const DUST_COUNT = 160;
    const dustGeo = new THREE.BufferGeometry();
    const dustPos = new Float32Array(DUST_COUNT * 3);
    for (let i = 0; i < DUST_COUNT; i++) {
      dustPos[i * 3] = (Math.random() - 0.5) * 30;
      dustPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      dustPos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 4;
    }
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPos, 3));
    const dustMat = new THREE.PointsMaterial({ color: 0xffd58a, size: 0.045, transparent: true, opacity: 0.5, depthWrite: false });
    const dust = new THREE.Points(dustGeo, dustMat);
    scene.add(dust);

    const CARD_W = 3.1;
    const CARD_H = category === "App" ? 2.4 : 1.95;
    const GAP = 1.15;

    const makeCardTexture = (work: (typeof WORKS)[number]) => {
      const cw = 640;
      const ch = category === "App" ? 500 : 400;
      const c = document.createElement("canvas");
      c.width = cw;
      c.height = ch;
      const cctx = c.getContext("2d")!;
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;

      const draw = (img: HTMLImageElement | null) => {
        cctx.clearRect(0, 0, cw, ch);
        cctx.fillStyle = "#141414";
        cctx.fillRect(0, 0, cw, ch);
        if (img) {
          const scale = Math.max(cw / img.width, ch / img.height);
          const iw = img.width * scale;
          const ih = img.height * scale;
          cctx.drawImage(img, (cw - iw) / 2, (ch - ih) / 2, iw, ih);
          const grad = cctx.createLinearGradient(0, ch * 0.55, 0, ch);
          grad.addColorStop(0, "rgba(0,0,0,0)");
          grad.addColorStop(1, "rgba(0,0,0,0.78)");
          cctx.fillStyle = grad;
          cctx.fillRect(0, 0, cw, ch);
        }
        cctx.fillStyle = "rgba(255,255,255,0.94)";
        cctx.font = "700 34px Arial, sans-serif";
        cctx.textBaseline = "bottom";
        cctx.fillText(work.title, 28, ch - 30);
        cctx.fillStyle = "#e7b53c";
        cctx.font = "600 15px Arial, sans-serif";
        cctx.fillText(work.tag.toUpperCase(), 28, ch - 8);
        tex.needsUpdate = true;
      };
      draw(null);
      const img = new Image();
      img.onload = () => draw(img);
      img.src = work.image;
      return tex;
    };

    const cards: THREE.Mesh[] = works.map((work, i) => {
      const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1);
      const mat = new THREE.MeshStandardMaterial({
        map: makeCardTexture(work),
        roughness: 0.55,
        metalness: 0.1,
        emissive: new THREE.Color(work.accent || "#000000"),
        emissiveIntensity: 0.06,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.userData.baseX = i * (CARD_W + GAP);
      scene.add(mesh);
      return mesh;
    });

    const totalSpan = Math.max(0, (cards.length - 1) * (CARD_W + GAP));
    let offset = 0;
    let target = 0;
    let hoverDir = 0;
    const clampT = (v: number) => Math.max(0, Math.min(totalSpan, v));

    /* edge hover zones */
    const parent = mount.parentElement;
    const zones = Array.from(parent?.querySelectorAll<HTMLElement>(".vr-zone") ?? []);
    const enters = zones.map((z) => {
      const dir = z.dataset.dir === "left" ? -1 : 1;
      const on = () => (hoverDir = dir);
      const off = () => (hoverDir = 0);
      z.addEventListener("pointerenter", on);
      z.addEventListener("pointerleave", off);
      return { z, on, off };
    });

    /* drag, wheel, keys */
    let dragging = false;
    let lastX = 0;
    const unitsPerPx = () => (CARD_W + GAP) / Math.max(240, mount.clientWidth * 0.32);
    const onDown = (e: PointerEvent) => {
      dragging = true;
      lastX = e.clientX;
      mount.setPointerCapture(e.pointerId);
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      target = clampT(target - (e.clientX - lastX) * unitsPerPx());
      lastX = e.clientX;
    };
    const onUp = () => {
      dragging = false;
      target = clampT(Math.round(target / (CARD_W + GAP)) * (CARD_W + GAP));
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target = clampT(target + (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.012);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") target = clampT(Math.round(target / (CARD_W + GAP) + 1) * (CARD_W + GAP));
      if (e.key === "ArrowLeft") target = clampT(Math.round(target / (CARD_W + GAP) - 1) * (CARD_W + GAP));
    };
    mount.addEventListener("pointerdown", onDown);
    mount.addEventListener("pointermove", onMove);
    mount.addEventListener("pointerup", onUp);
    mount.addEventListener("pointercancel", onUp);
    mount.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);

    let raf = 0;
    const timer = new THREE.Timer();
    timer.connect(document);
    const animate = (ts?: number) => {
      raf = requestAnimationFrame(animate);
      timer.update(ts);
      const dt = Math.min(timer.getDelta(), 0.05);
      const now = timer.getElapsed();

      if (hoverDir !== 0 && !dragging) target = clampT(target + hoverDir * 6 * dt);
      offset += (target - offset) * (1 - Math.exp(-dt * 6));

      cards.forEach((mesh) => {
        const localX = mesh.userData.baseX - offset;
        mesh.position.x = localX;
        const t = localX / 6;
        mesh.position.z = -Math.abs(t) * 0.9;
        mesh.rotation.y = -t * 0.22;
        const dist = Math.abs(localX);
        mesh.scale.setScalar(dist < 4 ? 1 : Math.max(0.72, 1 - (dist - 4) * 0.05));
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const focus = Math.max(0, 1 - dist / 2);
        mat.emissiveIntensity = 0.05 + focus * (0.12 + (0.5 + 0.5 * Math.sin(now * 1.6)) * 0.06);
      });

      dust.rotation.y = now * 0.012;
      camera.position.x = Math.sin(now * 0.15) * 0.15;
      camera.position.y = 0.3 + Math.cos(now * 0.12) * 0.08;
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      timer.dispose();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      mount.removeEventListener("pointerdown", onDown);
      mount.removeEventListener("pointermove", onMove);
      mount.removeEventListener("pointerup", onUp);
      mount.removeEventListener("pointercancel", onUp);
      mount.removeEventListener("wheel", onWheel);
      enters.forEach(({ z, on, off }) => {
        z.removeEventListener("pointerenter", on);
        z.removeEventListener("pointerleave", off);
      });
      cards.forEach((mesh) => {
        mesh.geometry.dispose();
        const mat = mesh.material as THREE.MeshStandardMaterial;
        mat.map?.dispose();
        mat.dispose();
      });
      floorGeo.dispose();
      floorMat.dispose();
      (grid.material as THREE.Material).dispose();
      dustGeo.dispose();
      dustMat.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement === mount) mount.removeChild(renderer.domElement);
    };
  }, [category, onClose]);

  const label = category === "All" ? "All projects" : category === "Web" ? "Web platforms" : "Mobile apps";

  return (
    <div className="vr" role="dialog" aria-modal="true" aria-label={`VR gallery — ${label}`} data-lenis-prevent>
      <div className="vr-mount" ref={mountRef} />
      <div className="vr-zone vr-zone-left" data-dir="left" aria-hidden="true" />
      <div className="vr-zone vr-zone-right" data-dir="right" aria-hidden="true" />
      <div className="vr-top">
        <span className="vr-label">
          {label} · VR gallery
        </span>
        <button className="btn btn-ghost vr-close" onClick={onClose} ref={closeRef}>
          <span className="btn-label">Exit VR</span>
          <span aria-hidden="true">✕</span>
        </button>
      </div>
      <p className="vr-hint">Drag, scroll or use ← → to travel · Esc to exit</p>
    </div>
  );
}
