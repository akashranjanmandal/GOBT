import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { VITALS, events, filterOptions, filterQuery, notFound, pages, parseFilter, rating, vitals, type VitalId } from "@/lib/analytics/report";
import { PageHead } from "@/components/referral/adminui";
import { Card, Empty, ago } from "@/components/referral/ui";
import FilterBar from "@/components/analytics/FilterBar";
import { Tabs, fmtDuration, fmtNum, fmtPct } from "@/components/analytics/parts";

export const metadata: Metadata = { title: "Pages & speed" };
export const dynamic = "force-dynamic";

const show = (id: VitalId, v: number | null) => (v == null ? "—" : id === "cls" ? v.toFixed(2) : v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${Math.round(v)}ms`);
const RATING = { good: "Good", ok: "Needs work", poor: "Poor", none: "No data" } as const;

function VitalCell({ id, v }: { id: VitalId; v: number | null }) {
  const r = rating(id, v);
  return <span className={`an-vital is-${r}`}>{show(id, v)}</span>;
}

export default async function Pages({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const f = parseFilter(await searchParams);
  const base = "/referral/admin/analytics/pages";
  const q = filterQuery(f);
  const [list, missing, speed, ev, options] = await Promise.all([pages(f, 60), notFound(f), vitals(f), events(f), filterOptions(f)]);
  const other = ev.detail.filter((d) => ["outbound_click", "download", "cta_click"].includes(d.name));

  return (
    <>
      <PageHead title="Website analytics" help="Every page: how much it's read, where people leave, which links are broken, and how fast it loads for real visitors." />
      <Tabs current="pages" query={q} />
      <FilterBar
        f={f}
        base={base}
        options={options}
        exports={[
          { id: "pages", label: "Pages" },
          { id: "notfound", label: "Broken links" },
          { id: "vitals", label: "Page speed" },
        ]}
      />

      <Card title="Page speed for real visitors" help="Core Web Vitals measured in visitors' own browsers (the 75th percentile, like Google uses). Google uses these in ranking.">
        {speed.samples === 0 ? (
          <Empty>No speed data yet. It&apos;s collected from every visit once this version is live.</Empty>
        ) : (
          <>
            <div className="an-vitals">
              {VITALS.map((m) => (
                <div key={m.id} className={`an-vbox is-${rating(m.id, speed.all[m.id].p75)}`} title={m.help}>
                  <span>
                    {m.label} <small>({m.name})</small>
                  </span>
                  <b>{show(m.id, speed.all[m.id].p75)}</b>
                  <small>
                    {RATING[rating(m.id, speed.all[m.id].p75)]} · {fmtPct(speed.all[m.id].good, 0)} of visits good · phones {show(m.id, speed.mobile[m.id].p75)}, computers {show(m.id, speed.desktop[m.id].p75)}
                  </small>
                </div>
              ))}
            </div>
            <table className="rt an-table">
              <thead>
                <tr>
                  <th>Page</th>
                  <th>Visits measured</th>
                  {VITALS.map((m) => (
                    <th key={m.id} title={m.help}>
                      {m.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {speed.perPage.map((p) => (
                  <tr key={p.path}>
                    <td data-label="Page">{p.path}</td>
                    <td data-label="Visits measured">{p.samples}</td>
                    {VITALS.map((m) => (
                      <td key={m.id} data-label={m.name}>
                        <VitalCell id={m.id} v={p[m.id].p75} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Card>

      <Card title="Pages" help="Exits: how many visits ended on that page. A high exit rate on a page that should lead somewhere is worth a look. Click a page to see who came before and after.">
        {list.length === 0 ? (
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
                <th>Exits</th>
                <th>Exit rate</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.path}>
                  <td data-label="Page">
                    <Link href={`/referral/admin/analytics?${filterQuery(f, { page: p.path })}`}>
                      <b>{p.path}</b>
                    </Link>
                    {p.title && <small>{p.title}</small>}
                  </td>
                  <td data-label="Views">{fmtNum(p.views)}</td>
                  <td data-label="Visitors">{fmtNum(p.visitors)}</td>
                  <td data-label="Avg. time">{fmtDuration(p.avgMs)}</td>
                  <td data-label="Scrolled">{Math.round(p.avgScroll)}%</td>
                  <td data-label="Entries">{fmtNum(p.entries)}</td>
                  <td data-label="Exits">{fmtNum(p.exits)}</td>
                  <td data-label="Exit rate">{fmtPct(p.exitRate, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Broken links (404)" help="Addresses people tried that don't exist, and the page or site that sent them. Fix the link there, or add a redirect.">
        {missing.length === 0 ? (
          <Empty>No broken links hit in this period.</Empty>
        ) : (
          <table className="rt an-table">
            <thead>
              <tr>
                <th>Missing address</th>
                <th>Came from</th>
                <th>Times</th>
                <th>Last</th>
              </tr>
            </thead>
            <tbody>
              {missing.map((m, i) => (
                <tr key={i}>
                  <td data-label="Missing address">
                    <b>{m.path}</b>
                  </td>
                  <td data-label="Came from">{m.from}</td>
                  <td data-label="Times">{m.hits}</td>
                  <td data-label="Last">{ago(m.last)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card title="Other clicks" help="Links to other websites, file downloads and buttons marked with data-track.">
        {other.length === 0 ? (
          <Empty>None in this period.</Empty>
        ) : (
          <table className="rt an-table">
            <thead>
              <tr>
                <th>Page</th>
                <th>What</th>
                <th>Times</th>
              </tr>
            </thead>
            <tbody>
              {other.map((d, i) => (
                <tr key={i}>
                  <td data-label="Page">{d.path}</td>
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
    </>
  );
}
