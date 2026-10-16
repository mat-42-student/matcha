import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { blockUser, unblockUser } from "@/lib/db/blocks";
import { sendBlock } from "@/lib/socket/socket";
import { isValidUuid } from "@/lib/validators/serverValidator";

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }
    if (me.id === userId) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
    }

    const success = await blockUser(me.id, userId);
    if (success) sendBlock(me.id, userId);

    return NextResponse.json({ success });
  } catch (err) {
    console.error("Error in POST /api/match/[userId]/block:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/match/[userId]/block
 * Removes my block on userId. Likes removed by the block are not restored.
 */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    const unblocked = await unblockUser(me.id, userId);
    if (!unblocked) {
      return NextResponse.json({ error: "This user is not blocked" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /api/match/[userId]/block:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
