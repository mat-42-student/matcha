// matcha/src/app/api/match/getMatches/route.ts

import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";

export async function GET() {
  console.log("GETMATCHES")
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

    const { rows: matches } = await pool.query(
    `SELECT 
    u.id,
    u.username,
    u.bio,
    u.city,
    u.gender,
    date_part('year', age(current_date, u.birthdate))::int AS age
    FROM matches m
    JOIN users u 
        ON u.id = CASE 
                    WHEN m.user1_id = $1 THEN m.user2_id
                    ELSE m.user1_id
                END
    WHERE (m.user1_id = $1 OR m.user2_id = $1)
    AND m.status = 'match'`,
    [me.id]
    );
    console.log("MATCHES", matches)
    return NextResponse.json(matches);
  } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
