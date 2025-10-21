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

//     const query = `
//       SELECT CASE
//         WHEN EXISTS (
//           SELECT 1 FROM matches WHERE ((user1_id = $1 AND user2_id = $2)
//             OR(user1_id = $2 AND user2_id = $1))
//             AND status = 'match'
//         )
//         THEN 'match'
//         WHEN EXISTS (
//           SELECT 1 FROM matches WHERE user1_id = $1 AND user2_id = $2 AND status = 'like'
//         )
//         THEN 'like'
//         WHEN EXISTS (
//           SELECT 1 FROM matches WHERE user1_id = $2 AND user2_id = $1 AND status = 'like'
//         )
//         THEN 'isLiked'
//         ELSE 'none'
//       END AS status
//     `;
//     const result = await pool.query(query, [me.id, userId]);
//     return NextResponse.json({ status: result.rows[0].status });  } catch (err) {
//     console.error(err);
//     return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
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