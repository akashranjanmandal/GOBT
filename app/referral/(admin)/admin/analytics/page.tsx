import type { Metadata } from "next";
import { requireAdmin } from "@/lib/referral/auth";
import { A_RANGES, acquisition, anyViews, breakdown, events, pages, parseARange, rangeBounds, realtime, totals, trend } from "@/lib/analytics/report";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, Split } from "@/components/referral/ui";
import RealtimeCard from "@/components/analytics/RealtimeCard";
import { Delta, Kpi, RangeLinks, Tabs, Trend, fmtDuration, fmtNum, fmtPct } from "@/components/analytics/parts";

export const metadata: Metadata = { title: "Website analytics" };
export const dynamic = "force-dynamic";

export default async function Analytics({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireAdmin();
  const range = parseARange((await searchParams).range);
  const r = rangeBounds(range);
  const [cur, prev, series, acq, top, countries, cities, devices, browsers, os, ev, rt, ever] = await Promise.all([
    totals(r.from, r.to),
    totals(r.prevFrom, r.prevTo),
    trend(range, r.from, r.to),
    acquisition(r.from, r.to),
    pages(r.from, r.to),
    breakdown("country", r.from, r.to),
    breakdown("city", r.from, r.to),
    breakdown("device", r.from, r.to),
    breakdown("browser", r.from, r.to),
    breakdown("os", r.from, r.to),
    events(r.from, r.to),
    realtime(),
    anyViews(),
  ]);
  const prevLabel = range === "today" ? "vs yesterday until now" : `vs the ${r.days} days before`;
  const returning = Math.max(0, cur.visitors - cur.newVisitors);
  const leadActions = ev.totals.filter((e) => ["whatsapp_click", "call_click", "email_click", "form_submit"].includes(e.name));

  return (
    <>
      <PageHead
        title="Website analytics"
        help="GOBT's own analytics for gobt.in: who visits, from where, what they read and what they click. Visits by logged-in admins and bots aren't counted. No IP addresses are stored."
      >
        <RangeLinks base="/referral/admin/analytics" current={range} ranges={A_RANGES} />
      </PageHead>
      <Tabs current="site" />

      <RealtimeCard initial={rt} />

      {ever === 0 && (
        <p className="an-note">No visits recorded yet. Tracking starts as soon as this version is live on gobt.in; numbers appear here within seconds of the first visit.</p>
      )}

      <div className="an-kpis">
        <Kpi label="Visitors" value={fmtNum(cur.visitors)} delta={<Delta now={cur.visitors} before={prev.visitors} />} hint="Different people (browsers)" />
        <Kpi label="New visitors" value={fmtNum(cur.newVisitors)} delta={<Delta now={cur.newVisitors} before={prev.newVisitors} />} hint="First visit ever from this browser" />
        <Kpi label="Sessions" value={fmtNum(cur.sessions)} delta={<Delta now={cur.sessions} before={prev.sessions} />} hint="A visit; ends after 30 minutes without activity" />
        <Kpi label="Page views" value={fmtNum(cur.views)} delta={<Delta now={cur.views} before={prev.views} />} />
        <Kpi label="Pages / session" value={cur.viewsPerSession.toFixed(2)} delta={<Delta now={cur.viewsPerSession} before={prev.viewsPerSession} />} />
        <Kpi label="Avg. engagement" value={fmtDuration(cur.avgEngagementMs)} delta={<Delta now={cur.avgEngagementMs} before={prev.avgEngagementMs} />} hint="Time the page was actually on screen, per session" />
        <Kpi label="Bounce rate" value={fmtPct(cur.bounceRate, 0)} delta={<Delta now={cur.bounceRate} before={prev.bounceRate} lowerIsBetter />} hint="Sessions with one page and under 10 seconds" />
      </div>
      <p className="an-muted an-compare">Changes are {prevLabel}.</p>

      <Card title={range === "today" ? "Today, hour by hour" : range === "365" ? "Month by month" : "Day by day"}>
        <Trend data={series.map((s) => ({ label: s.label, a: s.visitors, b: s.views }))} a="Visitors" b="Page views" />
      </Card>

      <div className="ad-grid2">
        <Card title="Leads from the website" help="Clicks on WhatsApp, phone and email links, and forms sent.">
          {leadActions.length === 0 ? (
            <Empty>No lead actions in this period.</Empty>
          ) : (
            <div className="an-events">
              {leadActions.map((e) => (
                <div key={e.name}>
                  <b>{fmtNum(e.count)}</b>
                  <span>{e.label}</span>
                  <small>
                    by {fmtNum(e.people)} {e.people === 1 ? "person" : "people"}
                  </small>
                </div>
              ))}
            </div>
          )}
          {ev.detail.length > 0 && (
            <table className="rt an-table">
              <thead>
                <tr>
                  <th>Where</th>
                  <th>What</th>
                  <th>Times</th>
                </tr>
              </thead>
              <tbody>
                {ev.detail.slice(0, 10).map((d, i) => (
                  <tr key={i}>
                    <td data-label="Where">{d.path}</td>
                    <td data-label="What">
                      {ev.totals.find((t) => t.name === d.name)?.label ?? d.name}
                      {d.label && <small>{d.label}</small>}
                    </td>
                    <td data-label="Times">{d.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card title="How people find the site" help="Sessions by channel. Organic search is Google, Bing and other search engines.">
          <Split rows={acq.channels} empty="No visits in this period." />
        </Card>
      </div>

      <Card title="Sources" help="Where each visit came from (the first page of the session). Add ?utm_source=…&utm_campaign=… to links you share to see them here.">
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
                    <b>{s.source}</b>
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
      </Card>

      <Card title="Pages" help="What people read. Entries: how many visits started on that page. Scrolled: how far down the page people got on average.">
        {top.length === 0 ? (
          <Empty>No page views in this period.</Empty>
        ) : (
          <table className="rt an-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>Views</th>
                <th>Visitors</th>
                <th>Avg. time</th>
                <th>Scrolled</th>
                <th>Entries</th>
              </tr>
            </thead>
            <tbody>
              {top.map((p) => (
                <tr key={p.path}>
                  <td data-label="Page">
                    <a href={p.path} target="_blank" rel="noopener noreferrer">
                      <b>{p.path}</b>
                    </a>
                    {p.title && <small>{p.title}</small>}
                  </td>
                  <td data-label="Views">{fmtNum(p.views)}</td>
                  <td data-label="Visitors">{fmtNum(p.visitors)}</td>
                  <td data-label="Avg. time">{fmtDuration(p.avgMs)}</td>
                  <td data-label="Scrolled">{Math.round(p.avgScroll)}%</td>
                  <td data-label="Entries">{fmtNum(p.entries)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="ad-grid2">
        <Card title="Countries">
          <Split rows={countries} />
        </Card>
        <Card title="Cities">
          <Split rows={cities} />
        </Card>
        <Card title="Devices" help={`${fmtNum(cur.newVisitors)} new and ${fmtNum(returning)} returning visitors.`}>
          <Split rows={devices} />
        </Card>
        <Card title="Browsers">
          <Split rows={browsers} />
        </Card>
        <Card title="Operating systems">
          <Split rows={os} />
        </Card>
      </div>
    </>
  );
}
