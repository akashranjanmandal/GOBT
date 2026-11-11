import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/* scrypt password hashes, stored as "scrypt:<salt>:<hash>" (hex).
   Only hashes are ever stored or configured, never a password. */
const KEYLEN = 64;

const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => scrypt(password, salt, KEYLEN, (err, key) => (err ? reject(err) : resolve(key))));

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  return `scrypt:${salt.toString("hex")}:${(await derive(password, salt)).toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltHex, hashHex] = stored.trim().split(/[:$]/);
  if (scheme !== "scrypt" || !/^[0-9a-f]+$/i.test(saltHex ?? "") || !/^[0-9a-f]{128}$/i.test(hashHex ?? "")) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = await derive(password, Buffer.from(saltHex, "hex"));
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/* a well-formed hash to compare against when the email doesn't exist, so
   "no such admin" and "wrong password" take the same time */
export const DUMMY_HASH = "scrypt:" + "0".repeat(32) + ":" + "0".repeat(128);

export const isPasswordHash = (v: string | undefined) => !!v && /^scrypt:[0-9a-f]{32}:[0-9a-f]{128}$/i.test(v.trim());

export const passwordProblem = (p: string) =>
  p.length < 10
    ? "Use at least 10 characters."
    : !/[a-z]/.test(p) || !/[A-Z]/.test(p) || !/\d/.test(p)
      ? "Include an uppercase letter, a lowercase letter and a number."
      : null;
