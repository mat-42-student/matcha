// matcha/src/app/api/me/notifications/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { getNotificationsByUser } from "@/lib/db/notifications";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const notifications = await getNotificationsByUser(user.id);
    return NextResponse.json(notifications);
  } catch (err: any) {
    console.error("Error in GET /me/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}