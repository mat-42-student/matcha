// app/api/pics/[userId]/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db-utils";

export async function GET(req: Request, params: any) {
  const { userId } = await params;
  console.log("Fetching picture for userId:", userId);

  const result = await pool.query(
    "SELECT url, mime_type, data FROM pictures WHERE user_id = $1 LIMIT 1",
    [params.userId]
  );

  if (result.rows.length === 0) {
    console.log("No picture found for userId:", params.userId);
    return new NextResponse("Not found", { status: 404 });
  }

  const { url, mime_type, data } = result.rows[0];

  if (url) { // If URL exists, redirect to it
    console.log("Redirecting to URL:", url);
    return NextResponse.json({ url });
  }
  if (data) {
    return new NextResponse(data, {
      headers: {
        "Content-Type": mime_type,
        "Content-Length": data.length.toString(),
      },
    });
  }
  console.log("No image data or URL found for userId:", params.userId);
  return new NextResponse("No image available", { status: 404 });
}
