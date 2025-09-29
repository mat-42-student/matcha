import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const client = await pool.connect();
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

    if (me.id === userId) {
      return new NextResponse(null, { status: 204 });
    }

    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT * FROM matches 
       WHERE user1_id = $1 AND user2_id = $2`,
      [userId, me.id]
    );

    if (existing.rows.length > 0 && existing.rows[0].status === "like") {
      await client.query(
        `UPDATE matches SET status = 'match' 
         WHERE user1_id = $1 AND user2_id = $2`,
        [userId, me.id]
      );
    } else {
      await client.query(
        `INSERT INTO matches (user1_id, user2_id, status)
         VALUES ($1, $2, 'like')
         ON CONFLICT (user1_id, user2_id) DO NOTHING`,
        [me.id, userId]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json({ success: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  } finally {
    client.release();
  }
}
