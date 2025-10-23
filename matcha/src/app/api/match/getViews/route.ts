// matcha/src/app/api/match/getViews/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { getViewsForUser } from "@/lib/db/views";
import { completeUserInfos } from "@/lib/db/db-utils";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const stalkers = await getViewsForUser(me.id);
    const res = await completeUserInfos(me, stalkers);
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}