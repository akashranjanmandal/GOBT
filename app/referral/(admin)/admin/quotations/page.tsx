import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { QUOTE_STATUSES, inr } from "@/lib/quotations/model";
import { listQuotations, quotationStats, type Bucket } from "@/lib/quotations/store";
import { PageHead, StatusChip } from "@/components/referral/adminui";
import { Card, Empty, Stat, pct } from "@/components/referral/ui";
import { quoteStatusTone, PAYMENT_LABEL } from "@/components/quotations/labels";

export const metadata: Metadata = { title: "Quotations" };

const todayIST = () => new Date(Date.now() + 5.5 * 3600_000).toISOString().slice(0, 10);

/* ₹ in lakhs for the big numbers: 1,22,130 → "₹1.22 L" */
const short = (paise: number) => {
  const r = paise / 100;
  if (r >= 1e7) return `₹${(r / 1e7).toFixed(2)} Cr`;
  if (r >= 1e5) return `₹${(r / 1e5).toFixed(2)} L`;
  return inr(paise);
};

function MonthBars({ months }: { months: Bucket[] }) {
  const max = Math.max(1, ...months.map((m) => m.value));
  return (
    <figure className="qd-bars" aria-label="Value quoted each month, before GST">
      {months.map((m) => (
        <Link key={m.key} href={`/referral/admin/quotations?month=${m.key}#list`} className="qd-bar" title={`${m.label}: ${m.count} quotation${m.count === 1 ? "" : "s"}, ${inr(m.value)} before GST`}>
          <span className="qd-bar-val">{m.value ? short(m.value) : ""}</span>
          <span className="qd-bar-track">
            <span className="qd-bar-fill" style={{ height: m.value ? `${Math.max(4, (m.value / max) * 100)}%` : "0" }} />
          </span>
          <span className="qd-bar-n">{m.count || "–"}</span>
          <span className="qd-bar-label">{m.label}</span>
        </Link>
      ))}
    </figure>
  );
}

export default async function Quotations({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; month?: string }> }) {
  await requireAdmin();
  const { q = "", status = "", month = "" } = await searchParams;
  const today = todayIST();
  const [stats, rows] = await Promise.all([quotationStats(today), listQuotations({ q, status, month })]);
  const filtered = Boolean(q || status || month);
  const listTotal = rows.reduce((s, r) => s + r.taxable, 0);

  return (
    <>
      <PageHead title="Quotations" help="Make a quotation in GOBT's format, download it as a PDF and track what we quote every month and quarter. Quotations can be edited but never deleted; every change is kept.">
        <div className="ad-inline">
          <Link href="/referral/admin/quotations/marks" className="ad-btn">
            Signatures &amp; stamps
          </Link>
          <Link href="/referral/admin/quotations/new" className="ad-btn ad-btn-primary">
            + New quotation
          </Link>
        </div>
      </PageHead>

      <div className="ad-stats">
        <Stat label="This month" value={short(stats.thisMonth.value)} hint={`${stats.thisMonth.count} quotation${stats.thisMonth.count === 1 ? "" : "s"} · ${short(stats.thisMonth.grand)} with GST`} tone="gold" />
        <Stat
          label={`This quarter · ${stats.thisQuarter.label}`}
          value={short(stats.thisQuarter.value)}
          hint={`${stats.thisQuarter.months} · ${stats.thisQuarter.count} quotations · ${short(stats.thisQuarter.grand)} with GST`}
          tone="mint"
        />
        <Stat label={`This financial year · ${stats.fy.label}`} value={short(stats.fy.value)} hint={`${stats.fy.count} quotations · ${short(stats.fy.accepted)} accepted`} tone="lilac" />
        <Stat label="All time" value={short(stats.all.value)} hint={`${stats.all.count} quotations · ${pct(stats.all.acceptedCount, stats.all.count)} accepted`} tone="plain" />
      </div>

      <Card title="Value quoted per month" help="Before GST, last 12 months. The number under each bar is how many quotations. Click a month to see its quotations.">
        <MonthBars months={stats.months} />
      </Card>

      <Card title="By quarter" help="Indian financial year: Q1 is April–June, Q4 is January–March.">
        {stats.quarters.every((x) => x.count === 0) ? (
          <Empty>No quotations yet.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Quarter</th>
                <th>Quotations</th>
                <th>Quoted (before GST)</th>
                <th>With GST</th>
                <th>Accepted</th>
              </tr>
            </thead>
            <tbody>
              {stats.quarters.map((x) => (
                <tr key={x.key}>
                  <td data-label="Quarter">
                    <b>{x.label}</b>
                    <small>{x.months}</small>
                  </td>
                  <td data-label="Quotations">{x.count}</td>
                  <td data-label="Quoted (before GST)">
                    <b>{inr(x.value)}</b>
                  </td>
                  <td data-label="With GST">{inr(x.grand)}</td>
                  <td data-label="Accepted">
                    {inr(x.accepted)}
                    <small>
                      {x.acceptedCount} of {x.count} ({pct(x.acceptedCount, x.count)})
                    </small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card
        id="list"
        title={filtered ? `${rows.length} matching quotation${rows.length === 1 ? "" : "s"} · ${inr(listTotal)} before GST` : "All quotations"}
        action={
          <form className="ad-inline qd-filter" action="/referral/admin/quotations#list">
            <input name="q" defaultValue={q} placeholder="Client, subject or number" aria-label="Search quotations" />
            <select name="status" defaultValue={status} aria-label="Status">
              <option value="">Any status</option>
              {QUOTE_STATUSES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <input type="month" name="month" defaultValue={month} aria-label="Month" />
            <button className="ad-btn ad-btn-sm">Filter</button>
            {filtered && (
              <Link className="ad-link" href="/referral/admin/quotations#list">
                Clear
              </Link>
            )}
          </form>
        }
      >
        {rows.length === 0 ? (
          <Empty>{filtered ? "No quotations match." : "No quotations yet. Press “New quotation” to make the first one."}</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Quotation</th>
                <th>Client</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td data-label="Quotation">
                    <Link href={`/referral/admin/quotations/${r.id}`}>
                      <b className="cf-mono">{r.quoteNo}</b>
                    </Link>
                    <small>
                      {r.date.split("-").reverse().join("-")}
                      {r.version > 1 ? ` · edited ${r.version - 1}×` : ""}
                    </small>
                  </td>
                  <td data-label="Client">
                    <b>{r.client}</b>
                    <small>{r.subject}</small>
                  </td>
                  <td data-label="Payment">{PAYMENT_LABEL[r.data.payment]}</td>
                  <td data-label="Total">
                    <b>{inr(r.grand)}</b>
                    <small>{inr(r.taxable)} + GST</small>
                  </td>
                  <td data-label="Status">
                    <StatusChip status={quoteStatusTone[r.status]} label={QUOTE_STATUSES.find((s) => s.id === r.status)!.label} />
                  </td>
                  <td data-label="Actions">
                    <div className="ad-inline">
                      <Link className="ad-btn ad-btn-sm" href={`/referral/admin/quotations/${r.id}`}>
                        Open
                      </Link>
                      <a className="ad-btn ad-btn-sm" href={`/api/referral/admin/quotations/${r.id}/pdf?download=1`}>
                        PDF
                      </a>
                    </div>
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
