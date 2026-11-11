import type { Metadata } from "next";
import { requireUser } from "@/lib/referral/auth";
import { REFERRAL, STATUS_LABEL, inr } from "@/lib/referral/config";
import { balances, myLeads, myLedger, myRedemptions, usage } from "@/lib/referral/data";
import { SITE } from "@/lib/seo";
import { LeadForm, ProfileForm, RedeemButton, ShareBox } from "@/components/referral/DashboardForms";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const date = (t: number) => new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function Dashboard() {
  const user = await requireUser();
  const onboarding = !user.agreedAt || !user.name || !user.phone;

  if (onboarding) {
    return (
      <main className="rf-main rf-wrap rf-auth">
        <div className="rf-auth-card rf-auth-wide">
          <span className="rf-sticker rf-sticker-gold">Almost there</span>
          <h1 className="rf-h2">Tell us who you are.</h1>
          <p className="rf-p">We need your name and number to credit your referrals, and a UPI ID to pay you.</p>
          <ProfileForm name={user.name ?? ""} phone={user.phone ?? ""} upi={user.upi ?? ""} needsAgree={!user.agreedAt} />
        </div>
      </main>
    );
  }

  const [leads, ledger, b, u, redemptions] = await Promise.all([
    myLeads(user.id),
    myLedger(user.id),
    balances(user.id),
    usage(user.id),
    myRedemptions(user.id),
  ]);
  const won = leads.filter((l) => l.status === "won").length;
  const toNext = REFERRAL.redeemBlock - (b.pointsAvailable % REFERRAL.redeemBlock);
  const progress = Math.min(100, ((b.pointsAvailable % REFERRAL.redeemBlock) / REFERRAL.redeemBlock) * 100);
  const canRedeem = b.pointsAvailable >= REFERRAL.redeemBlock;
  const url = `${SITE.url}/r/${user.code}`;

  return (
    <main className="rf-main rf-wrap rf-dash">
      <div className="rf-dash-head">
        <div>
          <span className="rf-sticker rf-sticker-mint">Dashboard</span>
          <h1 className="rf-h2">Hi {user.name?.split(" ")[0]} 👋</h1>
        </div>
      </div>

      <div className="rf-stats">
        <div className="rf-stat rf-tone-gold">
          <span>Cash earned</span>
          <b>{inr(b.commissionPaid)}</b>
          <em>paid to you</em>
        </div>
        <div className="rf-stat rf-tone-pink">
          <span>On its way</span>
          <b>{inr(b.commissionPending)}</b>
          <em>pending payout</em>
        </div>
        <div className="rf-stat rf-tone-mint">
          <span>Points</span>
          <b>{b.pointsAvailable}</b>
          <em>{canRedeem ? "ready to redeem" : `${toNext} more to ${inr(REFERRAL.rupeesPerBlock)}`}</em>
          <span className="rf-bar" aria-hidden="true">
            <span style={{ width: `${canRedeem ? 100 : progress}%` }} />
          </span>
        </div>
        <div className="rf-stat rf-tone-lilac">
          <span>Referrals</span>
          <b>{leads.length}</b>
          <em>{won} became clients</em>
        </div>
      </div>

      <div className="rf-dash-grid">
        <section className="rf-panel">
          <h2 className="rf-h3">Your referral link</h2>
          <p className="rf-p">Anyone who opens this link and contacts us through the website is credited to you.</p>
          <ShareBox url={url} code={user.code} />
        </section>

        <section className="rf-panel">
          <div className="rf-panel-head">
            <h2 className="rf-h3">Refer someone</h2>
            <div className="rf-quota" aria-label="Sharing limits used">
              <span>
                Today {u.used.day}/{u.limits.day}
              </span>
              <span>
                Week {u.used.week}/{u.limits.week}
              </span>
              <span>
                Month {u.used.month}/{u.limits.month}
              </span>
            </div>
          </div>
          <LeadForm left={u.left} />
        </section>
      </div>

      <section className="rf-panel">
        <h2 className="rf-h3">Your referrals</h2>
        {leads.length === 0 ? (
          <p className="rf-empty">No referrals yet. Share your link or add someone above.</p>
        ) : (
          <div className="rf-table-wrap">
            <table className="rf-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Needs</th>
                  <th>Via</th>
                  <th>Added</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id}>
                    <td>
                      {l.name}
                      {l.company && <small>{l.company}</small>}
                    </td>
                    <td className="rf-clip">{l.need}</td>
                    <td>{l.source === "link" ? "Your link" : "Form"}</td>
                    <td>{date(l.createdAt)}</td>
                    <td>
                      <span className={`rf-status rf-status-${l.status}`}>{STATUS_LABEL[l.status]}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="rf-dash-grid">
        <section className="rf-panel">
          <h2 className="rf-h3">Rewards history</h2>
          {ledger.length === 0 ? (
            <p className="rf-empty">Rewards appear here when a referral becomes a paying client.</p>
          ) : (
            <ul className="rf-ledger">
              {ledger.map((e) => (
                <li key={e.id} className={e.status === "reversed" ? "is-void" : ""}>
                  <span>
                    {e.note}
                    <small>
                      {date(e.createdAt)} · {e.status}
                    </small>
                  </span>
                  <b>{e.kind === "commission" ? inr(e.amount) : `+${e.amount} pts`}</b>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rf-panel">
          <h2 className="rf-h3">Redeem points</h2>
          <p className="rf-p">
            {REFERRAL.redeemBlock.toLocaleString("en-IN")} points = {inr(REFERRAL.rupeesPerBlock)}, paid to your UPI ID. You have{" "}
            <b>{b.pointsAvailable}</b> points. Applicable taxes and charges are deducted as per rules.
          </p>
          <RedeemButton
            disabled={!canRedeem}
            label={canRedeem ? `Redeem ${Math.floor(b.pointsAvailable / REFERRAL.redeemBlock) * REFERRAL.redeemBlock} points` : `Need ${REFERRAL.redeemBlock} points`}
          />
          {redemptions.length > 0 && (
            <ul className="rf-ledger">
              {redemptions.map((r) => (
                <li key={r.id} className={r.status === "rejected" ? "is-void" : ""}>
                  <span>
                    {r.points} points
                    <small>
                      {date(r.createdAt)} · {r.status}
                    </small>
                  </span>
                  <b>{inr(r.amountInr)}</b>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rf-panel">
        <h2 className="rf-h3">Profile & payout</h2>
        <p className="rf-p">Logged in as {user.email}.</p>
        <ProfileForm name={user.name ?? ""} phone={user.phone ?? ""} upi={user.upi ?? ""} needsAgree={false} />
      </section>
    </main>
  );
}
