import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteNotificationByIdForUser } from "@/lib/db/notifications";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ notificationId: string }> }
) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

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
  } catch (err) {
    console.error("Error in DELETE /me/notifications/[notificationId]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
