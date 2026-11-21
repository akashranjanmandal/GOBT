import { sendWeeklyReport, validCronKey } from "@/lib/analytics/weekly";

export const dynamic = "force-dynamic";

/* called every Monday by netlify/functions/weekly-report.mts */
export async function POST(req: Request) {
  if (!validCronKey(req.headers.get("x-cron-key"))) return new Response("Forbidden", { status: 403 });
  try {
    return Response.json(await sendWeeklyReport());
  } catch (e) {
    console.error("[weekly-report]", e);
    return Response.json({ sent: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
