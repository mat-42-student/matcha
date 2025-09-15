// app/api/users/location/route.ts

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pool } from "@/lib/db/db-utils";

export async function POST(req: NextRequest,
  context: { params: Promise<{ latitude: string, longitude: string }> }
) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;
  const { latitude, longitude, city, country } = await req.json();

  const query = `
  UPDATE users
  SET country = $1, city = $2, latitude = $3, longitude = $4
  WHERE id = (
    SELECT user_id 
    FROM sessions 
    WHERE id = $5 
      AND expires_at > now()
  )`;

  const result = await pool.query(
      query,
      [country, city, latitude, longitude, sessionId]
  );

  return NextResponse.json({ success: true });
}
