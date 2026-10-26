import { NextRequest, NextResponse } from "next/server";
import { getEmailTokenByToken, deleteEmailTokensForUserByType } from "@/lib/db/emails";
import { updateUserPassword } from "@/lib/db/users";
import { deleteSessionsForUser } from "@/lib/db/session";
import { closeSessionSockets } from "@/lib/socket/socket";
import { validatePassword } from "@/lib/validators/serverValidator";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json().catch(() => null);
		const token: unknown = body?.token;
		const password: unknown = body?.password;
		if (typeof token !== "string" || typeof password !== "string" || !token || !password)
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });

		const tokenData = await getEmailTokenByToken(token);
		if (!tokenData || tokenData.type !== "password_reset") {
			return NextResponse.json({ error: "Invalid token" }, { status: 400 });
		}

		if (new Date() > new Date(tokenData.expires_at)) {
			return NextResponse.json({ error: "Token expired" }, { status: 400 });
		}

		const errors = validatePassword(password);
		if (errors.length > 0) {
			return NextResponse.json({ field: "password", errors }, { status: 400 });
		}

		const hashed = await bcrypt.hash(password, 10);
		await updateUserPassword(tokenData.user_id, hashed);

		await deleteEmailTokensForUserByType(tokenData.user_id, "password_reset");
		await deleteSessionsForUser(tokenData.user_id);
		// every device logged in before the reset is logged out, sockets included
		closeSessionSockets(tokenData.user_id);

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("Error resetting password:", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}