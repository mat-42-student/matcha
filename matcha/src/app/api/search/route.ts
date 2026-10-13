// matcha/src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { searchCompatibleUsers } from "@/lib/db/search";
import { validateFameRange } from "@/lib/validators/serverValidator";

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
    const { distance, ageRange, fameRange, interests, customInterests } = body;

    const fameCheck = validateFameRange(fameRange);
    if (!fameCheck.valid)
      return NextResponse.json({ error: fameCheck.error }, { status: 400 });

    const users = await searchCompatibleUsers(
      me,
      distance,
      ageRange,
      fameRange,
      interests,
      customInterests
    );

    return NextResponse.json({ users });
  } catch (err) {
    console.error("Error in POST /api/search:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}