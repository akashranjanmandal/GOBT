import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { channelLabel } from "@/lib/referral/channels";
import { channelReport, clickBreakdown, dailySeries, parseRange, recentClicks, totals } from "@/lib/referral/stats";
import { PageHead, RangeTabs, rangeLabel } from "@/components/referral/adminui";
import { BarChart, Card, Empty, Split, Stat, fmtTime, pct } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Link traffic" };

type Props = { searchParams: Promise<{ range?: string }> };

export default async function Traffic({ searchParams }: Props) {
  await requireAdmin();
  const days = parseRange((await searchParams).range);
  const [t, opens, shares, channels, sources, devices, cities, countries, log] = await Promise.all([
    totals(days),
    dailySeries("clicks", days || 90),
    dailySeries("shares", days || 90),
    channelReport(days),
    clickBreakdown("source_host", days),
    clickBreakdown("device", days),
    clickBreakdown("city", days, undefined, 10),
    clickBreakdown("country", days),
    recentClicks(100),
  ]);
  const period = rangeLabel(days);

  return (
    <>
      <PageHead
        title="Link traffic"
        help="Who is sharing referral links, where, and who opens them. Bots and link previews are left out, each person counts once per referrer, and a person already referred by someone else stays with them, so these are real people."
      >
        <RangeTabs base="/referral/admin/traffic" current={days} />
      </PageHead>

      <div className="ad-stats">
        <Stat label="Times shared" value={t.shares} hint={period} tone="lilac" />
        <Stat label="Link opens" value={t.clicks} hint={period} tone="gold" />
        <Stat label="Different people" value={t.visitors} hint={`${pct(t.visitors, t.clicks)} of opens were first visits`} tone="plain" />
        <Stat label="Leads from links" value={channels.reduce((a, c) => a + c.leads, 0)} hint="Visitors who then filled in the contact form" tone="pink" />
      </div>

      <div className="ad-grid2">
        <BarChart data={opens} label="Link opens per day" tone="gold" />
        <BarChart data={shares} label="Shares per day" tone="lilac" />
      </div>

      <Card title="By channel" help="“Shares” are presses of a share button. “Opens” come from links tagged with that channel.">
        {channels.length === 0 ? (
          <Empty>No shares or link opens yet.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Shares</th>
                <th>Opens</th>
                <th>Opens per share</th>
                <th>Different people</th>
                <th>Leads</th>
                <th>Clients</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel || "direct"}>
                  <td data-label="Channel">{c.label}</td>
                  <td data-label="Shares">{c.shares}</td>
                  <td data-label="Opens">{c.clicks}</td>
                  <td data-label="Opens per share">{c.shares ? (c.clicks / c.shares).toFixed(1) : "—"}</td>
                  <td data-label="Different people">{c.visitors}</td>
                  <td data-label="Leads">{c.leads}</td>
                  <td data-label="Clients">{c.won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="ad-grid2">
        <Card title="Devices">
          <Split rows={devices.map((d) => ({ key: d.key ?? "Unknown", value: d.clicks }))} />
        </Card>
        <Card title="Opened from" help="The website people were on. Apps like WhatsApp and SMS don't say, so they show as direct.">
          <Split rows={sources.map((d) => ({ key: d.key ?? "Direct / app", value: d.clicks }))} />
        </Card>
        <Card title="Cities">
          <Split rows={cities.map((d) => ({ key: d.key ?? "Unknown", value: d.clicks }))} empty="No location data yet. It appears on the live site." />
        </Card>
        <Card title="Countries">
          <Split rows={countries.map((d) => ({ key: d.key ?? "Unknown", value: d.clicks }))} empty="No location data yet. It appears on the live site." />
        </Card>
      </div>

      <Card title="Every link open (latest 100)">
        {log.length === 0 ? (
          <Empty>Nobody has opened a referral link yet.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>When</th>
                <th>Whose link</th>
                <th>Channel</th>
                <th>Opened from</th>
                <th>Device</th>
                <th>Place</th>
                <th>Visitor</th>
              </tr>
            </thead>
            <tbody>
              {log.map((v) => (
                <tr key={v.id}>
                  <td data-label="When">{fmtTime(v.at)}</td>
                  <td data-label="Whose link">
                    <Link href={`/referral/admin/referrers?q=${encodeURIComponent(v.code)}`}>{v.referrer}</Link>
                  </td>
                  <td data-label="Channel">{channelLabel(v.channel)}</td>
                  <td data-label="Opened from">{v.source ?? "Direct / app"}</td>
                  <td data-label="Device">{v.device ?? "—"}</td>
                  <td data-label="Place">{v.place ?? "—"}</td>
                  <td data-label="Visitor">{v.isNew ? "First visit" : "Came back"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
