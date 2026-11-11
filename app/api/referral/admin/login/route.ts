import { NextResponse } from "next/server";
import { loginAdmin, setAdminCookie } from "@/lib/referral/auth";

/* Admin login: check email + password and set the login cookie on this
   plain JSON response. The page then navigates to the panel itself. */
export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 415 });
  }
  const body = await req.json().catch(() => ({}));
  const res = await loginAdmin(String(body?.email ?? ""), String(body?.password ?? ""));
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  const out = NextResponse.json({ ok: true });
  setAdminCookie(out, res.token);
  return out;
}
