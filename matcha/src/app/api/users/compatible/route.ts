// matcha/src/app/api/users/compatible/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { getCompatibleUsers } from "@/lib/db/search";
import { completeUserInfos } from "@/lib/db/db-utils";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId)
      return NextResponse.json({ error: "Not authentificated" }, { status: 401 });

    const me = await getSessionUser(sessionId);
    if (!me)
      return NextResponse.json({ error: "User not found" }, { status: 401 });

    const users = await getCompatibleUsers(me.id);
    const res = await completeUserInfos(me, users)

    return NextResponse.json(res);

  } catch (err) {
    console.error("Erreur /api/users/compatible:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}