// matcha/src/app/api/geo/cities/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { searchCities } from "@/lib/geocoding";

// City suggestions for the location search of the profile
export async function GET(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (q.length < 2 || q.length > 100) {
      return NextResponse.json({ error: "Search must be 2 to 100 characters" }, { status: 400 });
    }

    const cities = await searchCities(q);
    if (!cities) {
      return NextResponse.json({ error: "City search is unavailable" }, { status: 502 });
    }
    return NextResponse.json(cities);
  } catch (err) {
    console.error("Error in GET /geo/cities:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
