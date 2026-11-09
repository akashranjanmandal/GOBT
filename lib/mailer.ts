import nodemailer from "nodemailer";

/* One Gmail transport for every form on the site. Set GMAIL_USER and
   GMAIL_APP_PASSWORD in the host's environment; the fallbacks keep the
   current setup working until then (and should then be deleted). */
const user = process.env.GMAIL_USER ?? "souvikghoshkalna@gmail.com";
const pass = process.env.GMAIL_APP_PASSWORD ?? "vbeemyudmwfbbnfl";

export const MAIL_FROM = `"GOBT Website" <${user}>`;

export const mailer = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });

/* visitor input goes into HTML emails — escape it */
export const escapeHtml = (v: string) =>
  v.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
