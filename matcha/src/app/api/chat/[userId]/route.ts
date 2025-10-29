// matcha/src/app/api/chat/[userId]/route.ts
import { NextResponse } from "next/server";
import { getConversation } from "@/lib/db/chat";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { send } from "@/lib/socket/socket";

// Get all mesages between the authenticated user and userId
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { userId } = await context.params;
    const conversation = await getConversation(me.id, userId);
    if (conversation.length === 0) {
      return new NextResponse(null, { status: 204 });
    }
    send(me.id, "chat-unread-count", [{ 'sender-id': userId, 'unread-count': 0 }]);
    return NextResponse.json(conversation);
  } catch (err) {
    console.error("Error fetching conversation:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}