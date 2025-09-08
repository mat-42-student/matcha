// app/api/allpics/[userId]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db-utils";
import { copyFile } from "fs";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  const result = await pool.query(
    'SELECT id, mime_type, encode(data, \'base64\') as data, is_main FROM pictures WHERE user_id = $1 ORDER BY is_main DESC, id ASC',
    [userId]
  );

  if (result.rows.length === 0) {
    console.log("No picture found for userId:", userId);
    return new NextResponse("Not found", { status: 404 });
  }

  const picsJson = result.rows.map((row) => ({
    id: row.id,
    mime_type: row.mime_type ?? "image/jpeg",
    data: row.data,
    is_main: row.is_main,
  }));

  return NextResponse.json(picsJson);
}
