import "server-only";

/* Signing secret for login tokens and hashed codes */
export function secret() {
  const s = process.env.REFERRAL_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("REFERRAL_SECRET is not set");
  return "dev-only-referral-secret";
}
