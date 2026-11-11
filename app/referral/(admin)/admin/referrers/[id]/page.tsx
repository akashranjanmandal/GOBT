import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/referral/auth";
import { channelLabel } from "@/lib/referral/channels";
import { STATUS_LABEL, inr } from "@/lib/referral/config";
import { myLeads, myLedger, myRedemptions } from "@/lib/referral/data";
import {
  balances,
  channelReport,
  clickBreakdown,
  dailySeries,
  parseRange,
  recentActivity,
  recentClicks,
  referrerById,
  totals,
} from "@/lib/referral/stats";
import { SITE } from "@/lib/seo";
import { setBlockedAction } from "../../actions";
import { PageHead, RangeTabs, StatusChip, rangeLabel } from "@/components/referral/adminui";
import { BarChart, Card, Empty, Split, Stat, ago, fmtDate, fmtTime, pct } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Referrer" };

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ range?: string }> };

export default async function ReferrerDetail({ params, searchParams }: Props) {
  await requireAdmin();
  const id = Number((await params).id);
  const days = parseRange((await searchParams).range ?? "0");
  const person = Number.isInteger(id) ? await referrerById(id) : null;
  if (!person) notFound();

  const [t, bal, opens, shares, channels, devices, places, sources, leads, ledger, redemptions, feed, visits] = await Promise.all([
    totals(days, id),
    balances(id),
    dailySeries("clicks", days || 90, id),
    dailySeries("shares", days || 90, id),
    channelReport(days, id),
    clickBreakdown("device", days, id),
    clickBreakdown("city", days, id),
    clickBreakdown("source_host", days, id),
    myLeads(id),
    myLedger(id),
    myRedemptions(id),
    recentActivity(40, id),
    recentClicks(25, id),
  ]);
  const period = rangeLabel(days);
  const link = `${SITE.url}/r/${person.code}`;

  return (
    <>
      <p className="ad-back">
        <Link href="/referral/admin/referrers">← All referrers</Link>
      </p>
      <PageHead title={person.name ?? person.email} help={`Referral code ${person.code}. Numbers are for ${period}.`}>
        <RangeTabs base={`/referral/admin/referrers/${id}`} current={days} />
      </PageHead>

      <div className="ad-grid2">
        <Card title="Contact and payout details">
          <dl className="ad-dl">
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${person.email}`}>{person.email}</a>
              </dd>
            </div>
            <div>
              <dt>Mobile</dt>
              <dd>
                {person.phone ? (
                  <>
                    <a href={`tel:+91${person.phone}`}>+91 {person.phone}</a> ·{" "}
                    <a href={`https://wa.me/91${person.phone}`} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  </>
                ) : (
                  "—"
                )}
              </dd>
            </div>
            <div>
              <dt>UPI ID</dt>
              <dd>{person.upi ?? <span className="ad-warn">Not added yet</span>}</dd>
            </div>
            <div>
              <dt>Referral link</dt>
              <dd>
                <code>{link.replace("https://", "")}</code>
              </dd>
            </div>
            <div>
              <dt>Joined</dt>
              <dd>{fmtDate(person.createdAt)}</dd>
            </div>
            <div>
              <dt>Last active</dt>
              <dd>{ago(person.lastSeenAt)}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                {person.blocked ? <StatusChip status="rejected" label="Suspended" /> : <StatusChip status="won" label="Active" />}
                <form action={setBlockedAction} className="ad-inline">
                  <input type="hidden" name="id" value={person.id} />
                  <input type="hidden" name="blocked" value={person.blocked ? "0" : "1"} />
                  <button className={`ad-btn ad-btn-sm ${person.blocked ? "" : "ad-btn-danger"}`}>
                    {person.blocked ? "Re-enable account" : "Suspend account"}
                  </button>
                </form>
                <small className="ad-muted">Suspended referrers can&apos;t log in and their link stops counting.</small>
              </dd>
            </div>
          </dl>
        </Card>

        <div className="ad-stats ad-stats-2">
          <Stat label="Times shared" value={t.shares} hint={period} tone="lilac" />
          <Stat label="Link opens" value={t.clicks} hint={`${t.visitors} different people`} tone="gold" />
          <Stat label="Leads" value={t.leads} hint={`${pct(t.leads, t.visitors)} of people who opened`} tone="pink" />
          <Stat label="Clients" value={t.won} hint={`${pct(t.won, t.leads)} of leads`} tone="mint" />
          <Stat label="Commission earned" value={inr(t.earned)} hint={`From ${inr(t.received)} client money`} tone="plain" />
          <Stat label="To pay now" value={inr(bal.commissionPending)} hint={`${inr(bal.commissionPaid)} paid so far`} tone="gold" />
          <Stat label="Points" value={bal.pointsAvailable} hint={`${inr(bal.redeemedInr)} redeemed so far`} tone="plain" />
        </div>
      </div>

      <div className="ad-grid2">
        <BarChart data={opens} label="Link opens per day" tone="gold" />
        <BarChart data={shares} label="Shares per day" tone="lilac" />
      </div>

      <Card title="Where they share" help="Each place this person shared their link, and what came of it.">
        {channels.length === 0 ? (
          <Empty>No shares or link opens yet.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Where</th>
                <th>Shares</th>
                <th>Opens</th>
                <th>Different people</th>
                <th>Leads</th>
                <th>Clients</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel || "direct"}>
                  <td data-label="Where">{c.label}</td>
                  <td data-label="Shares">{c.shares}</td>
                  <td data-label="Opens">{c.clicks}</td>
                  <td data-label="Different people">{c.visitors}</td>
                  <td data-label="Leads">{c.leads}</td>
                  <td data-label="Clients">{c.won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <div className="ad-grid3">
        <Card title="Devices">
          <Split rows={devices.map((d) => ({ key: d.key ?? "Unknown", value: d.clicks }))} />
        </Card>
        <Card title="Places">
          <Split rows={places.map((d) => ({ key: d.key ?? "Unknown", value: d.clicks }))} empty="No location data yet." />
        </Card>
        <Card title="Opened from" help="The website people were on when they clicked (apps like WhatsApp show as direct).">
          <Split rows={sources.map((d) => ({ key: d.key ?? "Direct / app", value: d.clicks }))} />
        </Card>
      </div>

      <Card title={`Leads (${leads.length})`}>
        {leads.length === 0 ? (
          <Empty>No leads from this person yet.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Needs</th>
                <th>How</th>
                <th>Added</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td data-label="Lead">
                    <b>{l.name}</b>
                    <small>{[l.phone && `+91 ${l.phone}`, l.email, l.company].filter(Boolean).join(" · ")}</small>
                  </td>
                  <td data-label="Needs" className="ad-clip">
                    {l.need}
                  </td>
                  <td data-label="How">{l.source === "link" ? `Link${l.channel ? ` (${channelLabel(l.channel)})` : ""}` : "Dashboard form"}</td>
                  <td data-label="Added">{fmtDate(l.createdAt)}</td>
                  <td data-label="Status">
                    <StatusChip status={l.status} label={STATUS_LABEL[l.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className="ad-muted">
          Change a lead&apos;s status or record payments on the <Link href="/referral/admin/leads">Leads page</Link>.
        </p>
      </Card>

      <div className="ad-grid2">
        <Card title="Money and points">
          {ledger.length === 0 && redemptions.length === 0 ? (
            <Empty>No rewards yet.</Empty>
          ) : (
            <ul className="ad-ledger">
              {ledger.map((e) => (
                <li key={`e${e.id}`}>
                  <span>
                    {e.note}
                    <small>
                      {fmtTime(e.createdAt)} · {e.status}
                    </small>
                  </span>
                  <b>{e.kind === "commission" ? inr(e.amount) : `+${e.amount} pts`}</b>
                </li>
              ))}
              {redemptions.map((r) => (
                <li key={`r${r.id}`}>
                  <span>
                    Redeemed {r.points} points
                    <small>
                      {fmtTime(r.createdAt)} · {r.status}
                    </small>
                  </span>
                  <b>{inr(r.amountInr)}</b>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Timeline" help="Everything this person did, and what admins did for them.">
          {feed.length === 0 ? (
            <Empty>Nothing yet.</Empty>
          ) : (
            <ul className="ad-feed">
              {feed.map((f) => (
                <li key={f.id}>
                  <span className={`ad-dot ad-dot-${f.kind}`} aria-hidden="true" />
                  <span>
                    {f.detail}
                    <small>{fmtTime(f.at)}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Latest link opens" help="Each real visit to this person's link (bots and repeat visits within an hour aren't counted).">
        {visits.length === 0 ? (
          <Empty>Nobody has opened this link yet.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>When</th>
                <th>From</th>
                <th>Opened from</th>
                <th>Device</th>
                <th>Place</th>
                <th>Visitor</th>
              </tr>
            </thead>
            <tbody>
              {visits.map((v) => (
                <tr key={v.id}>
                  <td data-label="When">{fmtTime(v.at)}</td>
                  <td data-label="From">{channelLabel(v.channel)}</td>
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
