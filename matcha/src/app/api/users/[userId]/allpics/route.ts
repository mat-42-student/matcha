// app/api/users/[userId]/allpics/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAllPicturesButMain } from "@/lib/db/pictures";
import { isValidUuid } from "@/lib/validators/serverValidator";

/**
 * GET all pictures of a user except main.
 * Returns JSON array: [{ id }, ...], content served by /api/pictures/:id.
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

    return NextResponse.json(pictures);
  } catch (err) {
    console.error("Error fetching all pictures:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
