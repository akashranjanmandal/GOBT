"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Inspection } from "@/lib/analytics/gsc";

type Row = { url: string; i: Inspection | null };

const DAY = 86_400_000;
const short = (u: string) => u.replace(/^https?:\/\/(www\.)?gobt\.in/, "") || "/";
const when = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—");
const status = (i: Inspection | null) =>
  !i ? "unchecked" : i.verdict === "PASS" ? "indexed" : /not indexed|excluded|blocked|error|redirect|404|duplicate|alternate/i.test(i.coverage) || i.verdict === "FAIL" ? "problem" : "waiting";
const LABEL = { indexed: "In Google", problem: "Not in Google", waiting: "Not yet", unchecked: "Not checked" } as const;

/* the list of pages with Google's verdict; checks run a few at a time */
export default function IndexChecker({ rows, connected }: { rows: Row[]; connected: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string[] | null>(null);
  const [done, setDone] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [show, setShow] = useState<"all" | "problem" | "indexed" | "unchecked">("all");

  const run = async (urls: string[]) => {
    setBusy(urls);
    setDone(0);
    setError(null);
    for (let k = 0; k < urls.length; k += 6) {
      try {
        const res = await fetch("/api/referral/admin/analytics/inspect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ urls: urls.slice(k, k + 6) }),
        });
        const body = (await res.json()) as { done?: number; errors?: string[]; error?: string };
        if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
        if (body.errors?.length) setError(body.errors[0]);
        setDone((n) => n + Math.min(6, urls.length - k));
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
        break;
      }
    }
    setBusy(null);
    router.refresh();
  };

  const stale = rows.filter((r) => !r.i || Date.now() - r.i.checkedAt > DAY).map((r) => r.url);
  const counts = { indexed: 0, problem: 0, waiting: 0, unchecked: 0 };
  for (const r of rows) counts[status(r.i)]++;
  const list = rows.filter((r) => show === "all" || status(r.i) === show || (show === "problem" && status(r.i) === "waiting"));

  return (
    <div className="ix">
      <div className="an-kpis">
        <div className="an-kpi">
          <span className="an-kpi-label">Pages in the sitemap</span>
          <b className="an-kpi-value">{rows.length}</b>
        </div>
        <div className="an-kpi">
          <span className="an-kpi-label">In Google</span>
          <b className="an-kpi-value an-good">{counts.indexed}</b>
        </div>
        <div className="an-kpi">
          <span className="an-kpi-label">Not in Google yet</span>
          <b className="an-kpi-value an-bad">{counts.problem + counts.waiting}</b>
        </div>
        <div className="an-kpi">
          <span className="an-kpi-label">Not checked</span>
          <b className="an-kpi-value">{counts.unchecked}</b>
        </div>
      </div>

      <div className="ix-bar">
        <button className="ad-btn ad-btn-primary" disabled={!connected || Boolean(busy) || stale.length === 0} onClick={() => run(stale)}>
          {busy ? `Checking… ${done} of ${busy.length}` : stale.length ? `Check ${stale.length} page${stale.length === 1 ? "" : "s"} with Google` : "All pages checked today"}
        </button>
        {busy && (
          <span className="ix-progress" aria-hidden="true">
            <span style={{ width: `${(done / busy.length) * 100}%` }} />
          </span>
        )}
        <div className="qf-chips" role="group" aria-label="Show">
          {(
            [
              ["all", "All"],
              ["problem", "Not in Google"],
              ["indexed", "In Google"],
              ["unchecked", "Not checked"],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className={show === id ? "is-on" : ""}>
              <input type="radio" name="ix-show" checked={show === id} onChange={() => setShow(id)} />
              {label}
            </label>
          ))}
        </div>
      </div>
      {error && <p className="ad-error">{error}</p>}

      <table className="rt an-table">
        <thead>
          <tr>
            <th>Page</th>
            <th>Google says</th>
            <th>Last crawled</th>
            <th>Details</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {list.map(({ url, i }) => {
            const s = status(i);
            const bare = (u: string) => u.replace(/\/+$/, "").toLowerCase();
            const canonicalMismatch = i && i.googleCanonical && i.userCanonical && bare(i.googleCanonical) !== bare(i.userCanonical);
            return (
              <tr key={url}>
                <td data-label="Page">
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <b>{short(url)}</b>
                  </a>
                </td>
                <td data-label="Google says">
                  <span className={`ix-status is-${s}`}>{LABEL[s]}</span>
                  {i && <small>{i.coverage}</small>}
                </td>
                <td data-label="Last crawled">
                  {i ? when(i.lastCrawl) : "—"}
                  {i?.crawledAs && <small>{i.crawledAs === "MOBILE" ? "as a phone" : "as a computer"}</small>}
                </td>
                <td data-label="Details">
                  {!i ? (
                    "—"
                  ) : (
                    <>
                      {canonicalMismatch && <small className="ad-error">Google chose a different main URL: {short(i.googleCanonical)}</small>}
                      {i.robots && i.robots !== "ALLOWED" && <small className="ad-error">robots.txt: {i.robots.toLowerCase()}</small>}
                      {i.fetch && i.fetch !== "SUCCESSFUL" && <small className="ad-error">fetch: {i.fetch.replace(/_/g, " ").toLowerCase()}</small>}
                      {i.richItems.length > 0 && <small>Rich results: {[...new Set(i.richItems)].join(", ")}</small>}
                      <small>checked {new Date(i.checkedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small>
                    </>
                  )}
                </td>
                <td data-label="">
                  <button className="ad-btn ad-btn-sm" disabled={!connected || Boolean(busy)} onClick={() => run([url])}>
                    Check
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
