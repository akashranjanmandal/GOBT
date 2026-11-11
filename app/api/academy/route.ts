import { NextResponse } from "next/server";
import { CONTACT } from "@/lib/content";
import { ACADEMY, ACADEMY_COURSES, classLabel, inr, normaliseMobile, validateAcademy, type AcademyForm } from "@/lib/academy";
import { MAIL_FROM, escapeHtml, mailer } from "@/lib/mailer";
import { db } from "@/lib/referral/db";

/* Academy registrations → an email to the careers inbox */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    /* bots fill every field, including the hidden one */
    if (body.website) return NextResponse.json({ success: true });

    const form: AcademyForm = {
      name: String(body.name ?? "").slice(0, 100),
      studentClass: String(body.studentClass ?? ""),
      school: String(body.school ?? "").slice(0, 150),
      mobile: String(body.mobile ?? ""),
      whatsapp: String(body.whatsapp ?? ""),
      address: String(body.address ?? "").slice(0, 400),
      course: String(body.course ?? ""),
      location: String(body.location ?? ""),
    };
    if (Object.keys(validateAcademy(form)).length) {
      return NextResponse.json({ error: "Invalid form" }, { status: 400 });
    }

    const course = ACADEMY_COURSES.find((c) => c.id === form.course)!;
    const mobile = normaliseMobile(form.mobile)!;
    const whatsapp = normaliseMobile(form.whatsapp)!;

    /* keep a copy in the database (admin panel → Academy), so a failed
       email never loses a registration */
    let stored = false;
    try {
      const c = await db();
      await c.execute({
        sql: `INSERT INTO academy_regs (name, class, school, mobile, whatsapp, address, course, location, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [form.name.trim(), form.studentClass, form.school.trim(), mobile, whatsapp, form.address.trim(), form.course, form.location, Date.now()],
      });
      stored = true;
    } catch (error) {
      console.error("Academy registration not stored:", error);
    }
    const rows: [string, string][] = [
      ["Student name", form.name.trim()],
      ["Class", classLabel(form.studentClass)],
      ["School", form.school.trim()],
      ["Mobile", `+91 ${normaliseMobile(form.mobile)}`],
      ["WhatsApp", `+91 ${normaliseMobile(form.whatsapp)}`],
      ["Address", form.address.trim()],
      ["Course", `${course.title} (${course.duration}, course fee ${inr(course.fee)})`],
      ["Registration fee", inr(ACADEMY.registrationFee)],
      ["Nearest location", form.location],
    ];

    let emailed = false;
    try {
      await mailer.sendMail({
      from: MAIL_FROM,
      to: CONTACT.careers,
      subject: `Academy registration: ${form.name.trim()}, ${classLabel(form.studentClass)}, ${course.title}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <div style="background: #0f2a6b; padding: 18px 20px;">
            <h1 style="color: #ffd23f; margin: 0; font-size: 20px;">New academy registration</h1>
            <p style="color: #ffffff; margin: 6px 0 0; font-size: 13px;">${escapeHtml(ACADEMY.name)}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            ${rows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding: 10px 16px; border-bottom: 1px solid #eee; color: #666; width: 38%;">${escapeHtml(k)}</td><td style="padding: 10px 16px; border-bottom: 1px solid #eee; color: #111;">${escapeHtml(v)}</td></tr>`
              )
              .join("")}
          </table>
        </div>`,
      });
      emailed = true;
    } catch (error) {
      console.error("Academy registration email failed:", error);
    }

    if (!stored && !emailed) return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Academy registration failed:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
