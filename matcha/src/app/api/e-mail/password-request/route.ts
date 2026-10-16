import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { sendMail } from "@/lib/mail";
import { getUserByEmail } from "@/lib/db/users";
import { createEmailToken, deleteEmailTokensForUserByType } from "@/lib/db/emails";

export async function POST(req: NextRequest) {
	try {
		const { email } = await req.json();
		if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

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