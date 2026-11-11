import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { currentUser } from "@/lib/referral/auth";
import { REFERRAL, REF_CHANNEL_COOKIE, REF_COOKIE, VISITOR_COOKIE } from "@/lib/referral/config";
import { db } from "@/lib/referral/db";
import { cleanChannel, isBot, recordClick } from "@/lib/referral/track";

/* gobt.in/r/CODE?s=whatsapp
   A referral link. It records the visit (real people only, once per person
   per referrer), remembers who referred this visitor and from which channel,
   then shows the site. The contact form credits the lead to that code. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);

  /* ?to=/academy/form sends people to a page other than the home page */
  const to = url.searchParams.get("to");
  const path = to && to.startsWith("/") && !to.startsWith("//") && !to.includes("\\") ? to : "/";
  const res = NextResponse.redirect(new URL(path, req.url));
  if (!clean) return res;

  try {
    const c = await db();
    const owner = (await c.execute({ sql: "SELECT id, blocked FROM users WHERE code = ?", args: [clean] })).rows[0];
    if (!owner || Number(owner.blocked) === 1) return res;

    const jar = await cookies();
    const channel = cleanChannel(url.searchParams.get("s"));
    const visitor = jar.get(VISITOR_COOKIE)?.value ?? randomBytes(12).toString("base64url");
    const secure = process.env.NODE_ENV === "production";
    const base = { maxAge: REFERRAL.leadLockDays * 86_400, sameSite: "lax" as const, path: "/", secure, httpOnly: true };

    res.cookies.set(VISITOR_COOKIE, visitor, { ...base, maxAge: 365 * 86_400 });

    /* the first referrer keeps this person for 90 days: someone else
       sending them the same thing later doesn't count or take them over */
    const existing = jar.get(REF_COOKIE)?.value;
    if (existing && existing !== clean) return res;

    res.cookies.set(REF_COOKIE, clean, base);
    if (channel && !existing) res.cookies.set(REF_CHANNEL_COOKIE, channel, base);

    const ua = req.headers.get("user-agent") ?? "";
    const self = (await currentUser())?.id === Number(owner.id);
    if (!isBot(ua) && !self) {
      await recordClick({
        userId: Number(owner.id),
        channel,
        referer: req.headers.get("referer"),
        ua,
        headers: req.headers,
        visitor,
      });
    }
  } catch (error) {
    console.error("[referral] link tracking failed:", error);
  }
  return res;
}
