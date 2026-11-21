"use server";

import { requireAdmin } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";
import { sendWeeklyReport } from "@/lib/analytics/weekly";

export type ReportState = { error?: string; message?: string };

/* "Email me this report now": last week's report, to the admin who asked */
export async function emailReportNowAction(): Promise<ReportState> {
  const admin = await requireAdmin();
  try {
    await sendWeeklyReport({ to: [admin.email], force: true });
    await audit(admin, "account.report", `${admin.name} emailed themselves the weekly analytics report`);
    return { message: `Sent to ${admin.email}.` };
  } catch (e) {
    return { error: `Couldn't send: ${e instanceof Error ? e.message : String(e)}` };
  }
}
