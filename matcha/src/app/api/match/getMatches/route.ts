// matcha/src/app/api/match/getMatches/route.ts

import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const me = await getUserByIdFromSession(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { rows: matches } = await pool.query(`
      SELECT uwi.*
      FROM matches m
      JOIN users_with_interests uwi 
        ON uwi.id IN (m.user1_id, m.user2_id)
      WHERE m.status = 'match'
        AND $1 IN (m.user1_id, m.user2_id)   -- je fais partie du match
        AND uwi.id <> $1;                    -- j’exclus moi-même
      `, [me.id]);
    return NextResponse.json(matches);
  } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
