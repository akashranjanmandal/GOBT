import { NextResponse } from "next/server";
import { clearUserCookie } from "@/lib/referral/auth";

/* Referrer logout: a plain form POST, then back to the programme page */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/referral", req.url), 303);
  clearUserCookie(res);
  return res;
}
