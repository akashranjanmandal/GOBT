import { NextResponse } from "next/server";
import { loginAdmin, setAdminCookie } from "@/lib/referral/auth";
import { audit } from "@/lib/referral/audit";

/* Admin login: check email + password and set the login cookie on this
   plain JSON response. The page then navigates to the panel itself. */
export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 415 });
  }
  const body = await req.json().catch(() => ({}));
  const email = String(body?.email ?? "").trim().toLowerCase().slice(0, 120);
  const res = await loginAdmin(email, String(body?.password ?? ""));
  if (!res.ok) {
    await audit(null, "login.failed", `Failed admin login for ${email || "(no email)"}: ${res.error}`, undefined, email || undefined);
    return NextResponse.json({ ok: false, error: res.error }, { status: 400 });
  }
  await audit(res.admin, "login.success", `${res.admin.name} logged in`);
  const out = NextResponse.json({ ok: true });
  setAdminCookie(out, res.token);
  return out;
}
