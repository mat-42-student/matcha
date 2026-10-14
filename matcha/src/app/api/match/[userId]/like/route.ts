import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";
import { getMatchStatus, likeUser, unlikeUser } from "@/lib/db/likes";
import { hasMainPicture } from "@/lib/db/pictures";
import { sendUnreadMessagesCount } from "@/lib/socket/chat";
import { send, toSocketUser } from "@/lib/socket/socket";
import { LikeStatus, NotifPayload, RelationChangedPayload } from "@/lib/types";

/**
 * Tell the target user, in real time, that the session user changed their relation
 */
function notifyRelationChange(
  me: { id: string; first_name: string },
  targetId: string,
  msg: "like" | "match" | "unlike",
  targetLikeStatus: LikeStatus
) {
  send<NotifPayload>(targetId, "notif", { from: toSocketUser(me), msg });
  send<RelationChangedPayload>(targetId, "relation-changed", { userId: me.id, likeStatus: targetLikeStatus });
}

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

    if (!(await hasMainPicture(me.id))) {
      return NextResponse.json(
        { error: "You need a profile picture to like someone" },
        { status: 403 }
      );
    }

    // block in either direction, or already liked / matched
    const status = await getMatchStatus(me.id, userId);
    if (status === "block") {
      return NextResponse.json({ error: "You cannot like this user" }, { status: 403 });
    }
    if (status === "like" || status === "match") {
      return NextResponse.json({ success: false, newStatus: status });
    }

    const res = await likeUser(me.id, userId);
    if (!res) {
      // relation changed concurrently (already liked, matched or blocked)
      return NextResponse.json({ success: false, newStatus: await getMatchStatus(me.id, userId) });
    }
    if (res === "match") notifyRelationChange(me, userId, "match", "match");
    else notifyRelationChange(me, userId, "like", "isLiked");

    return NextResponse.json({ success: true, newStatus: res });
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

    if (!(await unlikeUser(me.id, userId))) {
      const status = await getMatchStatus(me.id, userId);
      return NextResponse.json({ success: false, newStatus: status });
    }
    notifyRelationChange(me, userId, "unlike", "none");
    await Promise.all([
      sendUnreadMessagesCount(me.id),
      sendUnreadMessagesCount(userId),
    ]);

    return NextResponse.json({ success: true, newStatus: 'none' });
  } catch (err) {
    console.error("Error in DELETE /api/match/[userId]/like:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}