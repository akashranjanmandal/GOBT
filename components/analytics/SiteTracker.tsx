"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/* GOBT's own analytics tracker: page views, time on page, scroll depth and
   the clicks that matter (WhatsApp, call, email, outbound links, forms).
   A random id in this browser stands for the visitor; no cookies, no IPs. */

const ENDPOINT = "/api/pulse";
const SESSION_GAP = 30 * 60_000;

const rid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`);

function store(key: string, value?: string) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    localStorage.setItem(key, value);
  } catch {
    /* private mode: ids live for this page only */
  }
  return null;
}

let memVisitor: string | null = null;
let memSession: { id: string; last: number } | null = null;

function ids() {
  let nv = false;
  let v = store("gobt_a_v") ?? memVisitor;
  if (!v) {
    v = rid();
    nv = true;
  }
  memVisitor = v;
  store("gobt_a_v", v);

  let s: { id: string; last: number } | null = memSession;
  try {
    s = JSON.parse(store("gobt_a_s") ?? "null") ?? s;
  } catch {
    /* ignore */
  }
  const t = Date.now();
  let ns = false;
  if (!s || t - s.last > SESSION_GAP) {
    s = { id: rid(), last: t };
    ns = true;
  }
  s.last = t;
  memSession = s;
  store("gobt_a_s", JSON.stringify(s));
  return { v, s: s.id, nv, ns };
}

function send(data: object) {
  const body = JSON.stringify(data);
  try {
    if (navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall back to fetch */
  }
  fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
}

const untracked = (path: string) => /^\/(referral\/admin|api\/)/.test(path);

export default function SiteTracker() {
  const pathname = usePathname();
  const search = useSearchParams();
  const view = useRef<{ pv: string; v: string; s: string; start: number; visible: number; since: number | null; scroll: number } | null>(null);

  /* engagement for the page being left */
  const flush = () => {
    const cur = view.current;
    if (!cur) return;
    const ms = cur.visible + (cur.since ? Date.now() - cur.since : 0);
    send({ t: "eng", pv: cur.pv, v: cur.v, s: cur.s, ms, sc: cur.scroll });
  };

  useEffect(() => {
    if (!pathname || untracked(pathname)) return;
    const q = search?.toString() ?? "";
    const { v, s, nv, ns } = ids();
    const pv = rid();
    view.current = { pv, v, s, start: Date.now(), visible: 0, since: document.visibilityState === "visible" ? Date.now() : null, scroll: 0 };
    send({
      t: "pv",
      pv,
      v,
      s,
      nv,
      ns,
      p: pathname,
      q: q ? `?${q}` : "",
      ti: document.title,
      r: ns ? document.referrer : "",
      w: window.innerWidth,
      lang: navigator.language,
    });
    return () => flush();
     
  }, [pathname, search]);

  useEffect(() => {
    const onScroll = () => {
      const cur = view.current;
      if (!cur) return;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const pct = h > 0 ? Math.round((window.scrollY / h) * 100) : 100;
      if (pct > cur.scroll) cur.scroll = Math.min(100, pct);
    };
    const onVisibility = () => {
      const cur = view.current;
      if (!cur) return;
      if (document.visibilityState === "hidden") {
        if (cur.since) cur.visible += Date.now() - cur.since;
        cur.since = null;
        flush();
      } else cur.since = Date.now();
    };
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.("a[href], [data-track]");
      if (!el || !view.current) return;
      const cur = view.current;
      const path = location.pathname;
      const track = el.getAttribute("data-track");
      let name = "";
      let label = "";
      if (track) {
        name = "cta_click";
        label = track;
      } else {
        const href = (el as HTMLAnchorElement).href || "";
        if (/^tel:/i.test(href)) [name, label] = ["call_click", href.slice(4)];
        else if (/^mailto:/i.test(href)) [name, label] = ["email_click", href.slice(7).split("?")[0]];
        else if (/wa\.me|whatsapp\.com/i.test(href)) [name, label] = ["whatsapp_click", href.split("?")[0]];
        else if (/\.(pdf|docx?|xlsx?|zip)(\?|$)/i.test(href)) [name, label] = ["download", href.split("/").pop() ?? href];
        else {
          try {
            const u = new URL(href);
            if (u.host && u.host !== location.host) [name, label] = ["outbound_click", u.host];
          } catch {
            /* not a link */
          }
        }
      }
      if (name) send({ t: "ev", v: cur.v, s: cur.s, p: path, n: name, l: label.slice(0, 200) });
    };
    const onSubmit = (e: SubmitEvent) => {
      const cur = view.current;
      if (!cur) return;
      const form = e.target as HTMLFormElement;
      const label = form.getAttribute("data-track") || form.getAttribute("aria-label") || form.id || form.getAttribute("name") || "form";
      send({ t: "ev", v: cur.v, s: cur.s, p: location.pathname, n: "form_submit", l: label.slice(0, 100) });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("submit", onSubmit, { capture: true });
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("submit", onSubmit, { capture: true });
      window.removeEventListener("pagehide", flush);
    };
     
  }, []);

  return null;
}
