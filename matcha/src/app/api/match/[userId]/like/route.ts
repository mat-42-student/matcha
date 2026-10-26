import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMatchStatus, likeUser, unlikeUser } from "@/lib/db/likes";
import { hasMainPicture } from "@/lib/db/pictures";
import { getFame } from "@/lib/db/users";
import { sendUnreadMessagesCount } from "@/lib/socket/chat";
import { send, toSocketUser } from "@/lib/socket/socket";
import { LikeStatus, NotifPayload, RelationChangedPayload } from "@/lib/types";
import { isValidUuid } from "@/lib/validators/serverValidator";

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
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
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
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
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

    // fame of the target, recomputed from the new state
    return NextResponse.json({ success: true, newStatus: res, fame: await getFame(userId) });
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
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const removed = await unlikeUser(me.id, userId);
    if (!removed) {
      const status = await getMatchStatus(me.id, userId);
      return NextResponse.json({ success: false, newStatus: status });
    }
    if (removed === "match") {
      // Only an unmatch is notified (subject: "unliked by a connected user")
      notifyRelationChange(me, userId, "unlike", "none");
      await Promise.all([
        sendUnreadMessagesCount(me.id),
        sendUnreadMessagesCount(userId),
      ]);
    } else {
      // Silent: the target's UI and notification list still need to drop the like
      send<RelationChangedPayload>(userId, "relation-changed", { userId: me.id, likeStatus: "none" });
    }

    return NextResponse.json({ success: true, newStatus: 'none', fame: await getFame(userId) });
  } catch (err) {
    console.error("Error in DELETE /api/match/[userId]/like:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}