// matcha/src/app/api/e-mail/change-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";
import { createEmailToken } from "@/lib/db/emails";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get("session_id")?.value || null;
    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { new_email } = await req.json();
    if (!new_email) {
      return NextResponse.json({ error: "Missing new_email" }, { status: 400 });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    // Store change request in email_tokens table
    await createEmailToken(user.id, "change", token, expiresAt, new_email);

    // Send confirmation email
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/e-mail/change-confirm?token=${token}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "1025"),
      secure: false,
    });

    await transporter.sendMail({
      from: `"Matcha" <${process.env.EMAIL_FROM}>`,
      to: new_email,
      subject: "Confirm your new email address",
      html: `
        <h1>Confirm your new email 📬</h1>
        <p>Click the link below to confirm your new email address:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
        <p>This link will expire in 30 minutes.</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in /e-mail/change-request:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}