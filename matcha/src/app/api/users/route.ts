// app/api/users/route.ts
// it seems this endpoint is never called

import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";

export async function GET(req: Request) {
  try {
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
      SELECT u.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(u.latitude, u.longitude))/1000) AS distance
      FROM users_with_interests u
      WHERE u.id != $3
    `;

    const { rows: users } = await pool.query(query, [me.latitude, me.longitude, me.id]);
    return NextResponse.json(users);
  } catch (err) {
    console.error("Erreur /api/users:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

}
