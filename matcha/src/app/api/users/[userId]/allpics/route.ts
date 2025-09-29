// app/api/users/[userId]/allpics/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;

  const result = await pool.query(`
    SELECT id, mime_type, encode(data, 'base64') as data 
    FROM pictures 
    WHERE user_id = $1 AND NOT is_main`,
    [userId]
  );

  if (result.rows.length === 0) {
    return new NextResponse(null, { status: 204 });
  }

  const picsJson = result.rows.map((row) => ({
    id: row.id,
    mime_type: row.mime_type ?? "image/jpeg",
    data: row.data,
  }));

  return NextResponse.json(picsJson);
}