// matcha/src/app/api/match/getViews/route.ts

import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { rows: stalkers } = await pool.query(`
    SELECT u.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(u.latitude, u.longitude))/1000) AS distance
    FROM views v
    JOIN users_with_interests u ON u.id = v.seen_by
    WHERE v.user_id = $3
      AND NOT EXISTS (
        SELECT 1
        FROM matches m
        WHERE
          (
            (m.user1_id = $3 AND m.user2_id = u.id)
            OR
            (m.user1_id = u.id AND m.user2_id = $3)
          )
          AND m.status = 'block'
      )
    ORDER BY v.created_at DESC;
    `, [me.latitude, me.longitude, me.id]);
    return NextResponse.json(stalkers);
  } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
