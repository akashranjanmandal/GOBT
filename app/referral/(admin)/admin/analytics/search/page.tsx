import type { Metadata } from "next";
import { requireAdmin } from "@/lib/referral/auth";
import { searchReport } from "@/lib/analytics/gsc";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, ago } from "@/components/referral/ui";
import { Delta, Kpi, RangeLinks, Tabs, Trend, fmtNum, fmtPct } from "@/components/analytics/parts";

export const metadata: Metadata = { title: "Google Search" };
export const dynamic = "force-dynamic";

const RANGES = [
  { id: "7", label: "7 days" },
  { id: "28", label: "28 days" },
  { id: "90", label: "3 months" },
  { id: "180", label: "6 months" },
] as const;

const COUNTRY: Record<string, string> = { ind: "India", usa: "United States", gbr: "United Kingdom", are: "UAE", bgd: "Bangladesh", can: "Canada", aus: "Australia", sgp: "Singapore", npl: "Nepal", deu: "Germany" };
const DEVICE: Record<string, string> = { MOBILE: "Mobile", DESKTOP: "Desktop", TABLET: "Tablet" };

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
          Open <b>console.cloud.google.com</b>, create a project (e.g. “GOBT website”), then go to <b>APIs &amp; Services → Library</b> and enable
          <b> Google Search Console API</b>.
        </li>
        <li>
          Go to <b>IAM &amp; Admin → Service accounts → Create service account</b> (any name, no roles needed). Open it → <b>Keys → Add key → JSON</b>. A
          .json file downloads.
        </li>
        <li>
          In <b>search.google.com/search-console</b> for gobt.in: <b>Settings → Users and permissions → Add user</b>, paste the service account&apos;s email
          {email ? (
            <>
              {" "}
              (<code>{email}</code>)
            </>
          ) : (
            " (it ends in .iam.gserviceaccount.com)"
          )}{" "}
          and choose <b>Restricted</b>.
        </li>
        <li>
          In Netlify → <b>Site configuration → Environment variables</b>, add <code>GSC_CREDENTIALS</code> with the contents of the .json file. If your
          property is a URL-prefix property instead of a Domain property, also add <code>GSC_SITE</code> = <code>https://gobt.in/</code> (the default is{" "}
          <code>sc-domain:gobt.in</code>).
        </li>
        <li>Redeploy the site. This page then shows your Google search data.</li>
      </ol>
    </Card>
  );
}

export default async function Search({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin();
  const raw = (await searchParams).range;
  const range = RANGES.some((r) => r.id === raw) ? raw! : "28";
  const res = await searchReport(Number(range));

  return (
    <>
      <PageHead title="Google Search" help="How gobt.in shows up in Google: the searches people typed, how often we appeared, how often they clicked, and our average position. Google's data runs about two days behind.">
        {res.ok && <RangeLinks base="/referral/admin/analytics/search" current={range} ranges={RANGES} />}
      </PageHead>
      <Tabs current="search" />

      {!res.ok ? (
        <Setup reason={res.reason} message={res.message} email={res.email} />
      ) : (
        <>
          <p className="an-muted an-compare">
            {res.data.site} · {res.data.start.split("-").reverse().join("-")} to {res.data.end.split("-").reverse().join("-")} · updated {ago(res.cachedAt)}
          </p>
          <div className="an-kpis">
            <Kpi label="Clicks" value={fmtNum(res.data.totals.clicks)} delta={<Delta now={res.data.totals.clicks} before={res.data.previous.clicks} />} hint="Times someone clicked through to gobt.in from Google" />
            <Kpi label="Impressions" value={fmtNum(res.data.totals.impressions)} delta={<Delta now={res.data.totals.impressions} before={res.data.previous.impressions} />} hint="Times gobt.in appeared in Google results" />
            <Kpi label="Click rate (CTR)" value={fmtPct(res.data.totals.ctr)} delta={<Delta now={res.data.totals.ctr} before={res.data.previous.ctr} />} />
            <Kpi
              label="Avg. position"
              value={res.data.totals.position ? res.data.totals.position.toFixed(1) : "—"}
              delta={<Delta now={res.data.totals.position} before={res.data.previous.position} lowerIsBetter />}
              hint="1 is the top of the first page; lower is better"
            />
          </div>

          <Card title="Day by day">
            <Trend data={res.data.series.map((s) => ({ label: s.date.slice(8) + "/" + s.date.slice(5, 7), a: s.clicks, b: s.impressions }))} a="Clicks" b="Impressions" />
          </Card>

          <Card title="What people searched" help="Top searches where gobt.in appeared. Position: our average rank for that search.">
            {res.data.queries.length === 0 ? (
              <Empty>No search data for this period yet.</Empty>
            ) : (
              <table className="rt an-table">
                <thead>
                  <tr>
                    <th>Search</th>
                    <th>Clicks</th>
                    <th>Impressions</th>
                    <th>CTR</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {res.data.queries.map((q) => (
                    <tr key={q.key}>
                      <td data-label="Search">
                        <b>{q.key}</b>
                      </td>
                      <td data-label="Clicks">{fmtNum(q.clicks)}</td>
                      <td data-label="Impressions">{fmtNum(q.impressions)}</td>
                      <td data-label="CTR">{fmtPct(q.ctr)}</td>
                      <td data-label="Position">{q.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Pages in Google">
            {res.data.pages.length === 0 ? (
              <Empty>No pages yet.</Empty>
            ) : (
              <table className="rt an-table">
                <thead>
                  <tr>
                    <th>Page</th>
                    <th>Clicks</th>
                    <th>Impressions</th>
                    <th>CTR</th>
                    <th>Position</th>
                  </tr>
                </thead>
                <tbody>
                  {res.data.pages.map((p) => (
                    <tr key={p.key}>
                      <td data-label="Page">
                        <a href={p.key} target="_blank" rel="noopener noreferrer">
                          {p.key.replace(/^https?:\/\/(www\.)?gobt\.in/, "") || "/"}
                        </a>
                      </td>
                      <td data-label="Clicks">{fmtNum(p.clicks)}</td>
                      <td data-label="Impressions">{fmtNum(p.impressions)}</td>
                      <td data-label="CTR">{fmtPct(p.ctr)}</td>
                      <td data-label="Position">{p.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <div className="ad-grid2">
            <Card title="Countries">
              <table className="rt an-table">
                <tbody>
                  {res.data.countries.map((c) => (
                    <tr key={c.key}>
                      <td data-label="Country">{COUNTRY[c.key] ?? c.key.toUpperCase()}</td>
                      <td data-label="Clicks">{fmtNum(c.clicks)} clicks</td>
                      <td data-label="Impressions">{fmtNum(c.impressions)} impr.</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Devices">
              <table className="rt an-table">
                <tbody>
                  {res.data.devices.map((c) => (
                    <tr key={c.key}>
                      <td data-label="Device">{DEVICE[c.key] ?? c.key}</td>
                      <td data-label="Clicks">{fmtNum(c.clicks)} clicks</td>
                      <td data-label="Position">pos. {c.position.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card title="Sitemaps" help="Whether Google can read gobt.in/sitemap.xml.">
              {res.data.sitemaps.length === 0 ? (
                <Empty>No sitemap submitted. In Search Console → Sitemaps, submit sitemap.xml.</Empty>
              ) : (
                <table className="rt an-table">
                  <tbody>
                    {res.data.sitemaps.map((s) => (
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
      )}
    </>
  );
}
