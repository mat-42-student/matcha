// app/api/users/[userId]/allpics/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
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
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

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
