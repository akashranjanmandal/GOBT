/* Referral programme rules — the single place to change rates and limits.
   Everything on the landing page, terms, dashboard and admin reads these. */

export const REFERRAL = {
  /* cash: % of what the client actually pays us */
  commissionPercent: 5,
  /* points per referred customer who becomes a paying client
     (100 customers → 500 points) */
  pointsPerCustomer: 5,
  /* redemption: only in whole blocks of this many points… */
  redeemBlock: 1000,
  /* …each worth this many rupees (1000 points = ₹100) */
  rupeesPerBlock: 100,
  /* minimum cash payout */
  minPayout: 500,
  /* how long a referred lead stays yours */
  leadLockDays: 90,
  /* how many leads a referrer can submit by hand */
  limits: { day: 3, week: 10, month: 30 },
  /* where new leads are announced */
  salesInbox: "info@gobt.in",
} as const;

/* set by gobt.in/r/CODE; read by the contact form API */
export const REF_COOKIE = "gobt_ref";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "rejected"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "Submitted",
  contacted: "We called them",
  qualified: "Talking business",
  won: "Became a client",
  rejected: "Didn't go ahead",
};

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const pointsToRupees = (points: number) =>
  Math.floor(points / REFERRAL.redeemBlock) * REFERRAL.rupeesPerBlock;
