// matcha/src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { searchCompatibleUsers } from "@/lib/db/search";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const me = await getSessionUser(sessionId);
    if (!me)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const body = await req.json();
    console.log("body: ", body)
    const { distance, ageRange, fame, interests, customInterests } = body;

    const users = await searchCompatibleUsers(
      me,
      distance,
      ageRange,
      fame,
      interests,
      customInterests
    );

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Error in POST /api/search:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}