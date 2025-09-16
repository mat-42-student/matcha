// app/api/users/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { getUserByIdFromSession } from "@/lib/db/session";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
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
      SELECT 
        id, username, gender, city, bio,
        date_part('year', age(current_date, birthday))::int AS age
      FROM users
      WHERE id != $1
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await pool.query(query, [me.id, limit, offset]);
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Erreur /api/users:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

}
