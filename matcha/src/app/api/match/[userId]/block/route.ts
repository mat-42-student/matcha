// matcha/src/app/api/match/[userId]/block/route.ts

import { pool, addFame } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";

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
      INSERT INTO matches (user1_id, user2_id, status)
      VALUES ($1, $2, 'block')
      ON CONFLICT (user1_id, user2_id)
      DO UPDATE SET status = 'block';
    `;
    const result = await pool.query(query, [me.id, userId]);
    addFame(-5, userId);

    return NextResponse.json({ success: true, deleted: result.rowCount });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
