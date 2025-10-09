// matcha/src/app/api/match/[userId]/views/route.ts

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

    const seen_by = await getSessionUser(sessionId);
    if (!seen_by) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const query = `
        INSERT INTO views (user_id, seen_by)
        VALUES ($1, $2)
        ON CONFLICT (user_id, seen_by)
        DO UPDATE SET created_at = CURRENT_TIMESTAMP;
    `;
    await pool.query(query, [userId, seen_by.id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
