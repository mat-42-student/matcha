// matcha/src/app/api/e-mail/change-request/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createEmailToken, deleteEmailTokensForUserByType } from "@/lib/db/emails";
import { isEmailUsed } from "@/lib/db/users";
import { isValidEmail, normalizeEmail } from "@/lib/validators/serverValidator";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";
import { hitRateLimit, tooManyRequests } from "@/lib/rateLimit";

// Each request sends an email
const CHANGE_LIMIT = 5;
const CHANGE_WINDOW_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const body = await req.json().catch(() => null);
    if (typeof body?.new_email !== "string" || !body.new_email.trim()) {
      return NextResponse.json({ error: "Missing new_email" }, { status: 400 });
    }
    const new_email = normalizeEmail(body.new_email);

    if (!isValidEmail(new_email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (new_email === normalizeEmail(user.email)) {
      return NextResponse.json({ error: "This is already your email address" }, { status: 400 });
    }
    if (await isEmailUsed(new_email)) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    if (hitRateLimit(`change-request:${user.id}`, CHANGE_LIMIT, CHANGE_WINDOW_MS)) return tooManyRequests();

    // Generate token
    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

    // Only the latest change request stays valid
    await deleteEmailTokensForUserByType(user.id, "change");
    await createEmailToken(user.id, "change", token, expiresAt, new_email);

    // Send confirmation email
    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/e-mail/change-confirm?token=${token}`;
    await sendMail(new_email, "Confirm your new email address", `
      <h1>Confirm your new email 📬</h1>
      <p>Click the link below to confirm your new email address:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
      <p>This link will expire in 30 minutes.</p>
    `);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in /e-mail/change-request:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}