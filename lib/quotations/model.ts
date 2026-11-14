/* Quotations: the data an admin fills in, the defaults taken from GOBT's
   own quotations, and every calculation (discount, GST, milestones, EMI).
   Shared by the admin form (live totals) and the PDF, so they always agree.
   Money is calculated in paise (whole numbers) so totals never drift. */

export type PaymentMode = "terms" | "emi" | "both";
export type DiscountType = "none" | "percent" | "amount";

import { cleanDoc, docIsEmpty, docMeta, type DocNode } from "./doc";

export type QuoteItem = { module: string; details: string; amount: number };

/* saved signatures and stamps (see lib/quotations/marks.ts) */
export type MarkKind = "signature" | "stamp";
export type MarkInfo = { id: string; kind: MarkKind; name: string; builtIn: boolean; hidden: boolean; createdBy?: string; createdAt?: number };
/* where the stamp goes */
export type StampPlace = "beside" | "over" | "corner" | "every";
export const STAMP_PLACES: { id: StampPlace; label: string }[] = [
  { id: "beside", label: "Beside the signature" },
  { id: "over", label: "Over the signature" },
  { id: "corner", label: "Bottom-right of the last page" },
  { id: "every", label: "Bottom-right of every page" },
];
/* "" means none */
export type QuoteSign = { signature: string; stamp: string; place: StampPlace };
export const DEFAULT_SIGN: QuoteSign = { signature: "default-signature", stamp: "default-stamp", place: "beside" };
export const MARK_NODE = "quoteMark";
/* where the admin screens load a saved signature/stamp image from */
export const markSrc = (id: string) => `/api/referral/admin/quotations/marks/${encodeURIComponent(id)}`;
export type QuoteSection = { heading: string; body: string };
export type Milestone = { name: string; percent: number };

export type QuoteData = {
  date: string; // YYYY-MM-DD
  to: string; // one line each; **bold** allowed
  subject: string;
  salutation: string;
  intro: string; // paragraphs separated by a blank line
  sections: QuoteSection[]; // extra sections (e.g. design analysis); "- " lines are bullets
  items: QuoteItem[];
  discount: { type: DiscountType; value: number };
  gstRate: number;
  payment: PaymentMode;
  milestones: Milestone[];
  emi: { downPercent: number; months: number; chargePercent: number };
  paymentTerms: string; // one per line
  inclusions: string; // one per line
  exclusions: string; // one per line
  assumptions: string; // one per line
  terms: string; // one per line, "Heading: text"
  closing: string;
  /* legacy on/off switch; `sign` says which signature and stamp to print */
  signature: boolean;
  sign: QuoteSign;
  /* "doc": written in the Word-like editor; the text lives in `doc` and only
     the prices (items, discount, GST, payment) come from the fields above */
  mode?: "form" | "doc";
  doc?: DocNode;
  /* optional name to show in the list instead of the one read from "To," */
  listName?: string;
};

/* the client's name and subject for the list and the dashboard */
export function quoteClient(q: QuoteData) {
  if (q.listName?.trim()) return q.listName.trim().slice(0, 160);
  if (q.mode === "doc") return docMeta(q.doc).client || "Client";
  const ls = lines(q.to);
  const bold = ls.map((l) => l.match(/\*\*([^*]+)\*\*/)?.[1]).find(Boolean);
  const plain = ls.find((l) => !/^(the\s+)?(concerned\s+authority|to|sir|madam)\b/i.test(l.replace(/\*\*/g, ""))) ?? ls[0] ?? "";
  return (bold ?? plain).replace(/\*\*/g, "").replace(/,\s*$/, "").trim().slice(0, 160);
}
export function quoteSubject(q: QuoteData) {
  return (q.mode === "doc" ? docMeta(q.doc).subject : q.subject.trim()).slice(0, 300);
}

export const QUOTE_STATUSES = [
  { id: "sent", label: "Sent" },
  { id: "accepted", label: "Accepted" },
  { id: "declined", label: "Declined" },
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]["id"];

export const SIGNATORY = { name: "Suprime Mandal", title: "CEO, GOBT", phone: "+91 89722 97093", email: "info@gobt.in" };

/* ── defaults from GOBT's quotations ── */

export const DEFAULT_INTRO = `**Group of Blooming Technicians** (GOBT) is a comprehensive digital transformation company offering end-to-end IT solutions spanning digital presence, AI-powered business solutions, cloud infrastructure, robotics & IoT, and allied technology services. With a proven track record across India, GOBT delivers enterprise-grade hardware provisioning, network infrastructure, cybersecurity solutions, and annual maintenance contracts tailored to businesses of all scales. Our commitment to quality service, timely delivery, and competitive pricing makes us a trusted technology partner for organizations seeking reliable IT support.

We thank you for providing GOBT the opportunity to submit this quotation and for allowing us to support your organization in transforming its operations to align with the evolving digital era.`;

export const DEFAULT_CLOSING =
  "We look forward to building a long-term strategic partnership, serving as a quintessential technology and digital transformation partner to drive operational efficiency, enable smarter workflows, and create a scalable digital foundation for sustained business growth.";

export const DEFAULT_PAYMENT_TERMS = [
  "Development milestones will proceed according to the mutually agreed project scope and requirements.",
  "Any feature or functionality outside the approved SOW shall be evaluated and quoted separately.",
].join("\n");

export const EMI_PAYMENT_TERM = "EMI instalments are due on the same date every month; work continues as long as instalments are paid on time.";

export const DEFAULT_EXCLUSIONS = [
  "Cloud Hosting / Server Charges",
  "Domain Registration & Renewal",
  "Payment Gateway Transaction / Processing Charges",
  "SMS / WhatsApp / Email Service Charges",
  "Other Third-Party Software / Subscription Charges",
].join("\n");

export const DEFAULT_ASSUMPTIONS = [
  "The client will provide required product information, images, pricing and business-related content.",
  "Third-party accounts and services required for deployment or operation will be provided and maintained by the client.",
  "Any major change in the approved scope or addition of new modules may attract additional development charges.",
].join("\n");

export const DEFAULT_TERMS = [
  "Basic Support & Maintenance: 1 year of basic technical support and maintenance will be provided, including bug fixing, minor technical corrections and reasonable assistance related to the delivered system. Any additional requirements beyond the scope mentioned above will be quoted separately.",
  "System Reliability: Reasonable efforts will be made to maintain system availability and minimize downtime. Any downtime caused by third-party services, hosting providers or circumstances beyond reasonable control will be excluded.",
  "Security & Maintenance Checks: Periodic basic security and system health checks will be carried out during the included support period to identify common issues and maintain system stability.",
  "Validity: This quotation is valid for 30 days from the date of sharing.",
].join("\n");

export const DEFAULT_MILESTONES: Milestone[] = [
  { name: "Project Initiation & Advance", percent: 40 },
  { name: "Core Development Completion", percent: 30 },
  { name: "Final Testing, Deployment & Handover", percent: 30 },
];

/* one-click modules for the scope table */
export const MODULE_PRESETS: QuoteItem[] = [
  { module: "UI/UX Design", details: "Modern, responsive and user-friendly interface design for the customer application and admin panel, aligned with the business and brand.", amount: 10000 },
  { module: "Frontend Development", details: "Fully responsive development of all approved pages, cross-device compatibility, optimized page speed, interactive elements and enquiry forms.", amount: 20000 },
  { module: "Customer Mobile Application", details: "User registration/login, profile, home screen, categories, product listing, product details, search and customer-side application functionality.", amount: 40000 },
  { module: "Customer E-Commerce Website", details: "Home page, navigation, product categories, product listing, product details, search, customer registration/login, profile and responsive web experience.", amount: 15000 },
  { module: "Backend Development", details: "Backend architecture, database, APIs, authentication, business logic and integration between the customer application and admin panel.", amount: 10000 },
  { module: "Admin Panel", details: "Admin dashboard, customer management, product and category management, pricing, inventory and operational controls.", amount: 20000 },
  { module: "Cart & Order Management", details: "Add/remove products, quantity management, cart summary, price calculation, checkout workflow, order placement, order confirmation, order status management and order history.", amount: 10000 },
  { module: "Payment Integration", details: "Integration of a suitable online payment gateway and payment workflow for customer checkout.", amount: 5000 },
  { module: "Technical SEO", details: "On-page and technical SEO, keyword optimization, metadata, schema, sitemap, indexing and page-speed optimization.", amount: 14000 },
  { module: "Hosting & Deployment", details: "Secure hosting setup, domain configuration, SSL and full deployment.", amount: 8000 },
  { module: "Testing & Deployment Assistance", details: "Functional testing, bug fixing within the agreed scope and deployment assistance.", amount: 5000 },
  { module: "Maintenance Support", details: "Ongoing basic maintenance and technical support provided free of cost for the 1st year.", amount: 0 },
];

export function blankQuote(date: string): QuoteData {
  return {
    date,
    to: "",
    subject: "Quotation for ",
    salutation: "Dear Sir/Madam,",
    intro: DEFAULT_INTRO,
    sections: [],
    items: [{ module: "", details: "", amount: 0 }],
    discount: { type: "none", value: 0 },
    gstRate: 18,
    payment: "terms",
    milestones: DEFAULT_MILESTONES.map((m) => ({ ...m })),
    emi: { downPercent: 20, months: 6, chargePercent: 0 },
    paymentTerms: DEFAULT_PAYMENT_TERMS,
    inclusions: "",
    exclusions: DEFAULT_EXCLUSIONS,
    assumptions: DEFAULT_ASSUMPTIONS,
    terms: DEFAULT_TERMS,
    closing: DEFAULT_CLOSING,
    signature: true,
    sign: { ...DEFAULT_SIGN },
  };
}

/* ── numbers and words ── */

export const toPaise = (rupees: number) => Math.round((Number(rupees) || 0) * 100);

/* 12213000 paise → "₹1,22,130"; 2208960 → "₹22,089.60" */
export function inr(paise: number, opts: { symbol?: boolean } = {}) {
  const neg = paise < 0;
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const ps = abs % 100;
  const s = String(rupees);
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ",");
  const body = (rest ? `${rest},${last3}` : last3) + (ps ? `.${String(ps).padStart(2, "0")}` : "");
  return `${neg ? "−" : ""}${opts.symbol === false ? "" : "₹"}${body}`;
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const twoDigits = (n: number) => (n < 20 ? ONES[n] : `${TENS[Math.floor(n / 10)]}${n % 10 ? ` ${ONES[n % 10]}` : ""}`);
const threeDigits = (n: number) => {
  const h = Math.floor(n / 100);
  const r = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", r ? (h ? `and ${twoDigits(r)}` : twoDigits(r)) : ""].filter(Boolean).join(" ");
};

/* Indian numbering: crore, lakh, thousand */
function numberWords(n: number): string {
  if (n === 0) return "Zero";
  const crore = Math.floor(n / 1e7);
  const lakh = Math.floor((n % 1e7) / 1e5);
  const thousand = Math.floor((n % 1e5) / 1e3);
  const rest = n % 1000;
  return [
    crore ? `${numberWords(crore)} Crore` : "",
    lakh ? `${twoDigits(lakh)} Lakh` : "",
    thousand ? `${twoDigits(thousand)} Thousand` : "",
    rest ? threeDigits(rest) : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/* 12213000 → "Rupees One Lakh Twenty Two Thousand One Hundred and Thirty Only" */
export function inWords(paise: number) {
  const abs = Math.abs(Math.round(paise));
  const rupees = Math.floor(abs / 100);
  const ps = abs % 100;
  return `Rupees ${numberWords(rupees)}${ps ? ` and ${twoDigits(ps)} Paise` : ""} Only`;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const ordinal = (d: number) => (d % 10 === 1 && d !== 11 ? "st" : d % 10 === 2 && d !== 12 ? "nd" : d % 10 === 3 && d !== 13 ? "rd" : "th");

/* "2026-08-28" → { day: "28", suffix: "th", rest: " August, 2026" } (the suffix is printed raised) */
export function quoteDateParts(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return { day: "", suffix: "", rest: iso };
  return { day: String(d), suffix: ordinal(d), rest: ` ${MONTHS[m - 1]}, ${y}` };
}
export const quoteDateText = (iso: string) => {
  const p = quoteDateParts(iso);
  return `${p.day}${p.suffix}${p.rest}`;
};

/* GOBT/Q/082026/0086: month and year of the quotation, then a running number */
export const quoteNumber = (iso: string, seq: number) => {
  const [y, m] = iso.split("-");
  return `GOBT/Q/${m}${y}/${String(seq).padStart(4, "0")}`;
};

/* ── the sums ── */

export type QuoteTotals = {
  subtotal: number; // paise, before discount
  discount: number;
  taxable: number; // after discount
  gst: number;
  grand: number;
  discountLabel: string; // "10% (₹5,200/-)" or "₹11,500/-"
  milestones: { name: string; percent: number; base: number; gst: number; total: number }[];
  milestonePercent: number;
  emi: {
    charge: number;
    payable: number;
    down: number;
    monthly: number;
    rows: { label: string; due: string; amount: number }[];
  };
};

const pct = (n: number) => `${Number(n.toFixed(2))}%`;

export function computeQuote(q: QuoteData): QuoteTotals {
  const subtotal = q.items.reduce((s, i) => s + Math.max(0, toPaise(i.amount)), 0);
  let discount = 0;
  let discountLabel = "";
  if (q.discount.type === "percent" && q.discount.value > 0) {
    discount = Math.round((subtotal * Math.min(100, q.discount.value)) / 100);
    discountLabel = `${pct(q.discount.value)} (${inr(discount)}/-)`;
  } else if (q.discount.type === "amount" && q.discount.value > 0) {
    discount = Math.min(subtotal, toPaise(q.discount.value));
    discountLabel = `${inr(discount)}/-`;
  }
  const taxable = subtotal - discount;
  const rate = Math.max(0, Number(q.gstRate) || 0);
  const gst = Math.round((taxable * rate) / 100);
  const grand = taxable + gst;

  /* milestones: each share is rounded, the last one takes the remainder */
  const ms = q.milestones.filter((m) => m.name.trim() || m.percent);
  const milestonePercent = ms.reduce((s, m) => s + (Number(m.percent) || 0), 0);
  let baseLeft = taxable;
  let gstLeft = gst;
  const milestones = ms.map((m, i) => {
    const last = i === ms.length - 1 && Math.abs(milestonePercent - 100) < 0.001;
    const base = last ? baseLeft : Math.round((taxable * (Number(m.percent) || 0)) / 100);
    const g = last ? gstLeft : Math.round((gst * (Number(m.percent) || 0)) / 100);
    baseLeft -= base;
    gstLeft -= g;
    return { name: m.name, percent: Number(m.percent) || 0, base, gst: g, total: base + g };
  });

  /* EMI: optional flat charge, a down payment, then equal monthly instalments in whole rupees */
  const months = Math.max(1, Math.min(36, Math.round(q.emi.months) || 1));
  const charge = Math.round((grand * Math.max(0, q.emi.chargePercent || 0)) / 100);
  const payable = grand + charge;
  const down = Math.round((payable * Math.max(0, Math.min(90, q.emi.downPercent || 0))) / 100 / 100) * 100;
  const rest = payable - down;
  const monthly = Math.round(rest / months / 100) * 100;
  const rows: QuoteTotals["emi"]["rows"] = [];
  if (down > 0) rows.push({ label: "Down Payment", due: "At project initiation", amount: down });
  for (let i = 1; i <= months; i++) {
    rows.push({ label: `EMI ${i}`, due: `Month ${i}`, amount: i === months ? rest - monthly * (months - 1) : monthly });
  }

  return {
    subtotal,
    discount,
    taxable,
    gst,
    grand,
    discountLabel,
    milestones,
    milestonePercent,
    emi: { charge, payable, down, monthly, rows },
  };
}

export const lines = (text: string) =>
  text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

/* checks a quotation before it is saved; returns the first problem */
export function quoteProblem(q: QuoteData): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(q.date)) return "Choose the quotation date.";
  if (q.mode === "doc") {
    if (docIsEmpty(q.doc)) return "The document is empty.";
    if (!docMeta(q.doc).client && !q.listName?.trim()) return "Write who it's for after “To,” at the top of the document.";
  } else {
    if (lines(q.to).length === 0) return "Fill in who the quotation is for (the “To” box).";
    if (!q.subject.trim() || q.subject.trim() === "Quotation for") return "Write the subject.";
  }
  const items = q.items.filter((i) => i.module.trim());
  if (items.length === 0) return q.mode === "doc" ? "Add at least one line to the price list." : "Add at least one module to the scope of work.";
  if (q.items.some((i) => !i.module.trim() && (i.details.trim() || i.amount))) return "One of the modules has no name.";
  if (q.items.some((i) => !(Number(i.amount) >= 0))) return "Amounts can't be negative.";
  if (q.items.reduce((s, i) => s + (Number(i.amount) || 0), 0) <= 0) return "Enter the amount for at least one module.";
  if (q.gstRate < 0 || q.gstRate > 50) return "GST rate looks wrong.";
  if (q.discount.type === "percent" && (q.discount.value < 0 || q.discount.value > 100)) return "Discount must be between 0 and 100%.";
  if (q.payment !== "emi") {
    const ms = q.milestones.filter((m) => m.name.trim() || m.percent);
    if (ms.length === 0) return "Add at least one payment milestone.";
    if (ms.some((m) => !m.name.trim())) return "Every milestone needs a name.";
    const sum = ms.reduce((s, m) => s + (Number(m.percent) || 0), 0);
    if (Math.abs(sum - 100) > 0.001) return `Milestone percentages add up to ${Number(sum.toFixed(2))}%. They must add up to 100%.`;
  }
  if (q.payment !== "terms") {
    if (!(q.emi.months >= 1 && q.emi.months <= 36)) return "EMI months must be between 1 and 36.";
    if (!(q.emi.downPercent >= 0 && q.emi.downPercent <= 90)) return "Down payment must be between 0 and 90%.";
    if (!(q.emi.chargePercent >= 0 && q.emi.chargePercent <= 30)) return "EMI charge must be between 0 and 30%.";
  }
  return null;
}

/* trims and fills in anything missing, so old or odd data is always safe to draw */
export function normaliseQuote(raw: unknown, fallbackDate: string): QuoteData {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<QuoteData>;
  const base = blankQuote(fallbackDate);
  const str = (v: unknown, d: string, max = 6000) => (typeof v === "string" ? v.slice(0, max) : d);
  const num = (v: unknown, d: number) => (Number.isFinite(Number(v)) ? Number(v) : d);
  return {
    date: str(r.date, base.date, 10),
    to: str(r.to, base.to, 800),
    subject: str(r.subject, base.subject, 300),
    salutation: str(r.salutation, base.salutation, 60),
    intro: str(r.intro, base.intro),
    sections: Array.isArray(r.sections) ? r.sections.slice(0, 10).map((s) => ({ heading: str(s?.heading, "", 120), body: str(s?.body, "") })) : [],
    items: Array.isArray(r.items)
      ? r.items.slice(0, 40).map((i) => ({ module: str(i?.module, "", 120), details: str(i?.details, "", 800), amount: Math.max(0, num(i?.amount, 0)) }))
      : base.items,
    discount: {
      type: (["none", "percent", "amount"] as const).includes(r.discount?.type as DiscountType) ? (r.discount!.type as DiscountType) : "none",
      value: Math.max(0, num(r.discount?.value, 0)),
    },
    gstRate: num(r.gstRate, 18),
    payment: (["terms", "emi", "both"] as const).includes(r.payment as PaymentMode) ? (r.payment as PaymentMode) : "terms",
    milestones: Array.isArray(r.milestones)
      ? r.milestones.slice(0, 12).map((m) => ({ name: str(m?.name, "", 120), percent: num(m?.percent, 0) }))
      : base.milestones,
    emi: {
      downPercent: num(r.emi?.downPercent, base.emi.downPercent),
      months: Math.round(num(r.emi?.months, base.emi.months)),
      chargePercent: num(r.emi?.chargePercent, 0),
    },
    paymentTerms: str(r.paymentTerms, base.paymentTerms),
    inclusions: str(r.inclusions, ""),
    exclusions: str(r.exclusions, base.exclusions),
    assumptions: str(r.assumptions, base.assumptions),
    terms: str(r.terms, base.terms),
    closing: str(r.closing, base.closing, 2000),
    signature: r.signature !== false,
    sign: (() => {
      const s = r.sign as Partial<QuoteSign> | undefined;
      const id = (v: unknown) => (typeof v === "string" && /^(default-signature|default-stamp|\d{1,9})?$/.test(v) ? v : "");
      if (s && typeof s === "object") {
        return { signature: id(s.signature), stamp: id(s.stamp), place: STAMP_PLACES.some((p) => p.id === s.place) ? (s.place as StampPlace) : "beside" };
      }
      return r.signature === false ? { signature: "", stamp: "", place: "beside" as StampPlace } : { ...DEFAULT_SIGN };
    })(),
    mode: r.mode === "doc" ? "doc" : "form",
    doc: r.mode === "doc" ? cleanDoc(r.doc) : undefined,
    listName: str(r.listName, "", 160),
  };
}

/* every signature/stamp a quotation prints (sign block + images placed in the document) */
export function marksUsed(q: QuoteData): string[] {
  const ids = new Set<string>();
  if (q.sign.signature) ids.add(q.sign.signature);
  if (q.sign.stamp) ids.add(q.sign.stamp);
  const walk = (n?: DocNode) => {
    if (!n) return;
    if (n.type === MARK_NODE && typeof n.attrs?.mark === "string") ids.add(n.attrs.mark);
    n.content?.forEach(walk);
  };
  if (q.mode === "doc") walk(q.doc);
  return [...ids];
}
