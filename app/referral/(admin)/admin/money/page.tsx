import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/referral/auth";
import { REFERRAL, inr } from "@/lib/referral/config";
import { adminPayouts, adminRedemptions } from "@/lib/referral/data";
import { balances } from "@/lib/referral/stats";
import { setCommissionAction, setRedemptionAction } from "../actions";
import { PageHead, StatusChip } from "@/components/referral/adminui";
import { Card, Empty, Stat, fmtTime } from "@/components/referral/ui";

export const metadata: Metadata = { title: "Payouts" };

const LABEL: Record<string, string> = { pending: "To pay", paid: "Paid", reversed: "Cancelled", requested: "To pay", rejected: "Rejected" };

export default async function Money() {
  await requireAdmin();
  const [payouts, redemptions, b] = await Promise.all([adminPayouts(), adminRedemptions(), balances()]);

  return (
    <>
      <PageHead
        title="Payouts"
        help="Money you owe referrers. Pay them by UPI (their UPI ID is shown), then press “Mark as paid” so they see it on their dashboard."
      />

      <div className="ad-stats">
        <Stat label="Commission to pay" value={inr(b.commissionPending)} hint={`${b.commissionPendingCount} payments waiting`} tone="gold" />
        <Stat label="Commission paid" value={inr(b.commissionPaid)} hint="All time" tone="mint" />
        <Stat label="Points redemptions to pay" value={inr(b.requestedInr)} hint={`${b.requestedCount} requests`} tone="pink" />
        <Stat label="Points paid out" value={inr(b.redeemedInr)} hint="All time" tone="plain" />
      </div>

      <Card title="Commissions" help={`${REFERRAL.commissionPercent}% of each payment a referred client makes. Cancel one if that client's payment was refunded.`}>
        {payouts.length === 0 ? (
          <Empty>No commissions yet. They appear here when you add a client payment on the Leads page.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Pay to</th>
                <th>For</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((r) => (
                <tr key={r.id} className={r.status === "pending" ? "is-due" : ""}>
                  <td data-label="Pay to">
                    <Link href={`/referral/admin/referrers/${r.userId}`}>
                      <b>{r.referrer}</b>
                    </Link>
                    <small>UPI: {r.upi ?? <span className="ad-warn">not added yet</span>}</small>
                  </td>
                  <td data-label="For">
                    {r.note}
                    <small>{fmtTime(r.createdAt)}</small>
                  </td>
                  <td data-label="Amount">
                    <b>{inr(r.amount)}</b>
                  </td>
                  <td data-label="Status">
                    <StatusChip status={r.status} label={LABEL[r.status] ?? r.status} />
                  </td>
                  <td data-label="Action">
                    <form action={setCommissionAction} className="ad-inline">
                      <input type="hidden" name="id" value={r.id} />
                      {r.status === "pending" ? (
                        <>
                          <button name="status" value="paid" className="ad-btn ad-btn-sm ad-btn-primary">
                            Mark as paid
                          </button>
                          <button name="status" value="reversed" className="ad-link">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button name="status" value="pending" className="ad-link">
                          Undo
                        </button>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card
        title="Points redemptions"
        id="redemptions"
        help={`Referrers can swap every ${REFERRAL.redeemBlock.toLocaleString("en-IN")} points for ${inr(REFERRAL.rupeesPerBlock)}. Rejecting gives the points back.`}
      >
        {redemptions.length === 0 ? (
          <Empty>No redemption requests yet.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Pay to</th>
                <th>Points</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map((r) => (
                <tr key={r.id} className={r.status === "requested" ? "is-due" : ""}>
                  <td data-label="Pay to">
                    <b>{r.referrer}</b>
                    <small>UPI: {r.upi ?? <span className="ad-warn">not added yet</span>}</small>
                    <small>{fmtTime(r.createdAt)}</small>
                  </td>
                  <td data-label="Points">{r.points.toLocaleString("en-IN")}</td>
                  <td data-label="Amount">
                    <b>{inr(r.amountInr)}</b>
                  </td>
                  <td data-label="Status">
                    <StatusChip status={r.status === "requested" ? "pending" : r.status} label={LABEL[r.status] ?? r.status} />
                  </td>
                  <td data-label="Action">
                    {r.status === "requested" ? (
                      <form action={setRedemptionAction} className="ad-inline">
                        <input type="hidden" name="id" value={r.id} />
                        <button name="status" value="paid" className="ad-btn ad-btn-sm ad-btn-primary">
                          Mark as paid
                        </button>
                        <button name="status" value="rejected" className="ad-link">
                          Reject
                        </button>
                      </form>
                    ) : (
                      "—"
                    )}
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
