import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { secret } from "./secret";

/* Login tokens: signed JWTs kept in httpOnly cookies. Referrers and
   admins get different audiences, so one can never be used as the other. */
export type Role = "referrer" | "admin";

const key = () => new TextEncoder().encode(secret());

export async function signToken(role: Role, id: number, seconds: number) {
  return new SignJWT({ role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(id))
    .setAudience(role)
    .setIssuer("gobt.in")
    .setIssuedAt()
    .setExpirationTime(`${seconds}s`)
    .sign(key());
}

export async function readToken(token: string | undefined, role: Role): Promise<number | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"], audience: role, issuer: "gobt.in" });
    const id = Number(payload.sub);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}
