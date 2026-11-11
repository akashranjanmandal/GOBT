import Link from "next/link";
import type { ReactNode } from "react";
import { RANGES } from "@/lib/referral/stats";

/* Admin-only building blocks */

export function PageHead({ title, help, children }: { title: string; help?: ReactNode; children?: ReactNode }) {
  return (
    <header className="ad-head">
      <div>
        <h1>{title}</h1>
        {help && <p>{help}</p>}
      </div>
      {children}
    </header>
  );
}

/* "Last 7 days · Last 30 days · …" as plain links */
export function RangeTabs({ base, current, params = {} }: { base: string; current: number; params?: Record<string, string | undefined> }) {
  const qs = (days: number) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) p.set(k, v);
    p.set("range", String(days));
    return `${base}?${p.toString()}`;
  };
  return (
    <nav className="ad-range" aria-label="Date range">
      {RANGES.map((r) => (
        <Link key={r.days} href={qs(r.days)} className={current === r.days ? "is-active" : ""} aria-current={current === r.days ? "true" : undefined}>
          {r.label}
        </Link>
      ))}
    </nav>
  );
}

export const rangeLabel = (days: number) => RANGES.find((r) => r.days === days)?.label.toLowerCase() ?? "";

export function StatusChip({ status, label }: { status: string; label: string }) {
  return <span className={`ad-chip ad-chip-${status}`}>{label}</span>;
}
