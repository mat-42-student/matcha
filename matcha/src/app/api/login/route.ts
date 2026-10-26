// matcha/src/app/api/login/route.ts

import { NextResponse, NextRequest } from "next/server";
import { createSession } from "@/lib/db/session";
import { loginUser } from "@/lib/db/users";
import { locateUserByIp } from "@/lib/geoip";
import { hasValidEmailToken } from "@/lib/db/emails";
import { sendVerificationEmail } from "@/lib/mail";
import { clientIp, hitRateLimit, isRateLimited, recordHit, tooManyRequests } from "@/lib/rateLimit";

// Any attempt, per IP (an evaluator logs into several accounts: kept wide)
const IP_LIMIT = 30;
const IP_WINDOW_MS = 5 * 60_000;
// Failed attempts, per account: slows down password guessing even from many IPs
const FAIL_LIMIT = 10;
const FAIL_WINDOW_MS = 15 * 60_000;

export async function POST(req: NextRequest) {
	try {
		if (hitRateLimit(`login:${clientIp(req)}`, IP_LIMIT, IP_WINDOW_MS)) return tooManyRequests();

		const formData = await req.formData().catch(() => null);
		const identifier = formData?.get("identifier");
		const password = formData?.get("password");

		if (typeof identifier !== "string" || typeof password !== "string" || !identifier || !password) {
			return NextResponse.json({ error: "Missing fields" }, { status: 400 });
		}

		const failKey = `login-fail:${identifier.trim().toLowerCase()}`;
		if (isRateLimited(failKey, FAIL_LIMIT, FAIL_WINDOW_MS)) return tooManyRequests();

		const user = await loginUser(identifier, password);
		if (!user) {
			recordHit(failKey, FAIL_WINDOW_MS);
			return NextResponse.json({ error: "Invalid login" }, { status: 401 });
		}

		// checked after the password so that it does not tell who has an unverified account
		if (!user.is_verified) {
			// the signup link expired: send a new one so that the account is not stuck
			if (!(await hasValidEmailToken(user.id, "verify"))) {
				await sendVerificationEmail(user.id, user.email).catch((err) => console.error("Error verification email:", err));
			}
			return NextResponse.json(
				{ error: "Please verify your email first: check your inbox for the verification link" },
				{ status: 403 }
			);
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