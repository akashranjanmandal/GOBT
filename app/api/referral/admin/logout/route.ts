import { NextResponse } from "next/server";
import { clearAdminCookie, currentAdmin } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";

/* Admin logout: a plain form POST, then back to the login page */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (admin) await audit(admin, "login.logout", `${admin.name} logged out`);
  const res = NextResponse.redirect(new URL("/referral/admin/login", req.url), 303);
  clearAdminCookie(res);
  return res;
}
