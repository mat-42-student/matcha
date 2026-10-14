// matcha/src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { searchCompatibleUsers } from "@/lib/db/search";
import { validateSearchCriteria } from "@/lib/validators/serverValidator";
import { SearchCriteria } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const me = await getSessionUser(sessionId);
    if (!me)
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const check = validateSearchCriteria(body);
    if (!check.valid)
      return NextResponse.json({ error: check.error }, { status: 400 });

    const { distance, ageRange, fameRange, interests, customInterests } = body as SearchCriteria;

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
