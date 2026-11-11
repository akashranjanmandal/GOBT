import { NextResponse } from "next/server";
import { setUserCookie, verifyLoginCode } from "@/lib/referral/auth";

/* Referrer login, step 2: check the emailed code and set the login
   cookie on this plain JSON response. The page then navigates itself. */
export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 415 });
  }
  const body = await req.json().catch(() => ({}));
  const res = await verifyLoginCode(String(body?.email ?? ""), String(body?.code ?? ""));
  if (!res.ok) return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  const out = NextResponse.json({ ok: true });
  setUserCookie(out, res.token);
  return out;
}
