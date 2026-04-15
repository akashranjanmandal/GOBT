import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { name, email, company, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'souvikghoshkalna@gmail.com',
        pass: 'vbeemyudmwfbbnfl',
      },
    });

    const mailOptions = {
      from: `"GOBT Website" <${process.env.EMAIL_USER}>`,
      to: 'info@gobt.in',
      replyTo: email,
      subject: `New Project Inquiry from ${name} (${company || 'No Company'})`,
      text: `Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
          <div style="background: #ff6a2b; padding: 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Project Inquiry</h1>
          </div>
          <div style="padding: 30px; background: #ffffff; color: #333333;">
            <h2 style="margin-top: 0; color: #1a1a1a;">Client Details</h2>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; font-weight: bold; width: 100px;">Name:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; font-weight: bold;">Email:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">
                  <a href="mailto:${email}" style="color: #4d6bff; text-decoration: none;">${email}</a>
                </td>
              </tr>
              ${company ? `
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea; font-weight: bold;">Company:</td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eaeaea;">${company}</td>
              </tr>
              ` : ''}
            </table>
            <h2 style="color: #1a1a1a;">Message Brief</h2>
            <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #4d6bff; border-radius: 4px; white-space: pre-wrap;">${message}</div>
          </div>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; color: #777777; font-size: 12px;">
            This email was sent securely from the GOBT website contact form.
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}
