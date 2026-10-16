import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { blockUser } from "@/lib/db/blocks";

export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    if (me.id === userId) {
      return NextResponse.json({ error: "You cannot block yourself" }, { status: 400 });
    }

    const success = await blockUser(me.id, userId);

    return NextResponse.json({ success });
  } catch (err) {
    console.error("Error in POST /api/match/[userId]/block:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}