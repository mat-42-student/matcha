// matcha/src/app/api/match/[userId]/unlike/route.ts
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";

export async function POST(
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

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const query = `
      DELETE FROM matches
      WHERE (user1_id = $1 AND user2_id = $2)
      OR (user1_id = $2 AND user2_id = $1);
    `;
    const result = await pool.query(query, [me.id, userId]);
    return NextResponse.json({ success: true, deleted: result.rowCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
