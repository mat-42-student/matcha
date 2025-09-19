// matcha/src/app/api/match/[userId]/like/route.ts
import { NextResponse, NextRequest } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";



export async function POST(req: NextRequest, context: { params: { userId: string } }) {
  try {
    const params = context.params; // attendre les params dynamiques
    const likedUserId = await params.userId;
     const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    console.log("Liked: ", params.userId);
    
    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const me = await getUserByIdFromSession(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    if (me.id === likedUserId) {
      return NextResponse.json({ error: "Narcissistic" }, { status: 400 });
    }

    const query = `
      INSERT INTO matches (user1_id, user2_id, status)
      VALUES ($1, $2, 'like')
      ON CONFLICT (user1_id, user2_id) DO NOTHING
    `;
    await pool.query(query, [me.id, likedUserId]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
