// matcha/src/app/api/chat/[userId]/route.ts
import { NextResponse } from "next/server";
import { getChatPartner, getConversation } from "@/lib/db/chat";
import { requireUser } from "@/lib/auth";
import { isValidUuid } from "@/lib/validators/serverValidator";

// Get all mesages between the authenticated user and userId
// Only while matched and not blocked: the history is no longer readable after an unmatch or a block
// Read only: opening the conversation emits chat-mark-read, which marks it read and updates the counters
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
    if (!(await getChatPartner(me.id, userId))) {
      return NextResponse.json({ error: "You can only chat with your matches" }, { status: 403 });
    }

    const conversation = await getConversation(me.id, userId);
    return NextResponse.json(conversation);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
