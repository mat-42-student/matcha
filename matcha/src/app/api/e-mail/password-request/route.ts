import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";
import { getUserByEmail } from "@/lib/db/users";
import { createEmailToken, deleteEmailTokensForUserByType } from "@/lib/db/emails";
import { isValidEmail, normalizeEmail } from "@/lib/validators/serverValidator";
import { clientIp, hitRateLimit, tooManyRequests } from "@/lib/rateLimit";

// Each request may send an email: per IP, and per address so that nobody gets flooded
const IP_LIMIT = 5;
const EMAIL_LIMIT = 3;
const WINDOW_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => null);
		const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
		if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });
		if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
		// before the lookup: the answer must not depend on the account existing
		if (hitRateLimit(`password-request:${clientIp(req)}`, IP_LIMIT, WINDOW_MS)
			|| hitRateLimit(`password-request:${email}`, EMAIL_LIMIT, WINDOW_MS)) return tooManyRequests();

		const user = await getUserByEmail(email);
		if (!user) return NextResponse.json({ success: true }); // pas de leak

		const token = crypto.randomBytes(32).toString("hex");
		const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 minutes

		await deleteEmailTokensForUserByType(user.id, "password_reset");
		await createEmailToken(user.id, "password_reset", token, expiresAt);

		const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset/${token}`;

		await sendMail(email, "Reset your password", `
			<h2>Reset your password 🔑</h2>
			<p>Click below to reset your password:</p>
			<a href="${resetUrl}">${resetUrl}</a>
			<p>This link expires in 30 minutes.</p>
		`);

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Error sending reset email:", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}