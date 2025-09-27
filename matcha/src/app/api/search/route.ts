// app/api/search/route.ts

import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { gender, distance, ageMin, ageMax, fame, interests } = body;

    // Exemple de construction dynamique
    let query = `
      SELECT *
      FROM users_with_interests uwi
      WHERE 1=1
    `;
    const params: any[] = [];

    if (gender && gender !== "any") {
      query += ` AND u.gender = $${params.length + 1}`;
      params.push(gender);
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

    const result = await pool.query(query, params);
    return NextResponse.json({ users: result.rows });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
