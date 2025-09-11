// app/api/users/[userId]/location/route.ts

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db-utils";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ userId: string, latitude: string, longitude: string }> }
) {
  const { userId } = await context.params;
  const { latitude, longitude, city, country } = await req.json();

  const result = await pool.query(
    "UPDATE users SET country = $1, city = $2, latitude = $3, longitude = $4 WHERE id = $5",
    [country, city, latitude, longitude, userId]
  );

  return NextResponse.json({ success: true });
}
