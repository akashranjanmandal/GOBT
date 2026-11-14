import Link from "next/link";
import type { ReactNode } from "react";

/* small pieces shared by the analytics pages */

export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-IN");
export const fmtPct = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export function fmtDuration(ms: number) {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return m < 60 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${Math.floor(m / 60)}h ${m % 60}m`;
}

/* "+12% vs previous period"; lowerIsBetter flips the colour (bounce rate, position) */
export function Delta({ now, before, lowerIsBetter = false }: { now: number; before: number; lowerIsBetter?: boolean }) {
  if (!before && !now) return <span className="an-delta">—</span>;
  if (!before) return <span className="an-delta is-up">new</span>;
  const change = (now - before) / before;
  const good = lowerIsBetter ? change < 0 : change > 0;
  if (Math.abs(change) < 0.005) return <span className="an-delta">no change</span>;
  return (
    <span className={`an-delta ${good ? "is-up" : "is-down"}`}>
      {change > 0 ? "▲" : "▼"} {Math.abs(change * 100).toFixed(0)}%
    </span>
  );
}

export function Kpi({ label, value, delta, hint }: { label: string; value: ReactNode; delta?: ReactNode; hint?: string }) {
  return (
    <div className="an-kpi" title={hint}>
      <span className="an-kpi-label">{label}</span>
      <b className="an-kpi-value">{value}</b>
      {delta}
    </div>
  );
}

/* bars for one series with a lighter bar behind for a second one */
export function Trend({ data, a, b }: { data: { label: string; a: number; b: number }[]; a: string; b: string }) {
  const max = Math.max(1, ...data.map((d) => Math.max(d.a, d.b)));
  const every = Math.max(1, Math.ceil(data.length / 10));
  return (
    <figure className="an-trend">
      <figcaption>
        <span className="an-key an-key-b" /> {b} <span className="an-key an-key-a" /> {a}
      </figcaption>
      <div className="an-trend-bars" role="img" aria-label={`${a} and ${b} over time`}>
        {data.map((d, i) => (
          <span key={i} className="an-trend-col" title={`${d.label}: ${fmtNum(d.a)} ${a.toLowerCase()}, ${fmtNum(d.b)} ${b.toLowerCase()}`}>
            <span className="an-trend-b" style={{ height: d.b ? `${Math.max(2, (d.b / max) * 100)}%` : 0 }} />
            <span className="an-trend-a" style={{ height: d.a ? `${Math.max(2, (d.a / max) * 100)}%` : 0 }} />
          </span>
        ))}
      </div>
      <div className="an-trend-axis" aria-hidden="true">
        {data.map((d, i) => (
          <span key={i}>{i % every === 0 ? d.label : ""}</span>
        ))}
      </div>
    </figure>
  );
}

export function Tabs({ current }: { current: "site" | "search" }) {
  return (
    <nav className="an-tabs" aria-label="Analytics">
      <Link href="/referral/admin/analytics" className={current === "site" ? "is-on" : ""} aria-current={current === "site" ? "page" : undefined}>
        Website traffic
      </Link>
      <Link href="/referral/admin/analytics/search" className={current === "search" ? "is-on" : ""} aria-current={current === "search" ? "page" : undefined}>
        Google Search
      </Link>
    </nav>
  );
}

export function RangeLinks({ base, current, ranges }: { base: string; current: string; ranges: readonly { id: string; label: string }[] }) {
  return (
    <nav className="ad-range" aria-label="Date range">
      {ranges.map((r) => (
        <Link key={r.id} href={`${base}?range=${r.id}`} className={current === r.id ? "is-active" : ""} aria-current={current === r.id ? "true" : undefined}>
          {r.label}
        </Link>
      ))}
    </nav>
  );
}
