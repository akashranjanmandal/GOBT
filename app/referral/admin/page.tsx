import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { LEAD_STATUSES, REFERRAL, STATUS_LABEL, inr } from "@/lib/referral/config";
import { adminLeads, adminPayouts, adminRedemptions, adminReferrers } from "@/lib/referral/data";
import { setCommissionAction, setLeadStatusAction, setRedemptionAction } from "../actions";
import { PaymentForm } from "@/components/referral/AdminForms";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

const TABS = [
  { id: "leads", label: "Leads" },
  { id: "payouts", label: "Commissions" },
  { id: "redemptions", label: "Redemptions" },
  { id: "referrers", label: "Referrers" },
] as const;

const date = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

type Props = { searchParams: Promise<{ tab?: string; status?: string }> };

export default async function Admin({ searchParams }: Props) {
  await requireAdmin();
  const { tab = "leads", status } = await searchParams;

  return (
    <main className="rf-main rf-wrap rf-dash">
      <span className="rf-sticker rf-sticker-pink">Admin</span>
      <h1 className="rf-h2">Referral program admin</h1>
      <nav className="rf-tabs" aria-label="Admin sections">
        {TABS.map((t) => (
          <Link key={t.id} href={`/referral/admin?tab=${t.id}`} className={tab === t.id ? "is-active" : ""} aria-current={tab === t.id ? "page" : undefined}>
            {t.label}
          </Link>
        ))}
      </nav>

      {tab === "leads" && <Leads status={status} />}
      {tab === "payouts" && <Payouts />}
      {tab === "redemptions" && <Redemptions />}
      {tab === "referrers" && <Referrers />}
    </main>
  );
}

async function Leads({ status }: { status?: string }) {
  const leads = await adminLeads(status);
  return (
    <section className="rf-panel">
      <div className="rf-filter">
        <Link href="/referral/admin?tab=leads" className={!status ? "is-active" : ""}>
          All
        </Link>
        {LEAD_STATUSES.map((s) => (
          <Link key={s} href={`/referral/admin?tab=leads&status=${s}`} className={status === s ? "is-active" : ""}>
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>
      <p className="rf-fine">
        Setting a lead to “{STATUS_LABEL.won}” gives the referrer {REFERRAL.pointsPerCustomer} points. Then add each payment the client makes:
        the referrer gets {REFERRAL.commissionPercent}% of it as a pending commission.
      </p>
      {leads.length === 0 ? (
        <p className="rf-empty">No leads here yet.</p>
      ) : (
        <div className="rf-table-wrap">
          <table className="rf-table rf-table-admin">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Needs</th>
                <th>Referred by</th>
                <th>Status</th>
                <th>Payments</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.name}
                    <small>
                      {l.phone ? `+91 ${l.phone}` : ""} {l.email ?? ""}
                    </small>
                    {l.company && <small>{l.company}</small>}
                    <small>
                      {date(l.createdAt)} · {l.source === "link" ? "via link" : "via form"}
                    </small>
                  </td>
                  <td className="rf-clip">{l.need}</td>
                  <td>{l.referrer}</td>
                  <td>
                    <form action={setLeadStatusAction} className="rf-stack" key={`${l.id}-${l.status}-${l.updatedAt}`}>
                      <input type="hidden" name="id" value={l.id} />
                      <select name="status" defaultValue={l.status} aria-label="Status">
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                      <input name="note" defaultValue={l.adminNote ?? ""} placeholder="Note (optional)" aria-label="Note" />
                      <button className="rf-btn rf-btn-ghost rf-btn-sm">Update</button>
                    </form>
                  </td>
                  <td>
                    <small>
                      Received {inr(l.received)} · commission {inr(l.commission)}
                    </small>
                    {l.status === "won" && <PaymentForm id={l.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function Payouts() {
  const rows = await adminPayouts();
  return (
    <section className="rf-panel">
      <p className="rf-fine">Pay pending commissions by UPI, then mark them paid. Reverse one if the client&apos;s payment was refunded.</p>
      {rows.length === 0 ? (
        <p className="rf-empty">No commissions yet.</p>
      ) : (
        <div className="rf-table-wrap">
          <table className="rf-table">
            <thead>
              <tr>
                <th>Referrer</th>
                <th>For</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.referrer}
                    <small>UPI: {r.upi ?? "not added yet"}</small>
                  </td>
                  <td>
                    {r.note}
                    <small>{date(r.createdAt)}</small>
                  </td>
                  <td>{inr(r.amount)}</td>
                  <td>
                    <span className={`rf-status rf-status-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    <form action={setCommissionAction} className="rf-inline">
                      <input type="hidden" name="id" value={r.id} />
                      {r.status === "pending" ? (
                        <>
                          <button name="status" value="paid" className="rf-btn rf-btn-mint rf-btn-sm">
                            Mark paid
                          </button>
                          <button name="status" value="reversed" className="rf-link">
                            Reverse
                          </button>
                        </>
                      ) : (
                        <button name="status" value="pending" className="rf-link">
                          Undo
                        </button>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function Redemptions() {
  const rows = await adminRedemptions();
  return (
    <section className="rf-panel">
      <p className="rf-fine">
        Each request is {REFERRAL.redeemBlock} points = {inr(REFERRAL.rupeesPerBlock)} per block. Pay by UPI, then mark paid. Rejecting
        returns the points.
      </p>
      {rows.length === 0 ? (
        <p className="rf-empty">No redemption requests yet.</p>
      ) : (
        <div className="rf-table-wrap">
          <table className="rf-table">
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Points</th>
                <th>Pay</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.referrer}
                    <small>UPI: {r.upi ?? "not added yet"}</small>
                  </td>
                  <td>{r.points}</td>
                  <td>{inr(r.amountInr)}</td>
                  <td>
                    <span className={`rf-status rf-status-${r.status}`}>{r.status}</span>
                  </td>
                  <td>
                    {r.status === "requested" && (
                      <form action={setRedemptionAction} className="rf-inline">
                        <input type="hidden" name="id" value={r.id} />
                        <button name="status" value="paid" className="rf-btn rf-btn-mint rf-btn-sm">
                          Mark paid
                        </button>
                        <button name="status" value="rejected" className="rf-link">
                          Reject
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

async function Referrers() {
  const rows = await adminReferrers();
  return (
    <section className="rf-panel">
      {rows.length === 0 ? (
        <p className="rf-empty">Nobody has joined yet.</p>
      ) : (
        <div className="rf-table-wrap">
          <table className="rf-table">
            <thead>
              <tr>
                <th>Referrer</th>
                <th>Code</th>
                <th>Leads</th>
                <th>Clients</th>
                <th>Paid</th>
                <th>Pending</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.name ?? "(profile not finished)"}
                    <small>
                      {r.email} {r.phone ? `· +91 ${r.phone}` : ""}
                    </small>
                    <small>UPI: {r.upi ?? "—"} · joined {date(r.createdAt)}</small>
                  </td>
                  <td>{r.code}</td>
                  <td>{r.leads}</td>
                  <td>{r.won}</td>
                  <td>{inr(r.paid)}</td>
                  <td>{inr(r.pending)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
