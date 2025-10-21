import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";
import { getMatchStatus, likeUser, unlikeUser } from "@/lib/db/likes";

/**
 * GET /api/match/[userId]/like
 * Returns match status between the current user and target user.
 */
export async function GET(
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


    const status = await getMatchStatus(me.id, userId);
    return NextResponse.json({ status });
  } catch (err) {
    console.error("Error in GET /api/match/[userId]/like:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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

    if (me.id === userId) return new NextResponse(null, { status: 204 });

    await likeUser(me.id, userId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/match/[userId]/like
 * Unlikes or unmatches another user.
 */
export async function DELETE(
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

    const deleted = await unlikeUser(me.id, userId);
    return NextResponse.json({ success: true, deleted });
  } catch (err) {
    console.error("Error in DELETE /api/match/[userId]/like:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}