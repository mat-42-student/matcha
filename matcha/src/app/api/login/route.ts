// matcha/src/app/api/login/route.ts

import { NextResponse, NextRequest } from "next/server";
import { createSession } from "@/lib/db/session";
import { loginUser } from "@/lib/db/users";

export async function POST(req: NextRequest) {
	try {
		const formData = await req.formData();
		const email = formData.get("email") as string;
		const password = formData.get("password") as string;

		if (!email || !password) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

		const user = await loginUser(email, password);
		if (!user) {
			return NextResponse.json({ error: "Invalid login" }, { status: 401 });
		}

		const sessionId = await createSession(user.id);

		const res = NextResponse.json({
			success: true,
			user: { id: user.id, email: user.email, first_name: user.first_name }
		});

		res.cookies.set("session_id", sessionId, {
			httpOnly: true,
			secure: true, // enable if https
			sameSite: "lax",
			path: "/",
		});

		return res;
	} catch (err) {
		console.error("Error login:", err);
		return NextResponse.json({ error: "Server error" }, { status: 500 });
	}
}