import type { Metadata } from "next";
import Link from "next/link";
import { REFERRAL, inr } from "@/lib/referral/config";
import { CONTACT } from "@/lib/content";

export const metadata: Metadata = {
  title: "Program rules",
  description: "Rules and terms of the GOBT Referral Program: rewards, limits, payouts and fair use.",
  alternates: { canonical: "/referral/terms" },
};

const { commissionPercent: pct, pointsPerCustomer, redeemBlock, rupeesPerBlock, minPayout, leadLockDays, limits } = REFERRAL;

export default function Terms() {
  return (
    <main className="rf-main rf-wrap rf-terms">
      <span className="rf-sticker rf-sticker-gold">Program rules</span>
      <h1 className="rf-h2">GOBT Referral Program rules</h1>
      <p className="rf-fine">Last updated: 10 November 2026</p>

      <h2>1. Who can join</h2>
      <p>Anyone in India aged 18 or over with a valid mobile number and UPI ID. GOBT employees and their immediate family can&apos;t earn rewards.</p>

      <h2>2. What counts as a referral</h2>
      <p>
        A referral is a person or business you introduce to GOBT, either by submitting their details on your dashboard or when they contact us
        through the website after opening your referral link. You must know them, and they must be happy for us to contact them.
      </p>
      <p>
        The first referrer to register a person keeps them for {leadLockDays} days. If someone is already in our pipeline, nobody earns a
        reward for them.
      </p>

      <h2>3. Rewards</h2>
      <ul>
        <li>
          <b>Cash:</b> {pct}% of the money the referred client actually pays GOBT for their project. If they pay in parts, you earn on each
          part after it clears.
        </li>
        <li>
          <b>Points:</b> {pointsPerCustomer} points for each referral who becomes a paying client.
        </li>
        <li>
          <b>Redeeming points:</b> in blocks of {redeemBlock.toLocaleString("en-IN")} points, each worth {inr(rupeesPerBlock)}. Points can&apos;t
          be bought, sold or transferred, and have no other cash value.
        </li>
      </ul>

      <h2>4. Payouts</h2>
      <p>
        We pay by UPI to the ID on your profile, usually within the month after the client&apos;s payment clears. Commission below{" "}
        {inr(minPayout)} rolls over to the next payout. If a client&apos;s payment is refunded or reversed, the matching commission is cancelled.
        Tax may be deducted where the law requires it, and we may ask for your PAN.
      </p>

      <h2>5. Sharing limits</h2>
      <p>
        You can submit up to {limits.day} referrals a day, {limits.week} a week and {limits.month} a month from your dashboard. We may change these
        limits.
      </p>

      <h2>6. Fair use</h2>
      <ul>
        <li>No self-referrals, fake details or referring the same person under different names.</li>
        <li>No spam, cold messages to strangers, paid ads using the GOBT name, or promises on our behalf (prices, timelines, discounts).</li>
        <li>Only one account per person.</li>
      </ul>
      <p>If we find abuse, we can cancel rewards and close the account.</p>

      <h2>7. Changes</h2>
      <p>
        We may change or end the program, including reward rates, by updating this page. Rewards you&apos;ve already earned under the old rules
        are honoured.
      </p>

      <h2>8. Contact</h2>
      <p>
        Questions: <a href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>. See also our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </main>
  );
}
