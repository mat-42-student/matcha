import { NextRequest, NextResponse } from "next/server";
import { getEmailTokenByToken, deleteEmailTokenByToken } from "@/lib/db/emails";
import { updateUserPassword } from "@/lib/db/users";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
	try {
		const { token, password } = await req.json();
		if (!token || !password)
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });

		const tokenData = await getEmailTokenByToken(token);
		if (!tokenData || tokenData.type !== "password_reset") {
			return NextResponse.json({ error: "Invalid token" }, { status: 400 });
		}

		if (new Date() > new Date(tokenData.expires_at)) {
			return NextResponse.json({ error: "Token expired" }, { status: 400 });
		}

		const hashed = await bcrypt.hash(password, 10);
		await updateUserPassword(tokenData.user_id, hashed);

		await deleteEmailTokenByToken(token);

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Error resetting password:", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}