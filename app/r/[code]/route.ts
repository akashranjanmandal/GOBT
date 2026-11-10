import { NextResponse } from "next/server";
import { REFERRAL, REF_COOKIE } from "@/lib/referral/config";

/* gobt.in/r/CODE: remember who referred this visitor, then show the site.
   The contact form credits the lead to that code (see /api/contact). */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const res = NextResponse.redirect(new URL("/", req.url));
  const clean = code.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 20);
  if (clean) {
    res.cookies.set(REF_COOKIE, clean, {
      maxAge: REFERRAL.leadLockDays * 86_400,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
  }
  return res;
}
