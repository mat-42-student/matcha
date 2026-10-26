// matcha/src/lib/mail.ts

import nodemailer from "nodemailer";
import crypto from "crypto";
import { createEmailToken, deleteEmailTokenByToken } from "./db/emails";

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

/**
 * Creates a verify token (valid 24 h) and mails its link to the user.
 * If the mail cannot be sent, the token is removed so that the next login
 * sends a new link instead of leaving the account stuck for 24 h.
 */
export async function sendVerificationEmail(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // +24h

  await createEmailToken(userId, "verify", token, expiresAt);

  const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/e-mail/verify?token=${token}`;

  try {
    await sendMail(email, "Verify your email", `
      <h1>Welcome to Matcha 🎉</h1>
      <p>Click here to verify your account:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `);
  } catch (err) {
    await deleteEmailTokenByToken(token);
    throw err;
  }
}
