// matcha/src/app/api/match/[userId]/status/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const me = await getUserByIdFromSession(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const query = `
      SELECT CASE
        WHEN EXISTS (
          SELECT 1 FROM matches WHERE (user1_id = $1 AND user2_id = $2)
                                    OR(user1_id = $2 AND user2_id = $1)
                                    AND status = 'match'
        )
        THEN 'match'
        WHEN EXISTS (
          SELECT 1 FROM matches WHERE user1_id = $1 AND user2_id = $2 AND status = 'like'
        )
        THEN 'like'
        WHEN EXISTS (
          SELECT 1 FROM matches WHERE user1_id = $2 AND user2_id = $1 AND status = 'like'
        )
        THEN 'isLiked'
        ELSE 'none'
      END AS status
    `;
    const result = await pool.query(query, [me.id, userId]);
    return NextResponse.json({ status: result.rows[0].status });  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
