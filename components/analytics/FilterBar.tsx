import Link from "next/link";
import { A_RANGES, filterQuery, type AFilter } from "@/lib/analytics/report";

/* date range + filters for our own analytics; a plain GET form, so links can be shared */
export default function FilterBar({
  f,
  base,
  options,
  exports,
}: {
  f: AFilter;
  base: string;
  options: { sources: string[]; devices: string[]; countries: string[] };
  exports?: { id: string; label: string }[];
}) {
  const active = [f.page && `Page: ${f.page}`, f.source && `Source: ${f.source}`, f.device && `Device: ${f.device}`, f.country && `Country: ${f.country}`].filter(Boolean);
  const q = filterQuery(f);
  return (
    <div className="an-filter">
      <nav className="ad-range" aria-label="Date range">
        {A_RANGES.map((r) => (
          <Link
            key={r.id}
            href={`${base}?${filterQuery(f, { range: r.id, from: undefined, to: undefined })}`}
            className={f.range === r.id ? "is-active" : ""}
            aria-current={f.range === r.id ? "true" : undefined}
          >
            {r.label}
          </Link>
        ))}
      </nav>
      <details className="an-filter-more" open={f.range === "custom" || active.length > 0}>
        <summary>{f.range === "custom" ? `Custom: ${f.label}` : "Custom dates & filters"}</summary>
        <form className="an-filter-form" action={base}>
          <label>
            <span>From</span>
            <input type="date" name="from" defaultValue={f.range === "custom" ? f.fromDay : ""} />
          </label>
          <label>
            <span>To</span>
            <input type="date" name="to" defaultValue={f.range === "custom" ? f.toDay : ""} />
          </label>
          {f.range !== "custom" && <input type="hidden" name="range" value={f.range} />}
          <label>
            <span>Page</span>
            <input name="page" defaultValue={f.page ?? ""} placeholder="/careers" />
          </label>
          <label>
            <span>Source</span>
            <select name="source" defaultValue={f.source ?? ""}>
              <option value="">Any</option>
              {options.sources.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Device</span>
            <select name="device" defaultValue={f.device ?? ""}>
              <option value="">Any</option>
              {options.devices.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Country</span>
            <select name="country" defaultValue={f.country ?? ""}>
              <option value="">Any</option>
              {options.countries.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button className="ad-btn ad-btn-sm ad-btn-primary">Apply</button>
          <Link className="ad-link" href={base}>
            Clear
          </Link>
        </form>
      </details>
      {active.length > 0 && (
        <p className="an-active">
          Showing only {active.join(" · ")} ·{" "}
          <Link className="ad-link" href={`${base}?${filterQuery({ ...f, page: undefined, source: undefined, device: undefined, country: undefined })}`}>
            remove filters
          </Link>
        </p>
      )}
      {exports && exports.length > 0 && (
        <p className="an-export">
          Download CSV:{" "}
          {exports.map((e, i) => (
            <span key={e.id}>
              {i > 0 && " · "}
              <a className="ad-link" href={`/api/referral/admin/analytics/export?report=${e.id}&${q}`}>
                {e.label}
              </a>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
