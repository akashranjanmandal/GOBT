import type { Metadata } from "next";
import Link from "next/link";
import { CLIENTS } from "@/lib/content";
import { SERVICE_PAGES, SITE, faqLd, jsonLd } from "@/lib/seo";
import { REFERRAL, inr } from "@/lib/referral/config";
import Calculator from "@/components/referral/Calculator";

const DESCRIPTION = `Join the GOBT Referral Program: refer businesses that need a website, app, AI or custom software and earn ${REFERRAL.commissionPercent}% of the project value. Free to join, paid by UPI.`;

export const metadata: Metadata = {
  title: { absolute: "GOBT Referral Program — Earn 5% for Every Client You Refer" },
  description: DESCRIPTION,
  alternates: { canonical: "/referral" },
  openGraph: { type: "website", locale: "en_IN", url: "/referral", siteName: SITE.name, title: "GOBT Referral Program", description: DESCRIPTION },
};

const { commissionPercent: pct, pointsPerCustomer: ppc, redeemBlock, rupeesPerBlock, limits, leadLockDays } = REFERRAL;

const FAQS = [
  { q: "Who can join?", a: "Anyone in India aged 18 or over with a UPI ID. Students, freelancers, shop owners, teachers, CAs, anyone who knows people who need software." },
  { q: "Do I need to sell anything?", a: "No. You just introduce us. Our team does the calls, proposals and the work. You only share contacts of people who actually need something built." },
  { q: `How is the ${pct}% calculated?`, a: `On the money the client actually pays us, for the project you referred. If they pay in parts, you earn ${pct}% of each part as it clears.` },
  { q: "When do I get paid?", a: `Commission is paid by UPI after the client's payment clears, usually within the month. The minimum payout is ${inr(REFERRAL.minPayout)}. Applicable taxes and charges (such as TDS) are deducted as per rules.` },
  { q: "What are points for?", a: `Every referral that becomes a paying client also earns ${ppc} points. Once you have ${redeemBlock.toLocaleString("en-IN")} points you can redeem them for ${inr(rupeesPerBlock)}.` },
  { q: "Why are there sharing limits?", a: `To keep leads genuine: up to ${limits.day} a day, ${limits.week} a week and ${limits.month} a month. Quality beats quantity, and only real clients earn.` },
  { q: "What if someone else already referred the same person?", a: `The first person to register a lead keeps it for ${leadLockDays} days. You'll see straight away if a contact is already taken.` },
];

const STEPS = [
  { n: "01", t: "Join free", d: "Sign up with your email in 30 seconds. You get your own referral link and code.", tone: "gold" },
  { n: "02", t: "Share & refer", d: "Send your link to people who need a website, app or software, or add their details yourself.", tone: "mint" },
  { n: "03", t: "We do the work", d: "Our team calls them, scopes the project and builds it. You track every step on your dashboard.", tone: "lilac" },
  { n: "04", t: "You get paid", d: `When they pay us, you earn ${pct}% straight to your UPI. Plus points for every new client.`, tone: "pink" },
];

export default function ReferralHome() {
  return (
    <main className="rf-main">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqLd(FAQS)) }} />

      {/* ── hero ── */}
      <section className="rf-hero rf-wrap">
        <div className="rf-hero-copy">
          <span className="rf-sticker rf-sticker-gold">★ GOBT Partner Program</span>
          <h1 className="rf-h1">
            Share GOBT.
            <br />
            Earn <span className="rf-mark">{pct}%</span>
            <br />
            of every project.
          </h1>
          <p className="rf-lede">
            Know a shop, school, startup or business that needs a website, app, AI or custom software? Introduce them to us. When they
            become a client, you get paid.
          </p>
          <div className="rf-ctas">
            <Link href="/referral/login" className="rf-btn rf-btn-gold rf-btn-lg">
              Start earning, it&apos;s free →
            </Link>
            <a href="#how" className="rf-btn rf-btn-ghost rf-btn-lg">
              How it works
            </a>
          </div>
          <ul className="rf-trust">
            <li>✓ Free to join</li>
            <li>✓ Paid by UPI</li>
            <li>✓ No selling needed</li>
          </ul>
        </div>

        <div className="rf-hero-art" aria-hidden="true">
          <div className="rf-card-float rf-pay">
            <span className="rf-pay-label">Payout sent</span>
            <span className="rf-pay-amt">+{inr(3000)}</span>
            <span className="rf-pay-sub">{pct}% of a {inr(60000)} website</span>
          </div>
          <div className="rf-card-float rf-chat">
            <span>My cousin needs an app for his shop! 📱</span>
          </div>
          <div className="rf-card-float rf-coin">+{ppc} pts</div>
          <div className="rf-card-float rf-star">✦</div>
          <div className="rf-card-float rf-ref">
            <span className="rf-ref-label">Your link</span>
            <span className="rf-ref-url">gobt.in/r/RIYA4821</span>
          </div>
        </div>
      </section>

      {/* ── marquee ── */}
      <div className="rf-marquee" aria-hidden="true">
        <div className="rf-marquee-track">
          {Array.from({ length: 2 }, (_, k) => (
            <span key={k}>
              {SERVICE_PAGES.map((s) => (
                <span key={s.slug}>
                  {s.name} <b>✦</b>{" "}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── how it works ── */}
      <section className="rf-section rf-wrap" id="how">
        <span className="rf-sticker rf-sticker-mint">How it works</span>
        <h2 className="rf-h2">Four steps. Zero selling.</h2>
        <ol className="rf-steps">
          {STEPS.map((s) => (
            <li className={`rf-step rf-tone-${s.tone}`} key={s.n}>
              <span className="rf-step-n">{s.n}</span>
              <h3>{s.t}</h3>
              <p>{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── rewards ── */}
      <section className="rf-section rf-wrap" id="rewards">
        <span className="rf-sticker rf-sticker-pink">Rewards</span>
        <h2 className="rf-h2">Real money for real introductions.</h2>
        <div className="rf-rewards">
          <div className="rf-tier rf-tone-gold">
            <span className="rf-tier-tag">Cash</span>
            <span className="rf-tier-big">{pct}%</span>
            <p>of the project value, on every payment the client makes. Refer a {inr(100000)} project, earn {inr(100000 * pct / 100)}.</p>
          </div>
          <div className="rf-tier rf-tone-mint">
            <span className="rf-tier-tag">Points</span>
            <span className="rf-tier-big">+{ppc}</span>
            <p>points for every referral who becomes a paying client. {ppc * 100} points for 100 clients.</p>
          </div>
          <div className="rf-tier rf-tone-lilac">
            <span className="rf-tier-tag">Redeem</span>
            <span className="rf-tier-big">{redeemBlock.toLocaleString("en-IN")}</span>
            <p>points = {inr(rupeesPerBlock)}, paid to your UPI. Redeem in blocks of {redeemBlock.toLocaleString("en-IN")} points.</p>
          </div>
        </div>
        <Calculator />
      </section>

      {/* ── what to refer ── */}
      <section className="rf-section rf-wrap">
        <span className="rf-sticker rf-sticker-gold">What can you refer?</span>
        <h2 className="rf-h2">Anyone who needs something built.</h2>
        <ul className="rf-chips">
          {SERVICE_PAGES.map((s, i) => (
            <li key={s.slug} className={`rf-chip rf-chip-${i % 4}`}>
              {s.name}
            </li>
          ))}
        </ul>
      </section>

      {/* ── limits + rules ── */}
      <section className="rf-section rf-wrap rf-two">
        <div>
          <span className="rf-sticker rf-sticker-mint">Sharing limits</span>
          <h2 className="rf-h2">Quality over quantity.</h2>
          <p className="rf-p">You can submit up to this many leads by hand. Only genuine contacts who need software, please.</p>
          <div className="rf-limits">
            <div>
              <b>{limits.day}</b>
              <span>per day</span>
            </div>
            <div>
              <b>{limits.week}</b>
              <span>per week</span>
            </div>
            <div>
              <b>{limits.month}</b>
              <span>per month</span>
            </div>
          </div>
        </div>
        <div>
          <span className="rf-sticker rf-sticker-pink">The rules</span>
          <h2 className="rf-h2">Keep it fair.</h2>
          <ul className="rf-rules">
            <li className="yes">Refer people you actually know, with their permission</li>
            <li className="yes">First to register a lead keeps it for {leadLockDays} days</li>
            <li className="yes">Rewards only when the client pays us</li>
            <li className="no">No self-referrals or fake leads</li>
            <li className="no">No spam, cold messaging strangers or false promises</li>
            <li className="no">Points can&apos;t be bought, sold or transferred</li>
          </ul>
          <Link href="/referral/terms" className="rf-more">
            Read the full program rules →
          </Link>
        </div>
      </section>

      {/* ── clients ── */}
      <section className="rf-section rf-wrap">
        <span className="rf-sticker rf-sticker-lilac">Who you&apos;re recommending</span>
        <h2 className="rf-h2">Businesses we&apos;ve built for.</h2>
        <ul className="rf-logos">
          {CLIENTS.map((c) => (
            <li key={c.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.logo} alt={c.name} loading="lazy" />
            </li>
          ))}
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section className="rf-section rf-wrap" id="faq">
        <span className="rf-sticker rf-sticker-gold">FAQ</span>
        <h2 className="rf-h2">Questions? Answered.</h2>
        <div className="rf-faq">
          {FAQS.map((f) => (
            <details key={f.q}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="rf-wrap">
        <div className="rf-cta">
          <h2>Got someone in mind?</h2>
          <p>Join in 30 seconds and send your first referral today.</p>
          <Link href="/referral/login" className="rf-btn rf-btn-dark rf-btn-lg">
            Join the program →
          </Link>
        </div>
      </section>
    </main>
  );
}
