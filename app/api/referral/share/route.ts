import { NextResponse } from "next/server";
import { currentUser } from "@/lib/referral/auth";
import { channelLabel } from "@/lib/referral/channels";
import { logActivity, recordShare } from "@/lib/referral/track";

/* The dashboard's share buttons report here, so the admin can see where
   each referrer shares their link. Logged-in referrers only. */
export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false }, { status: 415 });
  }
  const user = await currentUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const channel = String(body?.channel ?? "");
  const saved = await recordShare(user.id, channel);
  if (saved) await logActivity(user.id, user.name ?? user.email, "share", `${user.name ?? user.email} shared their link on ${channelLabel(channel)}`);
  return NextResponse.json({ ok: saved });
}
