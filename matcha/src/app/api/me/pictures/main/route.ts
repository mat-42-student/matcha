// matcha/src/app/api/me/pictures/main/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { getMainPicture } from "@/lib/db/pictures";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await getSessionUser(sessionId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 401 });

    const picture = await getMainPicture(user.id);
    if (!picture)
      return new NextResponse(null, { status: 204 });

    return NextResponse.json(picture);
  } catch (err) {
    console.error("Error in GET /api/me/pictures/main:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}