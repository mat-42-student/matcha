// app/api/search/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";

export async function POST(req: Request) {
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

    const body = await req.json();
    const { distance, ageMin, ageMax, fame, interests } = body;

    let query = `
      SELECT *
      FROM compatible_users_from($1)
      WHERE 1=1
    `;
    const params: any[] = [me.id];

    if (distance) {
      query += ` AND distance <= $${params.length + 1}`;
      params.push(distance);
    }
    if (ageMin) {
      query += ` AND u.age >= $${params.length + 1}`;
      params.push(ageMin);
    }
    if (ageMax) {
      query += ` AND u.age <= $${params.length + 1}`;
      params.push(ageMax);
    }
    if (fame) {
      query += ` AND u.fame >= $${params.length + 1}`;
      params.push(fame);
    }
    if (interests && interests.length > 0) {
      query += ` AND EXISTS (
        SELECT 1 FROM user_interests ui
        WHERE ui.user_id = u.id
        AND ui.interest_id = ANY($${params.length + 1})
      )`;
      params.push(interests);
    }

    console.log("Executing query:", query, "with params:", params);
    const result = await pool.query(query, params);
    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
