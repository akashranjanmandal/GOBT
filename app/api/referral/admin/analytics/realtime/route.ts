import { currentAdmin } from "@/lib/referral/auth";
import { realtime } from "@/lib/analytics/report";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await currentAdmin())) return Response.json({ error: "Not logged in" }, { status: 401 });
  return Response.json(await realtime(), { headers: { "Cache-Control": "no-store" } });
}
