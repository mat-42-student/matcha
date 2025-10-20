import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { blockUser } from "@/lib/db/matches";

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

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    if (me.id === userId) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
    }

    const success = await blockUser(me.id, userId);

    return NextResponse.json({ success });
  } catch (err) {
    console.error("Error in POST /api/match/[userId]/block:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}