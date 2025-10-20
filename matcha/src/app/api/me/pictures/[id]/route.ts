// matcha/src/app/api/me/pictures/[id]/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { deleteUserPicture } from "@/lib/db/pictures";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { id } = params;
    if (!id || isNaN(Number(id))) {
      return NextResponse.json({ error: "Invalid picture ID" }, { status: 400 });
    }

    await deleteUserPicture(user.id, id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting picture:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}