import type { Metadata } from "next";
import { requireUser } from "@/lib/referral/auth";
import { channelLabel } from "@/lib/referral/channels";
import { REFERRAL, inr, type LeadStatus } from "@/lib/referral/config";
import { myLeads, myLedger, myRedemptions, usage } from "@/lib/referral/data";
import { balances, channelReport, dailySeries, recentClicks, totals } from "@/lib/referral/stats";
import { SITE } from "@/lib/seo";
import { LeadForm, ProfileForm, RedeemButton, ShareBox } from "@/components/referral/DashboardForms";
import { BarChart, Card, Empty, Stat, ago, fmtDate, fmtTime, plural } from "@/components/referral/ui";

export const metadata: Metadata = { title: "My dashboard", robots: { index: false } };

/* the four steps a referral goes through, as the referrer sees them */
const STEPS: { status: LeadStatus; label: string }[] = [
  { status: "new", label: "Submitted" },
  { status: "contacted", label: "We called" },
  { status: "qualified", label: "Talking" },
  { status: "won", label: "Client!" },
];

export default async function Dashboard() {
  const user = await requireUser();

  if (!user.agreedAt || !user.name || !user.phone) {
    return (
      <main className="rf-main rf-wrap rf-auth">
        <div className="rf-auth-card rf-auth-wide">
          <span className="rf-sticker rf-sticker-gold">Almost there</span>
          <h1 className="rf-h2">Tell us who you are.</h1>
          <p className="rf-p">We need your name and number to credit your referrals, and a UPI ID so we can pay you.</p>
          <ProfileForm name={user.name ?? ""} phone={user.phone ?? ""} upi={user.upi ?? ""} needsAgree={!user.agreedAt} />
        </div>
      </main>
    );
  }

  const [leads, ledger, redemptions, bal, all, clicksSeries, sharesSeries, channels, visits, quota] = await Promise.all([
    myLeads(user.id),
    myLedger(user.id),
    myRedemptions(user.id),
    balances(user.id),
    totals(0, user.id),
    dailySeries("clicks", 30, user.id),
    dailySeries("shares", 30, user.id),
    channelReport(0, user.id),
    recentClicks(8, user.id),
    usage(user.id),
  ]);

  const url = `${SITE.url}/r/${user.code}`;
  const first = user.name.split(" ")[0];
  const canRedeem = bal.pointsAvailable >= REFERRAL.redeemBlock;
  const toNext = REFERRAL.redeemBlock - (bal.pointsAvailable % REFERRAL.redeemBlock);
  const progress = canRedeem ? 100 : Math.round(((bal.pointsAvailable % REFERRAL.redeemBlock) / REFERRAL.redeemBlock) * 100);

  /* money and points that belong to each referral */
  const perLead = new Map<number, { cash: number; points: number }>();
  for (const e of ledger) {
    if (e.leadId == null || e.status === "reversed") continue;
    const x = perLead.get(e.leadId) ?? { cash: 0, points: 0 };
    if (e.kind === "commission") x.cash += e.amount;
    else x.points += e.amount;
    perLead.set(e.leadId, x);
  }

  const todo = [
    { done: true, text: "Create your account" },
    { done: !!user.upi, text: "Add your UPI ID so we can pay you", href: "#profile" },
    { done: all.shares > 0 || all.clicks > 0, text: "Share your link with someone", href: "#share" },
    { done: leads.length > 0, text: "Send your first referral", href: "#refer" },
  ];
  const doneCount = todo.filter((t) => t.done).length;

  return (
    <main className="rf-main rf-wrap ud">
      <div className="ud-hello">
        <div>
          <span className="rf-sticker rf-sticker-mint">My dashboard</span>
          <h1 className="rf-h2">Hi {first} 👋</h1>
          <p className="rf-p">
            Share GOBT with people who need a website, app or software. When they become a client, you earn <b>{REFERRAL.commissionPercent}%</b> of
            what they pay us.
          </p>
        </div>
      </div>

      <nav className="ud-nav" aria-label="Jump to a section">
        <a href="#overview">Overview</a>
        <a href="#share">Share</a>
        <a href="#refer">Refer someone</a>
        <a href="#referrals">My referrals</a>
        <a href="#earnings">Earnings</a>
        <a href="#profile">Profile</a>
      </nav>

      {doneCount < todo.length && (
        <section className="ud-todo" aria-label="Getting started">
          <h2 className="rf-h3">
            Getting started <small>{doneCount} of {todo.length} done</small>
          </h2>
          <ul>
            {todo.map((t) => (
              <li key={t.text} className={t.done ? "is-done" : ""}>
                <span aria-hidden="true">{t.done ? "✓" : "○"}</span>
                {t.done || !t.href ? t.text : <a href={t.href}>{t.text}</a>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Card title="Your numbers" id="overview" help="Everything so far, in plain words.">
        <div className="ud-stats">
          <Stat label="People who opened your link" value={all.clicks} hint={`${plural(all.visitors, "different person", "different people")}`} tone="gold" />
          <Stat label="Times you shared" value={all.shares} hint="Taps on the share buttons" tone="lilac" />
          <Stat label="People you referred" value={all.leads} hint={`${all.won} became ${all.won === 1 ? "a client" : "clients"}`} tone="pink" />
          <Stat label="Money paid to you" value={inr(bal.commissionPaid)} hint={bal.commissionPending ? `${inr(bal.commissionPending)} on its way` : "Nothing waiting yet"} tone="mint" />
        </div>
        <div className="ud-charts">
          <BarChart data={clicksSeries} label="People who opened your link (last 30 days)" tone="gold" />
          <BarChart data={sharesSeries} label="Times you shared (last 30 days)" tone="lilac" />
        </div>
      </Card>

      <Card
        title="Share your link"
        id="share"
        help="Anyone who opens your link and then contacts GOBT is counted as your referral for 90 days."
      >
        <ShareBox url={url} code={user.code} />
      </Card>

      <Card title="Where your shares worked" help="Shows each place you shared, how many people opened it, and how many became referrals.">
        {channels.length === 0 ? (
          <Empty>Nothing to show yet. Share your link above and this fills in as people open it.</Empty>
        ) : (
          <table className="rt">
            <thead>
              <tr>
                <th>Where</th>
                <th>You shared</th>
                <th>People opened</th>
                <th>Became referrals</th>
                <th>Became clients</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((c) => (
                <tr key={c.channel || "direct"}>
                  <td data-label="Where">{c.label}</td>
                  <td data-label="You shared">{c.shares}</td>
                  <td data-label="People opened">{c.clicks}</td>
                  <td data-label="Became referrals">{c.leads}</td>
                  <td data-label="Became clients">{c.won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {visits.length > 0 && (
          <>
            <h3 className="rf-h3 cd-sub">Latest people to open your link</h3>
            <ul className="ud-visits">
              {visits.map((v) => (
                <li key={v.id}>
                  <b>{ago(v.at)}</b>
                  <span>
                    {channelLabel(v.channel)}
                    {v.place ? ` · ${v.place}` : ""} · {v.device ?? "device unknown"}
                    {v.isNew ? " · first visit" : ""}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>

      <Card
        title="Refer someone directly"
        id="refer"
        help="Know someone who needs software? Add their details and we'll contact them."
        action={
          <div className="rf-quota" aria-label="How many you can still add">
            <span>Today {quota.used.day}/{quota.limits.day}</span>
            <span>This week {quota.used.week}/{quota.limits.week}</span>
            <span>This month {quota.used.month}/{quota.limits.month}</span>
          </div>
        }
      >
        <LeadForm left={quota.left} />
      </Card>

      <Card title="My referrals" id="referrals" help="Follow each person from the moment you refer them until they become a client.">
        {leads.length === 0 ? (
          <Empty>No referrals yet. Share your link or add someone above.</Empty>
        ) : (
          <ul className="ud-leads">
            {leads.map((l) => {
              const step = l.status === "rejected" ? -1 : STEPS.findIndex((s) => s.status === l.status);
              const money = perLead.get(l.id);
              return (
                <li key={l.id} className="ud-lead">
                  <div className="ud-lead-top">
                    <div>
                      <b>{l.name}</b>
                      {l.company && <small>{l.company}</small>}
                    </div>
                    <span className="ud-lead-date">
                      {fmtDate(l.createdAt)} · {l.source === "link" ? `via your link${l.channel ? ` (${channelLabel(l.channel)})` : ""}` : "added by you"}
                    </span>
                  </div>
                  <p className="ud-lead-need">{l.need}</p>
                  {l.status === "rejected" ? (
                    <p className="ud-lead-out">This one didn&apos;t go ahead. Thanks for trying, keep referring!</p>
                  ) : (
                    <ol className="ud-steps" aria-label="Progress">
                      {STEPS.map((s, i) => (
                        <li key={s.status} className={i < step ? "is-done" : i === step ? "is-now" : ""}>
                          <span aria-hidden="true">{i < step || (i === step && s.status === "won") ? "✓" : i + 1}</span>
                          {s.label}
                        </li>
                      ))}
                    </ol>
                  )}
                  {money && (money.cash > 0 || money.points > 0) && (
                    <p className="ud-lead-money">
                      You earned {money.cash > 0 && <b>{inr(money.cash)}</b>}
                      {money.cash > 0 && money.points > 0 && " and "}
                      {money.points > 0 && <b>{money.points} points</b>} from this referral.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title="Earnings and points" id="earnings" help="How you get paid, what's on its way and what you've already received.">
        <ol className="ud-how">
          <li>
            <b>1</b> Your referral becomes a client
          </li>
          <li>
            <b>2</b> They pay GOBT
          </li>
          <li>
            <b>3</b> You get {REFERRAL.commissionPercent}% by UPI (plus {REFERRAL.pointsPerCustomer} points)
          </li>
        </ol>

        <div className="ud-stats">
          <Stat label="Paid to you" value={inr(bal.commissionPaid)} hint="Already sent to your UPI" tone="mint" />
          <Stat label="On its way" value={inr(bal.commissionPending)} hint="Waiting for us to pay it" tone="pink" />
          <Stat label="Your points" value={bal.pointsAvailable} hint={canRedeem ? "Ready to redeem" : `${toNext} more for ${inr(REFERRAL.rupeesPerBlock)}`} tone="gold" />
        </div>

        <div className="ud-redeem">
          <div className="ud-redeem-bar" aria-hidden="true">
            <span style={{ width: `${progress}%` }} />
          </div>
          <p className="rf-p">
            {REFERRAL.redeemBlock.toLocaleString("en-IN")} points = {inr(REFERRAL.rupeesPerBlock)}, paid to your UPI ID.{" "}
            {canRedeem ? "You can redeem now." : `Keep going: ${toNext} points to your first redemption.`}
          </p>
          <RedeemButton
            disabled={!canRedeem}
            label={canRedeem ? `Redeem ${Math.floor(bal.pointsAvailable / REFERRAL.redeemBlock) * REFERRAL.redeemBlock} points` : `Need ${REFERRAL.redeemBlock.toLocaleString("en-IN")} points`}
          />
          <p className="rf-fine">Applicable taxes and charges are deducted as per rules.</p>
        </div>

        <h3 className="rf-h3 cd-sub">History</h3>
        {ledger.length === 0 && redemptions.length === 0 ? (
          <Empty>Your rewards appear here when a referral becomes a paying client.</Empty>
        ) : (
          <ul className="ud-ledger">
            {ledger.map((e) => (
              <li key={`e${e.id}`} className={e.status === "reversed" ? "is-void" : ""}>
                <span>
                  {e.note}
                  <small>
                    {fmtTime(e.createdAt)} · {e.kind === "commission" ? (e.status === "paid" ? "Paid to you" : e.status === "pending" ? "On its way" : "Cancelled") : e.status === "reversed" ? "Cancelled" : "Points added"}
                  </small>
                </span>
                <b>{e.kind === "commission" ? inr(e.amount) : `+${e.amount} pts`}</b>
              </li>
            ))}
            {redemptions.map((r) => (
              <li key={`r${r.id}`} className={r.status === "rejected" ? "is-void" : ""}>
                <span>
                  Redeemed {r.points} points
                  <small>
                    {fmtTime(r.createdAt)} · {r.status === "paid" ? "Paid to you" : r.status === "requested" ? "Requested, we'll pay it soon" : "Not approved, points returned"}
                  </small>
                </span>
                <b>{inr(r.amountInr)}</b>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="My profile and payout details" id="profile" help={`Logged in as ${user.email}. Joined ${fmtDate(user.createdAt)}.`}>
        <ProfileForm name={user.name ?? ""} phone={user.phone ?? ""} upi={user.upi ?? ""} needsAgree={false} />
      </Card>
    </main>
  );
}
