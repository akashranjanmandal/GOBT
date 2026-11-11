import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { REFERRAL, inr } from "@/lib/referral/config";
import {
  attention,
  balances,
  channelReport,
  dailySeries,
  parseRange,
  programme,
  recentActivity,
  referrerRows,
  totals,
} from "@/lib/referral/stats";
import { PageHead, RangeTabs, rangeLabel } from "@/components/referral/adminui";
import { BarChart, Card, Empty, Funnel, Stat, ago, pct } from "@/components/referral/ui";

type Props = { searchParams: Promise<{ range?: string }> };

export default async function Overview({ searchParams }: Props) {
  const admin = await requireAdmin();
  const days = parseRange((await searchParams).range);
  const [t, p, money, todo, clicks, leads, shares, channels, top, feed] = await Promise.all([
    totals(days),
    programme(days),
    balances(),
    attention(),
    dailySeries("clicks", days || 90),
    dailySeries("leads", days || 90),
    dailySeries("shares", days || 90),
    channelReport(days),
    referrerRows(days, { limit: 8 }),
    recentActivity(10),
  ]);
  const period = rangeLabel(days);
  const pointsValue = Math.floor(money.pointsAvailable / REFERRAL.redeemBlock) * REFERRAL.rupeesPerBlock;

  const tasks = [
    todo.newLeads > 0 && {
      href: "/referral/admin/leads?status=new",
      text: `${todo.newLeads} new ${todo.newLeads === 1 ? "lead is" : "leads are"} waiting for a call`,
      extra: todo.staleLeads ? `${todo.staleLeads} older than 2 days` : null,
      tone: "pink",
    },
    todo.pendingCommissions > 0 && {
      href: "/referral/admin/money",
      text: `${inr(todo.pendingCommissionAmount)} in commission to pay (${todo.pendingCommissions})`,
      extra: todo.missingUpi ? `${todo.missingUpi} referrer${todo.missingUpi === 1 ? " has" : "s have"} no UPI ID yet` : null,
      tone: "gold",
    },
    todo.redemptionRequests > 0 && {
      href: "/referral/admin/money#redemptions",
      text: `${todo.redemptionRequests} points ${todo.redemptionRequests === 1 ? "redemption" : "redemptions"} to pay (${inr(todo.redemptionAmount)})`,
      extra: null,
      tone: "mint",
    },
  ].filter(Boolean) as { href: string; text: string; extra: string | null; tone: string }[];

  return (
    <>
      <PageHead title={`Welcome, ${admin.name}`} help="How the referral program is doing, and what needs your attention.">
        <RangeTabs base="/referral/admin" current={days} />
      </PageHead>

      <Card title="Needs your attention" help={tasks.length ? "Click an item to deal with it." : undefined}>
        {tasks.length === 0 ? (
          <p className="ad-allgood">✓ All caught up. No new leads or payouts waiting.</p>
        ) : (
          <ul className="ad-tasks">
            {tasks.map((x) => (
              <li key={x.href}>
                <Link href={x.href} className={`ad-task ad-task-${x.tone}`}>
                  <b>{x.text}</b>
                  {x.extra && <small>{x.extra}</small>}
                  <span aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="ad-stats">
        <Stat label="Referrers" value={p.referrers} hint={`${p.activeReferrers} active, ${p.newReferrers} new (${period})`} tone="lilac" href="/referral/admin/referrers" />
        <Stat label="Times links were shared" value={t.shares} hint={period} tone="plain" />
        <Stat label="Link opens" value={t.clicks} hint={`${t.visitors} different people (${period})`} tone="gold" href="/referral/admin/traffic" />
        <Stat label="Leads" value={t.leads} hint={`${pct(t.leads, t.visitors)} of people who opened a link`} tone="pink" href="/referral/admin/leads" />
        <Stat label="Became clients" value={t.won} hint={`${pct(t.won, t.leads)} of leads (${period})`} tone="mint" />
        <Stat label="Client money received" value={inr(t.received)} hint={`From referred clients (${period})`} tone="plain" />
        <Stat label="Commission to pay" value={inr(money.commissionPending)} hint={`${inr(money.commissionPaid)} already paid (all time)`} tone="gold" href="/referral/admin/money" />
        <Stat label="Points held by referrers" value={money.pointsAvailable.toLocaleString("en-IN")} hint={`Redeemable now: ${inr(pointsValue)}`} tone="plain" />
      </div>

      <div className="ad-grid3">
        <BarChart data={clicks} label="Link opens per day" tone="gold" />
        <BarChart data={leads} label="New leads per day" tone="pink" />
        <BarChart data={shares} label="Shares per day" tone="lilac" />
      </div>

      <div className="ad-grid2">
        <Card title="From share to client" help={`How many people make it through each step (${period}).`}>
          <Funnel
            steps={[
              { label: "Times shared", value: t.shares, hint: "Referrers pressed a share button" },
              { label: "Link opens", value: t.clicks, hint: "Real visits, bots removed" },
              { label: "Different people", value: t.visitors },
              { label: "Leads", value: t.leads, hint: "Referred people (form or link)" },
              { label: "We called", value: t.contacted },
              { label: "Talking business", value: t.qualified },
              { label: "Clients", value: t.won },
            ]}
          />
        </Card>

        <Card title="Where links are shared" help="Each place referrers share, and what came of it." action={<Link href="/referral/admin/traffic" className="ad-more">Details →</Link>}>
          {channels.length === 0 ? (
            <Empty>No shares or link opens yet.</Empty>
          ) : (
            <table className="rt">
              <thead>
                <tr>
                  <th>Where</th>
                  <th>Shares</th>
                  <th>Opens</th>
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
                    <td data-label="Leads">{c.leads}</td>
                    <td data-label="Clients">{c.won}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <div className="ad-grid2">
        <Card title="Top referrers" help={`Ranked by clients, then leads, then link opens (${period}).`} action={<Link href="/referral/admin/referrers" className="ad-more">Everyone →</Link>}>
          {top.length === 0 ? (
            <Empty>Nobody has joined yet. Share gobt.in/referral to recruit referrers.</Empty>
          ) : (
            <ol className="ad-top">
              {top.map((r, i) => (
                <li key={r.id}>
                  <span className="ad-rank">{i + 1}</span>
                  <Link href={`/referral/admin/referrers/${r.id}`}>
                    <b>{r.name ?? r.email}</b>
                    <small>
                      {r.clicks} opens · {r.leads} leads · {r.won} clients
                    </small>
                  </Link>
                  <span className="ad-top-money">{inr(r.earned)}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Latest activity" action={<Link href="/referral/admin/activity" className="ad-more">All activity →</Link>}>
          {feed.length === 0 ? (
            <Empty>Nothing has happened yet.</Empty>
          ) : (
            <ul className="ad-feed">
              {feed.map((f) => (
                <li key={f.id}>
                  <span className={`ad-dot ad-dot-${f.kind}`} aria-hidden="true" />
                  <span>
                    {f.detail}
                    <small>{ago(f.at)}</small>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
