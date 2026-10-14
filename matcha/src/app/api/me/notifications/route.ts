// matcha/src/app/api/me/notifications/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteAllNotificationsByUser, getNotificationsByUser } from "@/lib/db/notifications";

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
