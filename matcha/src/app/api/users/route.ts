// app/api/users/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const limit = 12;
  const offset = (page - 1) * limit;

  const query = `
    SELECT 
      u.id, u.username, u.gender, u.city, u.bio,
      date_part('year', age(current_date, u.birthday))::int AS age
    FROM users u
    LEFT JOIN sessions s
      ON s.user_id = u.id
      AND s.id = $1
      AND s.expires_at > now()
    WHERE s.user_id IS NULL
    LIMIT $2 OFFSET $3
  `;

  const { rows } = await pool.query(query, [sessionId, limit, offset]);

  return NextResponse.json(rows);
}
