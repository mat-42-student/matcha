// app/api/users/[userId]/pics/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  const result = await pool.query(
    "SELECT mime_type, data FROM pictures WHERE user_id = $1 AND is_main = true",
    [userId]
  );

  if (result.rows.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { mime_type, data } = result.rows[0];

  if (data) {
    return new NextResponse(data, {
      headers: {
        "Content-Type": mime_type ?? "image/jpeg",
        "Content-Length": data.length.toString(),
      },
    });
  }

  return new NextResponse("No image available", { status: 404 });
}