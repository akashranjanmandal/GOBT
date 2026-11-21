"use client";

import { useActionState } from "react";
import { emailReportNowAction, type ReportState } from "@/app/referral/(admin)/admin/analytics/actions";

export default function WeeklyReportButton() {
  const [state, action, pending] = useActionState<ReportState>(emailReportNowAction, {});
  return (
    <form action={action} className="an-report">
      <button className="ad-btn ad-btn-sm" disabled={pending} title="The weekly report is emailed every Monday at 9 am. This sends last week's report to you now.">
        {pending ? "Sending…" : "✉ Email me last week's report"}
      </button>
      <a className="ad-link" href="/api/referral/admin/analytics/weekly-preview" target="_blank" rel="noopener noreferrer">
        Preview
      </a>
      {state.message && <small className="ad-ok">{state.message}</small>}
      {state.error && <small className="ad-error">{state.error}</small>}
    </form>
  );
}
