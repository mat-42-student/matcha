// matcha/src/app/api/users/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { updateUserLocationBySession } from "@/lib/db/users";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  if (!sessionId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { latitude, longitude, city, country } = await req.json();

  await updateUserLocationBySession(sessionId, latitude, longitude, city, country);

  return NextResponse.json({ success: true });
}