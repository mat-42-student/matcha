// matcha/src/app/api/match/getLikes/route.ts

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

    const { rows: likedUsers } = await pool.query(`
      SELECT u.*, ceil(earth_distance(ll_to_earth($1, $2), ll_to_earth(u.latitude, u.longitude))/1000) AS distance
      FROM users_me_like u
      WHERE u.me = $3
    `,
    [me.latitude, me.longitude, me.id]
    );
    return NextResponse.json(likedUsers);
  } catch (err) {
      console.error(err);
      return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
