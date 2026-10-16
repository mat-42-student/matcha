// app/api/users/[userId]/report/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { reportUser } from "@/lib/db/blocks";
import { isValidUuid } from "@/lib/validators/serverValidator";

/**
 * POST report a user as a fake account (also blocks them).
 * Reporting twice is a no-op.
 */
export async function POST(
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
    if (me.id === userId) {
      return NextResponse.json({ error: "You cannot report yourself" }, { status: 400 });
    }

    const found = await reportUser(me.id, userId);
    if (!found) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ reported: true });
  } catch (err) {
    console.error("Error in POST /api/users/[userId]/report:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
