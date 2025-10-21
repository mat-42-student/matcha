// app/api/users/[userId]/allpics/route.ts
import { NextResponse } from "next/server";
import { getAllPicturesButMain } from "@/lib/db/pictures";

/**
 * GET all pictures of a user except main.
 * Returns JSON array: [{ id, mime_type, data }, ...]
 * where data is base64 encoded.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const pictures = await getAllPicturesButMain(userId);

    if (pictures.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    // Map DB rows to JSON objects
    const picsJson = pictures.map((row) => ({
      id: row.id,
      mime_type: row.mime_type ?? "image/jpeg",
      data: row.data,
    }));

    return NextResponse.json(picsJson);
  } catch (err) {
    console.error("Error fetching all pictures:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}