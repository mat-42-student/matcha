// matcha/src/app/api/search/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { searchCompatibleUsers } from "@/lib/db/search";
import { validateSearchCriteria } from "@/lib/validators/serverValidator";
import { SearchCriteria } from "@/lib/types";

export async function POST(req: Request) {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

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
