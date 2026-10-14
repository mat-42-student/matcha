// app/api/users/[userId]/pics/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getVisibleMainPicture } from "@/lib/db/pictures";
import { isValidUuid } from "@/lib/validators/serverValidator";

/**
 * GET main picture of a user.
 * Returns JSON: { mime_type, data } where data is base64 encoded.
 * 204 if there is none or if either user blocked the other.
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

    const picture = await getVisibleMainPicture(userId, me.id);

    // If no main picture found → 204 No Content
    if (!picture) {
      return new NextResponse(null, { status: 204 });
    }

    // Return JSON with base64 data
    return NextResponse.json({
      id: picture.id,
      mime_type: picture.mime_type ?? "image/jpeg",
      data: picture.data,
    });
  } catch (err) {
    console.error("Error fetching main picture:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
