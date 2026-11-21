import { createHash } from "node:crypto";

/* Netlify Scheduled Function: every Monday 03:30 UTC (9:00 am IST) ask the
   site to email last week's analytics report. The site checks the key, which
   is derived from REFERRAL_SECRET (already set in Netlify). */
const weeklyReport = async () => {
  const base = process.env.URL ?? "https://gobt.in";
  const secret = process.env.REFERRAL_SECRET;
  if (!secret) {
    console.error("weekly-report: REFERRAL_SECRET is not set");
    return;
  }
  const key = createHash("sha256").update(`${secret}:weekly-report`).digest("hex");
  const res = await fetch(`${base}/api/cron/weekly-report`, { method: "POST", headers: { "x-cron-key": key } });
  console.log("weekly-report:", res.status, await res.text());
};

export default weeklyReport;

export const config = { schedule: "30 3 * * 1" };
