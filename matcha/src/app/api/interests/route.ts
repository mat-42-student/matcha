// matcha/src/app/api/interests/route.ts

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { getAllInterests } from "@/lib/db/interests";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const interests = await getAllInterests();
    return NextResponse.json(interests);
    
  } catch (err) {
    console.error("Error in /api/interests:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}