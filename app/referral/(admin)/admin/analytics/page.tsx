import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { acquisition, anyViews, breakdown, filterOptions, filterQuery, journeys, pageFlow, parseFilter, realtime, totals, trend } from "@/lib/analytics/report";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, Split } from "@/components/referral/ui";
import RealtimeCard from "@/components/analytics/RealtimeCard";
import FilterBar from "@/components/analytics/FilterBar";
import WeeklyReportButton from "@/components/analytics/WeeklyReportButton";
import { Delta, Kpi, Tabs, Trend, fmtDuration, fmtNum, fmtPct } from "@/components/analytics/parts";

export const metadata: Metadata = { title: "Website analytics" };
export const dynamic = "force-dynamic";

export default async function Analytics({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const f = parseFilter(await searchParams);
  const base = "/referral/admin/analytics";
  const q = filterQuery(f);
  const [cur, prev, series, acq, countries, regions, cities, devices, browsers, os, langs, screens, routes, flow, rt, ever, options] = await Promise.all([
    totals(f),
    totals(f, true),
    trend(f),
    acquisition(f),
    breakdown("country", f),
    breakdown("region", f),
    breakdown("city", f),
    breakdown("device", f),
    breakdown("browser", f),
    breakdown("os", f),
    breakdown("lang", f),
    breakdown("screen", f),
    journeys(f),
    pageFlow(f),
    realtime(),
    anyViews(),
    filterOptions(f),
  ]);
  const prevLabel = f.range === "today" ? "vs yesterday until this time" : `vs the ${f.days} day${f.days === 1 ? "" : "s"} before`;
  const returning = Math.max(0, cur.visitors - cur.newVisitors);
  const filtered = (k: "source" | "page" | "device" | "country", v: string) => `${base}?${filterQuery(f, { [k]: v })}`;

  return (
    <>
      <PageHead
        title="Website analytics"
        help="GOBT's own analytics for gobt.in: who visits, from where, what they read and what they click. Visits by logged-in admins and bots aren't counted. No IP addresses are stored."
      >
        <WeeklyReportButton />
      </PageHead>
      <Tabs current="site" query={q} />
      <FilterBar
        f={f}
        base={base}
        options={options}
        exports={[
          { id: "views", label: "All page views" },
          { id: "sources", label: "Sources" },
          { id: "pages", label: "Pages" },
        ]}
      />

      {f.range === "today" && <RealtimeCard initial={rt} />}

      {ever === 0 && <p className="an-note">No visits recorded yet. Tracking starts as soon as this version is live on gobt.in; numbers appear here within seconds of the first visit.</p>}

      <div className="an-kpis">
        <Kpi label="Visitors" value={fmtNum(cur.visitors)} delta={<Delta now={cur.visitors} before={prev.visitors} />} hint="Different people (browsers)" />
        <Kpi label="New visitors" value={fmtNum(cur.newVisitors)} delta={<Delta now={cur.newVisitors} before={prev.newVisitors} />} hint="First visit ever from this browser" />
        <Kpi label="Sessions" value={fmtNum(cur.sessions)} delta={<Delta now={cur.sessions} before={prev.sessions} />} hint="A visit; ends after 30 minutes without activity" />
        <Kpi label="Page views" value={fmtNum(cur.views)} delta={<Delta now={cur.views} before={prev.views} />} />
        <Kpi label="Pages / session" value={cur.viewsPerSession.toFixed(2)} delta={<Delta now={cur.viewsPerSession} before={prev.viewsPerSession} />} />
        <Kpi label="Avg. engagement" value={fmtDuration(cur.avgEngagementMs)} delta={<Delta now={cur.avgEngagementMs} before={prev.avgEngagementMs} />} hint="Time the page was actually on screen, per session" />
        <Kpi label="Bounce rate" value={fmtPct(cur.bounceRate, 0)} delta={<Delta now={cur.bounceRate} before={prev.bounceRate} lowerIsBetter />} hint="Sessions with one page and under 10 seconds" />
        <Kpi label="Lead actions" value={fmtNum(cur.leads)} delta={<Delta now={cur.leads} before={prev.leads} />} hint="WhatsApp, call and email clicks and forms sent" />
        <Kpi label="Conversion rate" value={fmtPct(cur.conversionRate)} delta={<Delta now={cur.conversionRate} before={prev.conversionRate} />} hint="Sessions with at least one lead action" />
      </div>
      <p className="an-muted an-compare">
        {f.label} · changes are {prevLabel}. <Link className="ad-link" href={`/referral/admin/analytics/leads?${q}`}>See where leads come from →</Link>
      </p>

      <Card title={f.days <= 1 ? "Hour by hour" : f.days > 92 ? "Month by month" : "Day by day"}>
        <Trend data={series.map((s) => ({ label: s.label, a: s.visitors, b: s.views }))} a="Visitors" b="Page views" />
      </Card>

      {flow && (
        <div className="ad-grid2">
          <Card title={`Before ${f.page}`} help="The page people were on just before.">
            <Split rows={flow.before} />
          </Card>
          <Card title={`After ${f.page}`} help="Where people went next.">
            <Split rows={flow.after} />
          </Card>
        </div>
      )}

      <div className="ad-grid2">
        <Card title="How people find the site" help="Sessions by channel. Organic search is Google, Bing and other search engines.">
          <Split rows={acq.channels} empty="No visits in this period." />
        </Card>
        <Card title="Common journeys" help="The first pages of each visit, most common first.">
          {routes.length === 0 ? (
            <Empty>No visits in this period.</Empty>
          ) : (
            <ol className="an-mini an-routes">
              {routes.map((r) => (
                <li key={r.path}>
                  <span>{r.path}</span>
                  <b>{fmtNum(r.sessions)}</b>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <Card title="Sources" help="Where each visit came from (the first page of the session). Click one to see only that source. Add ?utm_source=…&utm_campaign=… to links you share to see them here.">
        {acq.sources.length === 0 ? (
          <Empty>No visits in this period.</Empty>
        ) : (
          <table className="rt an-table">
            <thead>
              <tr>
                <th>Source</th>
                <th>Medium</th>
                <th>Sessions</th>
                <th>Visitors</th>
              </tr>
            </thead>
            <tbody>
              {acq.sources.map((s) => (
                <tr key={`${s.source}|${s.medium}`}>
                  <td data-label="Source">
                    <Link href={filtered("source", s.source)}>
                      <b>{s.source}</b>
                    </Link>
                  </td>
                  <td data-label="Medium">{s.medium}</td>
                  <td data-label="Sessions">{fmtNum(s.sessions)}</td>
                  <td data-label="Visitors">{fmtNum(s.visitors)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {acq.campaigns.length > 0 && (
          <>
            <h3 className="an-sub">Campaigns</h3>
            <table className="rt an-table">
              <thead>
                <tr>
                  <th>Campaign</th>
                  <th>Source</th>
                  <th>Sessions</th>
                </tr>
              </thead>
              <tbody>
                {acq.campaigns.map((c) => (
                  <tr key={`${c.campaign}|${c.source}`}>
                    <td data-label="Campaign">
                      <b>{c.campaign}</b>
                    </td>
                    <td data-label="Source">{c.source}</td>
                    <td data-label="Sessions">{fmtNum(c.sessions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {acq.terms.length > 0 && (
          <>
            <h3 className="an-sub">Campaign keywords (utm_term)</h3>
            <Split rows={acq.terms} />
          </>
        )}
      </Card>

      <div className="ad-grid2">
        <Card title="Countries">
          <Split rows={countries} />
        </Card>
        <Card title="States / regions">
          <Split rows={regions} />
        </Card>
        <Card title="Cities">
          <Split rows={cities} />
        </Card>
        <Card title="Devices" help={`${fmtNum(cur.newVisitors)} new and ${fmtNum(returning)} returning visitors.`}>
          <Split rows={devices} />
        </Card>
        <Card title="Screen sizes">
          <Split rows={screens} />
        </Card>
        <Card title="Browsers">
          <Split rows={browsers} />
        </Card>
        <Card title="Operating systems">
          <Split rows={os} />
        </Card>
        <Card title="Languages" help="The visitor's browser language.">
          <Split rows={langs} />
        </Card>
      </div>
    </>
  );
}
