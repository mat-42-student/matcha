// matcha/src/app/api/match/[userId]/views/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";
import { recordProfileView } from "@/lib/db/views";
import { cookies } from "next/headers";
import { send } from "@/lib/socket/socket";

/**
 * POST /api/match/[userId]/views
 * Records that the current user viewed another user's profile.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const viewer = await getSessionUser(sessionId);
    if (!viewer) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (viewer.id === userId) {
      return NextResponse.json({ error: "You cannot view your own profile" }, { status: 400 });
    }

    const scored: boolean = await recordProfileView(userId, viewer.id);
    if (scored) {
      send(userId, "notif", {
        from: viewer,
        to: viewer,
        msg: "view",
      });
    }

    return NextResponse.json({ scored });
  } catch (err) {
    console.error("Error in POST /api/match/[userId]/views:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}