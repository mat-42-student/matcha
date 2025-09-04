// app/api/pics/[userId]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db-utils";

export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params; // ✅ il faut await ici
  console.log("Fetching picture for userId:", userId);

  console.log(`SELECT url, mime_type, data FROM pictures WHERE user_id = '${userId}' LIMIT 1`)
  const result = await pool.query(
    "SELECT url, mime_type, data FROM pictures WHERE user_id = $1 LIMIT 1",
    [userId]
  );

  console.log("Database query result:", result.rows);
  if (result.rows.length === 0) {
    console.log("No picture found for userId:", userId);
    return new NextResponse("Not found", { status: 404 });
  }

  const { url, mime_type, data } = result.rows[0];

  if (url) {
    console.log("Redirecting to URL:", url);
    return NextResponse.json({ url });
  }

  if (data) {
    console.log("Serving image data for userId:", userId);
    return new NextResponse(data, {
      headers: {
        "Content-Type": mime_type ?? "image/jpeg",
        "Content-Length": data.length.toString(),
      },
    });
  }

  console.log("No image data or URL found for userId:", userId);
  return new NextResponse("No image available", { status: 404 });
}