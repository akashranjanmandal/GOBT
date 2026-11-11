/* Make a password hash for ADMIN_PASSWORD_HASH.
   Usage: node scripts/hash-password.mjs
   Type the password when asked (it isn't shown). Only the hash is printed,
   in the same scrypt format the site uses (lib/referral/password.ts). */
import { randomBytes, scrypt } from "node:crypto";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
process.stdout.write("Password: ");
rl._writeToOutput = () => {}; // hide what's typed

rl.question("", (password) => {
  rl.close();
  process.stdout.write("\n");
  if (password.length < 8) {
    console.error("Use at least 8 characters.");
    process.exit(1);
  }
  const salt = randomBytes(16);
  scrypt(password, salt, 64, (err, key) => {
    if (err) throw err;
    console.log(`scrypt:${salt.toString("hex")}:${key.toString("hex")}`);
  });
});
