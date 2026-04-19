import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { deleteNotificationByIdForUser } from "@/lib/db/notifications";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const { notificationId } = await params;
    const id = Number(notificationId);

    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
    }

    const deleted = await deleteNotificationByIdForUser(id, user.id);
    if (!deleted) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in DELETE /me/notifications/[notificationId]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
