import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { channelLabel } from "@/lib/referral/channels";
import { LEAD_STATUSES, REFERRAL, STATUS_LABEL, inr } from "@/lib/referral/config";
import { adminLeads } from "@/lib/referral/data";
import { leadCounts } from "@/lib/referral/stats";
import { setLeadStatusAction } from "../actions";
import { PageHead, StatusChip } from "@/components/referral/adminui";
import { PaymentForm } from "@/components/referral/AdminForms";
import { Card, Empty, ago, fmtDate } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Leads" };

type Props = { searchParams: Promise<{ status?: string }> };

export default async function Leads({ searchParams }: Props) {
  await requireAdmin();
  const { status } = await searchParams;
  const active = status && (LEAD_STATUSES as readonly string[]).includes(status) ? status : undefined;
  const [leads, counts] = await Promise.all([adminLeads(active), leadCounts()]);
  const all = Object.values(counts).reduce((a, n) => a + n, 0);

  return (
    <>
      <PageHead
        title="Leads"
        help={`People referred to GOBT. Move each one along as your sales team talks to them. Marking a lead “${STATUS_LABEL.won}” gives the referrer ${REFERRAL.pointsPerCustomer} points; then add each payment the client makes and the referrer gets ${REFERRAL.commissionPercent}% of it.`}
      />

      <nav className="ad-filter" aria-label="Filter by status">
        <Link href="/referral/admin/leads" className={!active ? "is-active" : ""}>
          All <span>{all}</span>
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link key={s} href={`/referral/admin/leads?status=${s}`} className={active === s ? "is-active" : ""}>
            {STATUS_LABEL[s]} <span>{counts[s] ?? 0}</span>
          </Link>
        ))}
      </nav>

      <Card title={active ? STATUS_LABEL[active as keyof typeof STATUS_LABEL] : "All leads"}>
        {leads.length === 0 ? (
          <Empty>No leads here.</Empty>
        ) : (
          <ul className="ad-leads">
            {leads.map((l) => (
              <li key={l.id} className="ad-lead">
                <div className="ad-lead-who">
                  <div>
                    <b>{l.name}</b>
                    <StatusChip status={l.status} label={STATUS_LABEL[l.status]} />
                  </div>
                  <p className="ad-lead-contact">
                    {l.phone && (
                      <>
                        <a href={`tel:+91${l.phone}`}>+91 {l.phone}</a>
                        {" · "}
                        <a href={`https://wa.me/91${l.phone}`} target="_blank" rel="noopener noreferrer">
                          WhatsApp
                        </a>
                      </>
                    )}
                    {l.email && (
                      <>
                        {l.phone && " · "}
                        <a href={`mailto:${l.email}`}>{l.email}</a>
                      </>
                    )}
                    {l.company && ` · ${l.company}`}
                  </p>
                  <p className="ad-lead-need">“{l.need}”</p>
                  <p className="ad-muted">
                    Added {fmtDate(l.createdAt)} ({ago(l.createdAt)}) ·{" "}
                    {l.source === "link" ? `came through a referral link${l.channel ? ` shared on ${channelLabel(l.channel)}` : ""}` : "added from the referrer's dashboard"} · referred by{" "}
                    <Link href={`/referral/admin/referrers/${l.referrerId}`}>{l.referrer}</Link>
                  </p>
                </div>

                <div className="ad-lead-actions">
                  <form action={setLeadStatusAction} className="ad-stack" key={`${l.id}-${l.status}-${l.updatedAt}`}>
                    <input type="hidden" name="id" value={l.id} />
                    <label className="ad-field">
                      <span>Status</span>
                      <select name="status" defaultValue={l.status}>
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="ad-field">
                      <span>Note for your team</span>
                      <input name="note" defaultValue={l.adminNote ?? ""} placeholder="e.g. Called, wants a quote" />
                    </label>
                    <button className="ad-btn ad-btn-sm">Save</button>
                  </form>

                  <div className="ad-lead-money">
                    <span>
                      Client paid <b>{inr(l.received)}</b> · referrer earns <b>{inr(l.commission)}</b>
                    </span>
                    {l.status === "won" ? (
                      <PaymentForm id={l.id} />
                    ) : (
                      <small className="ad-muted">Mark as “{STATUS_LABEL.won}” to add payments.</small>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
