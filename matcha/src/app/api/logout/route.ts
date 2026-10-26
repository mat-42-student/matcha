import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/db/session";
import { closeSessionSockets } from "@/lib/socket/socket";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (sessionId) {
      const userId = await deleteSession(sessionId);
      // the other tabs of this session go back to the login page
      if (userId) closeSessionSockets(userId, sessionId);
    }

    const res = NextResponse.json({ success: true });
    res.cookies.set("session_id", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    return res;
  } catch (err) {
    console.error("Error logout:", err);
    return NextResponse.json({ error: "Error serveur" }, { status: 500 });
  }
}