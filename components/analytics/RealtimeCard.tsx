"use client";

import { useEffect, useState } from "react";
import type { Realtime } from "@/lib/analytics/report";

const since = (t: number) => {
  const s = Math.max(0, Math.round((Date.now() - t) / 1000));
  return s < 60 ? `${s}s ago` : `${Math.floor(s / 60)} min ago`;
};

/* "who's on the site right now", refreshed every 15 seconds */
export default function RealtimeCard({ initial }: { initial: Realtime }) {
  const [d, setD] = useState(initial);
  const [, tick] = useState(0);
  useEffect(() => {
    let live = true;
    const load = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/referral/admin/analytics/realtime", { cache: "no-store" });
        if (res.ok && live) setD(await res.json());
      } catch {
        /* try again next time */
      }
    };
    const a = setInterval(load, 15_000);
    const b = setInterval(() => tick((n) => n + 1), 5_000);
    return () => {
      live = false;
      clearInterval(a);
      clearInterval(b);
    };
  }, []);
  const max = Math.max(1, ...d.perMinute);
  return (
    <section className="cd an-rt" aria-label="Real time">
      <div className="an-rt-head">
        <div>
          <span className="an-dot" aria-hidden="true" /> <b className="an-rt-n">{d.activeNow}</b> on the site now
          <small>
            {d.last30} visitors · {d.views30} page views in the last 30 minutes
          </small>
        </div>
        <div className="an-rt-bars" role="img" aria-label="Page views per minute, last 30 minutes">
          {d.perMinute.map((n, i) => (
            <span key={i} style={{ height: n ? `${Math.max(8, (n / max) * 100)}%` : "2px" }} title={`${29 - i} min ago: ${n}`} />
          ))}
        </div>
      </div>
      <div className="an-rt-cols">
        <div>
          <h3>Pages being viewed</h3>
          {d.topPages.length === 0 ? (
            <p className="an-muted">Nobody in the last 30 minutes.</p>
          ) : (
            <ol className="an-mini">
              {d.topPages.map((p) => (
                <li key={p.path}>
                  <span>{p.path}</span>
                  <b>{p.views}</b>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div>
          <h3>Latest visits</h3>
          {d.recent.length === 0 ? (
            <p className="an-muted">—</p>
          ) : (
            <ol className="an-mini">
              {d.recent.map((r, i) => (
                <li key={i}>
                  <span>
                    {r.path}
                    <small>
                      {r.source} · {r.device}
                      {r.place ? ` · ${r.place}` : ""}
                    </small>
                  </span>
                  <small>{since(r.at)}</small>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  );
}
