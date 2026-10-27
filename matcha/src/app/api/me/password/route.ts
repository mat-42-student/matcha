// matcha/src/app/api/me/password/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { changeUserPassword } from "@/lib/db/users";
import { deleteOtherSessionsForUser } from "@/lib/db/session";
import { closeOtherSessionSockets } from "@/lib/socket/socket";
import { isRateLimited, recordHit, tooManyRequests } from "@/lib/rateLimit";
import { validatePassword } from "@/lib/validators/serverValidator";

// Wrong current passwords, per account: a stolen session cannot guess the password
const FAIL_LIMIT = 5;
const FAIL_WINDOW_MS = 15 * 60_000;

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const body = await req.json().catch(() => null);
    const current_password: unknown = body?.current_password;
    const new_password: unknown = body?.new_password;
    if (typeof current_password !== "string" || typeof new_password !== "string"
      || !current_password || !new_password) {
      return NextResponse.json({ error: "missing field" }, { status: 400 });
    }

    const passwordErrors = validatePassword(new_password);
    if (passwordErrors.length > 0) {
      return NextResponse.json({ field: "new_password", errors: passwordErrors }, { status: 400 });
    }

    const failKey = `password-change-fail:${user.id}`;
    if (isRateLimited(failKey, FAIL_LIMIT, FAIL_WINDOW_MS)) return tooManyRequests();

    const success = await changeUserPassword(user.id, current_password, new_password);
    if (!success) {
      recordHit(failKey, FAIL_WINDOW_MS);
      return NextResponse.json({ error: "Incorrect password" }, { status: 400 });
    }

    // the other devices are logged out, sockets included; this one stays logged in
    // (requireUser succeeded, so the cookie holds a valid session)
    const sessionId = (await cookies()).get("session_id")!.value;
    await deleteOtherSessionsForUser(user.id, sessionId);
    closeOtherSessionSockets(user.id, sessionId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur changement mot de passe :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
