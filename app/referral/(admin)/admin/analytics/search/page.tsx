import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { GSC_RANGES, SEARCH_TYPES, expectedCtr, searchReport, type Metric } from "@/lib/analytics/gsc";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, ago } from "@/components/referral/ui";
import { Delta, Kpi, Tabs, Trend, fmtNum, fmtPct } from "@/components/analytics/parts";

export const metadata: Metadata = { title: "Google Search" };
export const dynamic = "force-dynamic";

const COUNTRY: Record<string, string> = {
  ind: "India", usa: "United States", gbr: "United Kingdom", are: "UAE", bgd: "Bangladesh", can: "Canada", aus: "Australia", sgp: "Singapore", npl: "Nepal",
  deu: "Germany", eth: "Ethiopia", pak: "Pakistan", lka: "Sri Lanka", sau: "Saudi Arabia", qat: "Qatar", fra: "France", nld: "Netherlands", irl: "Ireland",
};
const DEVICE: Record<string, string> = { MOBILE: "Mobile", DESKTOP: "Desktop", TABLET: "Tablet" };
const APPEARANCE: Record<string, string> = {
  TRANSLATED_RESULT: "Translated result", FAQ_RICH_RESULT: "FAQ rich result", REVIEW_SNIPPET: "Review stars", VIDEO: "Video", AMP_BLUE_LINK: "AMP",
  BREADCRUMB: "Breadcrumbs", RECIPE_FEATURE: "Recipe", JOB_LISTING: "Job listing", JOB_DETAILS: "Job details", PRODUCT_SNIPPETS: "Product snippet", MERCHANT_LISTINGS: "Merchant listing",
};
const short = (u: string) => u.replace(/^https?:\/\/(www\.)?gobt\.in/, "") || "/";

function Setup({ reason, message, email }: { reason: string; message?: string; email?: string }) {
  return (
    <Card title={reason === "error" ? "Couldn't read Search Console" : "Connect Google Search Console"}>
      {reason === "error" ? (
        <p className="ad-error">{message}</p>
      ) : reason === "invalid" ? (
        <p className="ad-error">GSC_CREDENTIALS is set but isn&apos;t a valid service-account JSON key. Paste the whole downloaded .json file (or its base64).</p>
      ) : (
        <p>Google only shares search data (what people searched, impressions, position) through its Search Console API. Connect it once:</p>
      )}
      <ol className="an-steps">
        <li>
          Open <b>console.cloud.google.com</b>, create a project, then <b>APIs &amp; Services → Library</b> → enable <b>Google Search Console API</b>.
        </li>
        <li>
          <b>IAM &amp; Admin → Service accounts → Create service account</b>. Open it → <b>Keys → Add key → JSON</b>.
        </li>
        <li>
          In Search Console for gobt.in: <b>Settings → Users and permissions → Add user</b>, paste the service account&apos;s email
          {email ? (
            <>
              {" "}
              (<code>{email}</code>)
            </>
          ) : null}{" "}
          and choose <b>Restricted</b>.
        </li>
        <li>
          In Netlify → <b>Site configuration → Environment variables</b>, add <code>GSC_CREDENTIALS</code> with the .json file&apos;s contents (or its base64). For a URL-prefix
          property also add <code>GSC_SITE</code> = <code>https://gobt.in/</code>.
        </li>
        <li>Redeploy the site.</li>
      </ol>
    </Card>
  );
}

type SP = Record<string, string | undefined>;

export default async function Search({ searchParams }: { searchParams: Promise<SP> }) {
  await requireAdmin();
  const sp = await searchParams;
  const base = "/referral/admin/analytics/search";
  const filters = { query: sp.q, queryExact: sp.qx, page: sp.p, pageExact: sp.px, country: sp.country, device: sp.device };
  const res = await searchReport({ range: sp.range, from: sp.from, to: sp.to, type: sp.type, filters, fresh: sp.refresh === "1" });

  /* links that keep the current choices */
  const link = (patch: SP) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, refresh: undefined, ...patch })) if (v) p.set(k, v);
    return `${base}?${p.toString()}`;
  };
  const exportLink = (report: string) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, refresh: undefined, report })) if (v) p.set(k, v);
    return `/api/referral/admin/analytics/export?${p.toString()}`;
  };

  if (!res.ok) {
    return (
      <>
        <PageHead title="Website analytics" help="How gobt.in shows up in Google." />
        <Tabs current="search" />
        <Setup reason={res.reason} message={"message" in res ? res.message : undefined} email={"email" in res ? res.email : undefined} />
      </>
    );
  }
  const d = res.data;
  const drill = sp.qx ? `the search “${sp.qx}”` : sp.px ? `the page ${short(sp.px)}` : null;

  const metricTable = (rows: Metric[], kind: "query" | "page", extra?: (m: Metric) => React.ReactNode, extraHead?: string) =>
    rows.length === 0 ? (
      <Empty>Nothing for this period.</Empty>
    ) : (
      <table className="rt an-table">
        <thead>
          <tr>
            <th>{kind === "query" ? "Search" : "Page"}</th>
            <th>Clicks</th>
            <th>Impressions</th>
            <th>CTR</th>
            <th>Position</th>
            {extraHead && <th>{extraHead}</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => (
            <tr key={m.key}>
              <td data-label={kind === "query" ? "Search" : "Page"}>
                <Link href={link(kind === "query" ? { qx: m.key, px: undefined } : { px: m.key, qx: undefined })}>
                  <b>{kind === "query" ? m.key : short(m.key)}</b>
                </Link>
              </td>
              <td data-label="Clicks">{fmtNum(m.clicks)}</td>
              <td data-label="Impressions">{fmtNum(m.impressions)}</td>
              <td data-label="CTR">{fmtPct(m.ctr)}</td>
              <td data-label="Position">{m.position.toFixed(1)}</td>
              {extra && <td data-label={extraHead}>{extra(m)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    );

  return (
    <>
      <PageHead
        title="Website analytics"
        help="How gobt.in shows up in Google: what people searched, how often we appeared and were clicked, and our position. Google's data runs about two days behind."
      />
      <Tabs current="search" />

      <div className="an-filter">
        <nav className="ad-range" aria-label="Search type">
          {SEARCH_TYPES.map((t) => (
            <Link key={t.id} href={link({ type: t.id === "web" ? undefined : t.id })} className={d.type === t.id ? "is-active" : ""}>
              {t.label}
            </Link>
          ))}
        </nav>
        <nav className="ad-range" aria-label="Date range">
          {GSC_RANGES.map((r) => (
            <Link key={r.id} href={link({ range: r.id, from: undefined, to: undefined })} className={d.period.range === r.id ? "is-active" : ""}>
              {r.label}
            </Link>
          ))}
        </nav>
        <details className="an-filter-more" open={Boolean(sp.from || sp.q || sp.p || sp.country || sp.device)}>
          <summary>{d.period.range === "custom" ? `Custom: ${d.period.start} to ${d.period.end}` : "Custom dates & filters"}</summary>
          <form className="an-filter-form" action={base}>
            {sp.type && <input type="hidden" name="type" value={sp.type} />}
            <label>
              <span>From</span>
              <input type="date" name="from" defaultValue={sp.from ?? ""} />
            </label>
            <label>
              <span>To</span>
              <input type="date" name="to" defaultValue={sp.to ?? ""} />
            </label>
            <label>
              <span>Search contains</span>
              <input name="q" defaultValue={sp.q ?? ""} placeholder="e.g. robotics" />
            </label>
            <label>
              <span>Page contains</span>
              <input name="p" defaultValue={sp.p ?? ""} placeholder="e.g. /services" />
            </label>
            <label>
              <span>Country</span>
              <select name="country" defaultValue={sp.country ?? ""}>
                <option value="">Any</option>
                {d.countries.map((c) => (
                  <option key={c.key} value={c.key}>
                    {COUNTRY[c.key] ?? c.key.toUpperCase()}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Device</span>
              <select name="device" defaultValue={sp.device ?? ""}>
                <option value="">Any</option>
                <option value="MOBILE">Mobile</option>
                <option value="DESKTOP">Desktop</option>
                <option value="TABLET">Tablet</option>
              </select>
            </label>
            {!sp.from && <input type="hidden" name="range" value={d.period.range} />}
            <button className="ad-btn ad-btn-sm ad-btn-primary">Apply</button>
            <Link className="ad-link" href={base}>
              Clear
            </Link>
          </form>
        </details>
        {drill && (
          <p className="an-active">
            Showing only {drill} ·{" "}
            <Link className="ad-link" href={link({ qx: undefined, px: undefined })}>
              show everything
            </Link>
          </p>
        )}
        <p className="an-export">
          {d.site} · {d.period.start.split("-").reverse().join("-")} to {d.period.end.split("-").reverse().join("-")} · updated {ago(res.cachedAt)} ·{" "}
          <Link className="ad-link" href={link({ refresh: "1" })}>
            refresh
          </Link>{" "}
          · Download CSV:{" "}
          <a className="ad-link" href={exportLink("gsc-queries")}>
            searches
          </a>{" "}
          ·{" "}
          <a className="ad-link" href={exportLink("gsc-pages")}>
            pages
          </a>{" "}
          ·{" "}
          <a className="ad-link" href={exportLink("gsc-opportunities")}>
            opportunities
          </a>
        </p>
      </div>

      <div className="an-kpis">
        <Kpi label="Clicks" value={fmtNum(d.totals.clicks)} delta={<Delta now={d.totals.clicks} before={d.previous.clicks} />} hint="Times someone clicked through to gobt.in from Google" />
        <Kpi label="Impressions" value={fmtNum(d.totals.impressions)} delta={<Delta now={d.totals.impressions} before={d.previous.impressions} />} hint="Times gobt.in appeared in Google results" />
        <Kpi label="Click rate (CTR)" value={fmtPct(d.totals.ctr)} delta={<Delta now={d.totals.ctr} before={d.previous.ctr} />} />
        <Kpi
          label="Avg. position"
          value={d.totals.position ? d.totals.position.toFixed(1) : "—"}
          delta={<Delta now={d.totals.position} before={d.previous.position} lowerIsBetter />}
          hint="1 is the top of the first page; lower is better"
        />
      </div>
      <p className="an-muted an-compare">Changes are vs the {d.period.days} days before.</p>

      <Card title="Day by day">
        <Trend data={d.series.map((s) => ({ label: `${s.date.slice(8)}/${s.date.slice(5, 7)}`, a: s.clicks, b: s.impressions }))} a="Clicks" b="Impressions" />
      </Card>

      {!drill && (
        <div className="ad-grid2">
          <Card title="Close to page 1" help="Searches where we're at position 8–20. A better page or a few links could move them onto page 1.">
            {d.opportunities.striking.length === 0 ? (
              <Empty>None right now.</Empty>
            ) : (
              <table className="rt an-table">
                <thead>
                  <tr>
                    <th>Search</th>
                    <th>Position</th>
                    <th>Impressions</th>
                    <th>Our page</th>
                  </tr>
                </thead>
                <tbody>
                  {d.opportunities.striking.map((o) => (
                    <tr key={o.key}>
                      <td data-label="Search">
                        <Link href={link({ qx: o.key })}>
                          <b>{o.key}</b>
                        </Link>
                      </td>
                      <td data-label="Position">{o.position.toFixed(1)}</td>
                      <td data-label="Impressions">{fmtNum(o.impressions)}</td>
                      <td data-label="Our page">{o.page ? short(o.page) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
          <Card title="Shown but not clicked" help="We rank on page 1 but get fewer clicks than usual for that position. A clearer title and description in Google usually fixes it.">
            {d.opportunities.lowCtr.length === 0 ? (
              <Empty>None right now: page-1 searches get normal click rates.</Empty>
            ) : (
              <table className="rt an-table">
                <thead>
                  <tr>
                    <th>Search</th>
                    <th>Position</th>
                    <th>CTR (usual)</th>
                    <th>Missed clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {d.opportunities.lowCtr.map((o) => (
                    <tr key={o.key}>
                      <td data-label="Search">
                        <b>{o.key}</b>
                        {o.page && <small>{short(o.page)}</small>}
                      </td>
                      <td data-label="Position">{o.position.toFixed(1)}</td>
                      <td data-label="CTR (usual)">
                        {fmtPct(o.ctr)} <small>({fmtPct(expectedCtr(o.position), 0)})</small>
                      </td>
                      <td data-label="Missed clicks">~{fmtNum(o.missed)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </div>
      )}

      {!drill && (
        <div className="ad-grid2">
          <Card title="New searches" help="Searches we appeared for this period but not the one before.">
            {metricTable(d.changes.fresh, "query")}
          </Card>
          <Card title="Lost searches" help="Searches we appeared for before, but not in this period.">
            {metricTable(d.changes.lost, "query")}
          </Card>
          <Card title="Moving up">
            {metricTable(d.changes.up, "query", (m) => <span className="an-delta is-up">▲ {(m as Metric & { change: number }).change.toFixed(1)}</span>, "Change")}
          </Card>
          <Card title="Moving down">
            {metricTable(d.changes.down, "query", (m) => <span className="an-delta is-down">▼ {Math.abs((m as Metric & { change: number }).change).toFixed(1)}</span>, "Change")}
          </Card>
        </div>
      )}

      {!sp.qx && (
        <Card title={sp.px ? `Searches that show ${short(sp.px)}` : "What people searched"} help="Click a search to see which of our pages Google shows for it.">
          {metricTable(d.queries, "query")}
        </Card>
      )}
      {!sp.px && (
        <Card title={sp.qx ? `Our pages shown for “${sp.qx}”` : "Pages in Google"} help="Click a page to see the searches that show it.">
          {metricTable(d.pages, "page")}
        </Card>
      )}

      <div className="ad-grid2">
        <Card title="Countries">
          {d.countries.length === 0 ? (
            <Empty>—</Empty>
          ) : (
            <table className="rt an-table">
              <tbody>
                {d.countries.map((c) => (
                  <tr key={c.key}>
                    <td data-label="Country">
                      <Link href={link({ country: c.key })}>{COUNTRY[c.key] ?? c.key.toUpperCase()}</Link>
                    </td>
                    <td data-label="Clicks">{fmtNum(c.clicks)} clicks</td>
                    <td data-label="Impressions">{fmtNum(c.impressions)} impr.</td>
                    <td data-label="Position">pos. {c.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Devices">
          {d.devices.length === 0 ? (
            <Empty>—</Empty>
          ) : (
            <table className="rt an-table">
              <tbody>
                {d.devices.map((c) => (
                  <tr key={c.key}>
                    <td data-label="Device">
                      <Link href={link({ device: c.key })}>{DEVICE[c.key] ?? c.key}</Link>
                    </td>
                    <td data-label="Clicks">{fmtNum(c.clicks)} clicks</td>
                    <td data-label="CTR">{fmtPct(c.ctr)}</td>
                    <td data-label="Position">pos. {c.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="How we appear" help="Special result types Google showed us with (rich results, translations…).">
          {d.appearance.length === 0 ? (
            <Empty>Only standard blue links so far.</Empty>
          ) : (
            <table className="rt an-table">
              <tbody>
                {d.appearance.map((a) => (
                  <tr key={a.key}>
                    <td data-label="Appearance">{APPEARANCE[a.key] ?? a.key.replace(/_/g, " ").toLowerCase()}</td>
                    <td data-label="Clicks">{fmtNum(a.clicks)} clicks</td>
                    <td data-label="Impressions">{fmtNum(a.impressions)} impr.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
        <Card title="Sitemaps" help="Whether Google can read gobt.in/sitemap.xml. See the Google index tab for each page.">
          {d.sitemaps.length === 0 ? (
            <Empty>No sitemap submitted. In Search Console → Sitemaps, submit sitemap.xml.</Empty>
          ) : (
            <table className="rt an-table">
              <tbody>
                {d.sitemaps.map((s) => (
                  <tr key={s.path}>
                    <td data-label="Sitemap">
                      {s.path.replace(/^https?:\/\/(www\.)?/, "")}
                      <small>{s.lastDownloaded ? `read by Google ${ago(Date.parse(s.lastDownloaded))}` : s.pending ? "waiting for Google" : "not read yet"}</small>
                    </td>
                    <td data-label="Pages">{fmtNum(s.submitted)} pages</td>
                    <td data-label="Status">{s.errors ? <span className="ad-error">{s.errors} errors</span> : s.warnings ? `${s.warnings} warnings` : "OK"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </>
  );
}
