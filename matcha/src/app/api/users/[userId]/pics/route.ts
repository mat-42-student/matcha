// app/api/users/[userId]/pics/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getVisibleMainPicture } from "@/lib/db/pictures";
import { isValidUuid } from "@/lib/validators/serverValidator";
import { redirectToPicture } from "@/lib/pictureUrl";

/**
 * GET main picture of a user, usable directly as an <img> src.
 * Redirects to /api/pictures/:id, or to the default avatar if there is none
 * or if either user blocked the other.
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
    return redirectToPicture(picture?.id);
  } catch (err) {
    console.error("Error fetching main picture:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
