// matcha/src/app/api/users/count/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { getUsersCount } from "@/lib/db/users";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const me = await getSessionUser(sessionId);
    if (!me)
      return NextResponse.json({ error: "User not found" }, { status: 401 });

    const total = await getUsersCount();
    return NextResponse.json({ total });

  } catch (err) {
    console.error("Erreur /api/users/count:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}