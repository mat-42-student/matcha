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
    const { distance, ageRange, fame, interests, customInterests } = body;

    let query = `
      SELECT *
      FROM compatible_users_from($1) AS c
      WHERE 1=1
    `;
    const params: any[] = [me.id];

    if (distance && distance < 500) {
      query += ` AND c.distance <= $${params.length + 1}`;
      params.push(distance);
    }
    if (ageRange) {
      query += ` AND c.age >= $${params.length + 1}`;
      params.push(ageRange[0]);
      query += ` AND c.age <= $${params.length + 1}`;
      params.push(ageRange[1]);
    }
    if (fame) {
      query += ` AND c.fame >= $${params.length + 1}`;
      params.push((fame - 1) * 20); // because fame is 0-100 in DB
    }
    if (interests === "similar") {
      query += ` AND EXISTS (
        SELECT 1
        FROM user_interests ui_me
        JOIN user_interests ui_them ON ui_them.interest_id = ui_me.interest_id
        WHERE ui_me.user_id = $1 AND ui_them.user_id = c.id
      )`;
    }
    if (interests === "custom" && customInterests.length > 0) {
      query += ` AND ARRAY(SELECT jsonb_array_elements_text(interests::jsonb)) && $${params.length + 1}`;
      params.push(customInterests);
    }

    console.log("Executing query:", query, "with params:", params);
    const result = await pool.query(query, params);
    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
