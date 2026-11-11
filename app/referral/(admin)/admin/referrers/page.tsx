import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { inr } from "@/lib/referral/config";
import { parseRange, referrerRows } from "@/lib/referral/stats";
import { PageHead, RangeTabs, rangeLabel } from "@/components/referral/adminui";
import { Card, Empty, ago, fmtDate } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Referrers" };

type Props = { searchParams: Promise<{ range?: string; q?: string }> };

export default async function Referrers({ searchParams }: Props) {
  await requireAdmin();
  const sp = await searchParams;
  const days = parseRange(sp.range ?? "0");
  const q = sp.q?.trim() ?? "";
  const [rows, everyone] = await Promise.all([referrerRows(days, { search: q }), referrerRows(0, { includeUnfinished: true })]);
  const unfinished = everyone.filter((r) => !r.name).length;

  return (
    <>
      <PageHead
        title="Referrers"
        help={`Everyone who has joined the program. Numbers below are for ${rangeLabel(days)}. Click a name to see everything about that person.`}
      >
        <RangeTabs base="/referral/admin/referrers" current={days} params={{ q }} />
      </PageHead>

      <form className="ad-search" action="/referral/admin/referrers">
        <input type="hidden" name="range" value={days} />
        <input name="q" defaultValue={q} placeholder="Search by name, email, phone or code" aria-label="Search referrers" />
        <button className="ad-btn">Search</button>
        {q && (
          <Link href={`/referral/admin/referrers?range=${days}`} className="ad-link">
            Clear
          </Link>
        )}
      </form>

      <Card
        title={`${rows.length} ${rows.length === 1 ? "referrer" : "referrers"}`}
        help={unfinished ? `${unfinished} more signed up but haven't finished their profile yet.` : undefined}
      >
        {rows.length === 0 ? (
          <Empty>{q ? "Nobody matches that search." : "Nobody has joined yet."}</Empty>
        ) : (
          <table className="rt rt-click">
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Shares</th>
                <th>Link opens</th>
                <th>Leads</th>
                <th>Clients</th>
                <th>Earned</th>
                <th>To pay</th>
                <th>Last active</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Referrer">
                    <Link href={`/referral/admin/referrers/${r.id}`} className="ad-person">
                      <b>{r.name}</b>
                      <small>
                        {r.code} · joined {fmtDate(r.createdAt)}
                      </small>
                      {r.blocked && <span className="ad-chip ad-chip-rejected">Suspended</span>}
                    </Link>
                  </td>
                  <td data-label="Shares">{r.shares}</td>
                  <td data-label="Link opens">{r.clicks}</td>
                  <td data-label="Leads">{r.leads}</td>
                  <td data-label="Clients">{r.won}</td>
                  <td data-label="Earned">{inr(r.earned)}</td>
                  <td data-label="To pay">{r.pending ? <b className="ad-owe">{inr(r.pending)}</b> : "—"}</td>
                  <td data-label="Last active">{ago(r.lastSeenAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
