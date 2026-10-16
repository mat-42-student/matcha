// matcha/src/app/api/login/route.ts

import { NextResponse, NextRequest } from "next/server";
import { createSession } from "@/lib/db/session";
import { loginUser } from "@/lib/db/users";
import { locateUserByIp } from "@/lib/geoip";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData().catch(() => null);
		const identifier = formData?.get("identifier");
		const password = formData?.get("password");

		if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

		const user = await loginUser(identifier, password);
		if (!user) {
			return NextResponse.json({ error: "Invalid login" }, { status: 401 });
		}

		const sessionId = await createSession(user.id);

		// no location set yet: fall back to the IP one, without blocking the login on failure
		if (user.latitude == null || user.longitude == null) {
			await locateUserByIp(user.id, req.headers).catch((err) => console.error("Error IP location:", err));
		}

		const res = NextResponse.json({
			success: true,
			user: { id: user.id, username: user.username, email: user.email, first_name: user.first_name }
		});

		res.cookies.set("session_id", sessionId, {
			httpOnly: true,
			secure: true, // enable if https
			sameSite: "lax",
			path: "/",
			maxAge: 60 * 60 * 24 * 7, // same lifetime as sessions.expires_at
		});

		return res;
	} catch (err) {
		console.error("Error login:", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}