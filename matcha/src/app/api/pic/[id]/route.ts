// app/api/pics/[id]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db-utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log("Fetching picture with ID:", params.id);
  const result = await pool.query(
    "SELECT data, mime_type FROM photos WHERE id = $1",
    [params.id]
  );

  if (result.rows.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }

  const { data, mime_type } = result.rows[0];

  return new NextResponse(data, {
    headers: {
      "Content-Type": mime_type,
      "Content-Length": data.length.toString(),
    },
  });
}
