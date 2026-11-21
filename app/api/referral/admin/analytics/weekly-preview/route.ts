import { currentAdmin } from "@/lib/referral/auth";
import { buildWeeklyReport, reportRecipients } from "@/lib/analytics/weekly";

export const dynamic = "force-dynamic";

/* the Monday email as a web page, without sending it */
export async function GET() {
  if (!(await currentAdmin())) return new Response("Not logged in", { status: 401 });
  const r = await buildWeeklyReport();
  const note = `<p style="font-family:Arial;font-size:12px;color:#666;max-width:640px;margin:12px auto">Preview · subject: “${r.subject.replace(/</g, "&lt;")}” · goes to ${reportRecipients().join(", ")} every Monday at 9 am</p>`;
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Weekly report preview</title><body style="background:#f4f4f4;padding:16px">${note}<div style="background:#fff;max-width:680px;margin:auto;padding:20px;border-radius:10px">${r.html}</div></body>`, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
