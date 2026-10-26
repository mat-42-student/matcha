// matcha/src/app/api/me/notifications/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteAllNotificationsByUser, getNotificationsByUser, markNotificationsAsRead } from "@/lib/db/notifications";
import { send } from "@/lib/socket/socket";

export async function GET() {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const notifications = await getNotificationsByUser(user.id);
    return NextResponse.json(notifications);
  } catch (err) {
    console.error("Error in GET /me/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Bell opened: { upTo } is the most recent notification id shown
export async function PATCH(req: Request) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const body = await req.json().catch(() => null);
    const upTo = body?.upTo;
    if (!Number.isInteger(upTo) || upTo <= 0) {
      return NextResponse.json({ error: "Invalid notification id" }, { status: 400 });
    }

    // the badge of the user's other tabs goes down too
    if (await markNotificationsAsRead(user.id, upTo)) send(user.id, "notifications-changed", null);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in PATCH /me/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    await deleteAllNotificationsByUser(user.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in DELETE /me/notifications:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
