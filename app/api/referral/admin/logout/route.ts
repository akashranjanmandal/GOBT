import { NextResponse } from "next/server";
import { clearAdminCookie } from "@/lib/referral/auth";

/* Admin logout: a plain form POST, then back to the login page */
export async function POST(req: Request) {
  const res = NextResponse.redirect(new URL("/referral/admin/login", req.url), 303);
  clearAdminCookie(res);
  return res;
}
