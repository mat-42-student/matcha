// matcha/src/lib/mail.ts

import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "1025"),
  secure: false,
});

export async function sendMail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: `"Matcha" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
}
