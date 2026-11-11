import type { ReactNode } from "react";

/* Small server-rendered pieces shared by the referrer dashboard and the
   admin panel: formatting, stat cards, charts. No client JavaScript. */

const IST = "Asia/Kolkata";

export const fmtDate = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: IST });
export const fmtShort = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: IST });
export const fmtTime = (t: number) =>
  new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true, timeZone: IST });

export function ago(t: number | null | undefined) {
  if (!t) return "never";
  const s = Math.max(0, (Date.now() - t) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} d ago`;
  return fmtDate(t);
}

export const pct = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%");
export const plural = (n: number, one: string, many = `${one}s`) => `${n.toLocaleString("en-IN")} ${n === 1 ? one : many}`;

/* ── a number with a plain-English label and a one-line explanation ── */
export function Stat({
  label,
  value,
  hint,
  tone = "gold",
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "gold" | "mint" | "pink" | "lilac" | "plain";
  href?: string;
}) {
  const body = (
    <>
      <span className="st-label">{label}</span>
      <b className="st-value">{value}</b>
      {hint && <span className="st-hint">{hint}</span>}
    </>
  );
  return href ? (
    <a className={`st st-${tone}`} href={href}>
      {body}
    </a>
  ) : (
    <div className={`st st-${tone}`}>{body}</div>
  );
}

/* ── bars per day ── */
export function BarChart({
  data,
  label,
  tone = "gold",
}: {
  data: { date: string; value: number }[];
  label: string;
  tone?: "gold" | "mint" | "pink" | "lilac";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  const mid = data[Math.floor(data.length / 2)];
  const short = (d?: string) => (d ? new Date(`${d}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: IST }) : "");
  return (
    <figure className={`ch ch-${tone}`}>
      <figcaption>
        <span>{label}</span>
        <b>{total.toLocaleString("en-IN")}</b>
      </figcaption>
      {total === 0 ? (
        <p className="ch-empty">Nothing yet in this period.</p>
      ) : (
        <>
          <div className="ch-bars" role="img" aria-label={`${label}: ${total} in total over ${data.length} days`}>
            {data.map((d) => (
              <span key={d.date} className="ch-col" title={`${short(d.date)}: ${d.value}`}>
                <span className="ch-bar" style={{ height: d.value ? `${Math.max(6, (d.value / max) * 100)}%` : "2px" }} />
              </span>
            ))}
          </div>
          <div className="ch-axis" aria-hidden="true">
            <span>{short(data[0]?.date)}</span>
            <span>{short(mid?.date)}</span>
            <span>{short(data[data.length - 1]?.date)}</span>
          </div>
        </>
      )}
    </figure>
  );
}

/* ── how many make it from one step to the next ── */
export function Funnel({ steps }: { steps: { label: string; value: number; hint?: string }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1, ...steps.map((s) => s.value));
  return (
    <ol className="fn">
      {steps.map((s, i) => (
        <li key={s.label}>
          <div className="fn-head">
            <span>{s.label}</span>
            <b>{s.value.toLocaleString("en-IN")}</b>
          </div>
          <span className="fn-track" aria-hidden="true">
            <span style={{ width: `${Math.max(s.value ? 3 : 0, (s.value / top) * 100)}%` }} />
          </span>
          <span className="fn-note">
            {s.hint}
            {i > 0 && steps[i - 1].value > 0 && <em> · {pct(s.value, steps[i - 1].value)} of the step before</em>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ── a bar for each row of a short list (devices, countries…) ── */
export function Split({ rows, empty = "No data yet." }: { rows: { key: string; value: number }[]; empty?: string }) {
  const total = rows.reduce((a, r) => a + r.value, 0);
  if (!total) return <p className="ch-empty">{empty}</p>;
  return (
    <ul className="sp">
      {rows.map((r) => (
        <li key={r.key}>
          <span className="sp-name">{r.key}</span>
          <span className="sp-track" aria-hidden="true">
            <span style={{ width: `${(r.value / total) * 100}%` }} />
          </span>
          <b>
            {r.value.toLocaleString("en-IN")} <small>{pct(r.value, total)}</small>
          </b>
        </li>
      ))}
    </ul>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rf-empty">{children}</p>;
}

/* a card with a heading and (optionally) a plain-language explanation */
export function Card({
  title,
  help,
  id,
  action,
  children,
  className = "",
}: {
  title: string;
  help?: ReactNode;
  id?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`cd ${className}`} id={id}>
      <header className="cd-head">
        <div>
          <h2 className="cd-title">{title}</h2>
          {help && <p className="cd-help">{help}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
