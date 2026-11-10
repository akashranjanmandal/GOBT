import nodemailer from "nodemailer";

/* One Gmail transport for every form on the site. Credentials come from
   the environment only (GMAIL_USER, GMAIL_APP_PASSWORD: .env.local while
   developing, the hosting dashboard in production). Nothing secret lives
   in the code. The transport is created on first use, so a missing value
   fails the email, not the build. */
let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

function transporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) throw new Error("GMAIL_USER and GMAIL_APP_PASSWORD are not set");
  return (transport ??= nodemailer.createTransport({ service: "gmail", auth: { user, pass } }));
}

export const MAIL_FROM = `"GOBT Website" <${process.env.GMAIL_USER ?? "noreply@gobt.in"}>`;

export const mailer = {
  sendMail: (options: nodemailer.SendMailOptions) => transporter().sendMail(options),
};

/* visitor input goes into HTML emails — escape it */
export const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
