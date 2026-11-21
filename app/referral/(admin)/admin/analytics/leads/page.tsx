import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { EVENT_LABELS, conversions, filterOptions, filterQuery, parseFilter, recentLeads, totals, trend } from "@/lib/analytics/report";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, ago, fmtTime } from "@/components/referral/ui";
import FilterBar from "@/components/analytics/FilterBar";
import { Delta, Kpi, Tabs, Trend, fmtNum, fmtPct } from "@/components/analytics/parts";

export const metadata: Metadata = { title: "Website leads" };
export const dynamic = "force-dynamic";

type Conv = Awaited<ReturnType<typeof conversions>>;

function ConvTable({ rows, first, link }: { rows: Conv; first: string; link?: (k: string) => string }) {
  if (rows.length === 0) return <Empty>No visits in this period.</Empty>;
  return (
    <table className="rt an-table">
      <thead>
        <tr>
          <th>{first}</th>
          <th>Sessions</th>
          <th>With a lead</th>
          <th>Rate</th>
          <th>WhatsApp</th>
          <th>Calls</th>
          <th>Emails</th>
          <th>Forms</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td data-label={first}>{link ? <Link href={link(r.key)}>{r.key}</Link> : r.key}</td>
            <td data-label="Sessions">{fmtNum(r.sessions)}</td>
            <td data-label="With a lead">
              <b>{fmtNum(r.converted)}</b>
            </td>
            <td data-label="Rate">{fmtPct(r.rate)}</td>
            <td data-label="WhatsApp">{r.whatsapp || "–"}</td>
            <td data-label="Calls">{r.calls || "–"}</td>
            <td data-label="Emails">{r.emails || "–"}</td>
            <td data-label="Forms">{r.forms || "–"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function Leads({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const f = parseFilter(await searchParams);
  const base = "/referral/admin/analytics/leads";
  const q = filterQuery(f);
  const [cur, prev, series, byChannel, bySource, byLanding, byCampaign, recent, options] = await Promise.all([
    totals(f),
    totals(f, true),
    trend(f),
    conversions(f, "channel"),
    conversions(f, "source"),
    conversions(f, "landing"),
    conversions(f, "campaign"),
    recentLeads(f),
    filterOptions(f),
  ]);

  return (
    <>
      <PageHead
        title="Website analytics"
        help="Which visits turn into enquiries: WhatsApp, call and email clicks and forms sent, and where those visitors came from and landed."
      />
      <Tabs current="leads" query={q} />
      <FilterBar
        f={f}
        base={base}
        options={options}
        exports={[
          { id: "leads-source", label: "Leads by source" },
          { id: "leads-landing", label: "Leads by landing page" },
          { id: "events", label: "All clicks & forms" },
        ]}
      />

      <div className="an-kpis">
        <Kpi label="Lead actions" value={fmtNum(cur.leads)} delta={<Delta now={cur.leads} before={prev.leads} />} />
        <Kpi label="Visits with a lead" value={fmtNum(cur.leadSessions)} delta={<Delta now={cur.leadSessions} before={prev.leadSessions} />} />
        <Kpi label="Conversion rate" value={fmtPct(cur.conversionRate)} delta={<Delta now={cur.conversionRate} before={prev.conversionRate} />} hint="Visits with at least one lead action" />
        <Kpi label="Visits" value={fmtNum(cur.sessions)} delta={<Delta now={cur.sessions} before={prev.sessions} />} />
      </div>
      <p className="an-muted an-compare">{f.label}</p>

      <Card title="Lead actions over time">
        <Trend data={series.map((s) => ({ label: s.label, a: s.leads, b: s.visitors }))} a="Lead actions" b="Visitors" />
      </Card>

      <Card title="By channel" help="Which kind of traffic brings enquiries.">
        <ConvTable rows={byChannel} first="Channel" />
      </Card>
      <Card title="By source" help="Click a source to see all its numbers on the Traffic tab.">
        <ConvTable rows={bySource} first="Source / medium" link={(k) => `/referral/admin/analytics?${filterQuery(f, { source: k.split(" / ")[0] })}`} />
      </Card>
      <Card title="By landing page" help="The first page of the visit. Pages that convert well are worth sending more people to.">
        <ConvTable rows={byLanding} first="Landing page" link={(k) => `/referral/admin/analytics?${filterQuery(f, { page: k })}`} />
      </Card>
      {byCampaign.length > 0 && (
        <Card title="By campaign" help="Links shared with ?utm_campaign=…">
          <ConvTable rows={byCampaign} first="Campaign" />
        </Card>
      )}

      <Card title="Latest lead actions" help="Each click or form, with where that visitor came from.">
        {recent.length === 0 ? (
          <Empty>No lead actions in this period.</Empty>
        ) : (
          <table className="rt an-table">
            <thead>
              <tr>
                <th>When</th>
                <th>What</th>
                <th>On page</th>
                <th>Came from</th>
                <th>Visitor</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={i}>
                  <td data-label="When">
                    {fmtTime(r.at)}
                    <small>{ago(r.at)}</small>
                  </td>
                  <td data-label="What">
                    <b>{EVENT_LABELS[r.name]?.replace(/s$/, "") ?? r.name}</b>
                    {r.label && <small>{r.label}</small>}
                  </td>
                  <td data-label="On page">{r.path}</td>
                  <td data-label="Came from">
                    {r.source}
                    <small>landed on {r.landing}</small>
                  </td>
                  <td data-label="Visitor">
                    {r.device}
                    {r.place && <small>{r.place}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
