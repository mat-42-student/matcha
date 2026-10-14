// app/api/users/[userId]/allpics/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAllPicturesButMain } from "@/lib/db/pictures";
import { isValidUuid } from "@/lib/validators/serverValidator";

/**
 * GET all pictures of a user except main.
 * Returns JSON array: [{ id, mime_type, data }, ...]
 * where data is base64 encoded.
 * 204 if there are none or if either user blocked the other.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const { userId } = await context.params;
    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const pictures = await getAllPicturesButMain(userId, me.id);

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
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
