// matcha/src/app/api/chat/[userId]/route.ts
import { NextResponse } from "next/server";
import { getConversation } from "@/lib/db/chat";
import { requireUser } from "@/lib/auth";
import { send } from "@/lib/socket/socket";

// Get all mesages between the authenticated user and userId
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const { userId } = await context.params;
    const conversation = await getConversation(me.id, userId);
    if (conversation.length === 0) {
      return new NextResponse(null, { status: 204 });
    }
    send(me.id, "chat-unread-count", [{ sender_id: userId, unread_count: 0 }]);
    return NextResponse.json(conversation);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}