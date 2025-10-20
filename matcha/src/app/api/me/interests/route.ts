// matcha/src/app/api/me/interests/route.ts

import { NextResponse } from "next/server";
import { getUserInterests, updateUserInterests } from "@/lib/db/interests";
import { getSessionUser } from "@/lib/db/session";
import { cookies } from "next/headers";


export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const interests = await getUserInterests(user.id);
    return NextResponse.json(interests);
  } catch (err: any) {
    console.error("Error in GET /me/interests:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const body = await req.json();
    const interestIds: number[] = Array.isArray(body.interestIds) ? body.interestIds : [];

    if (!Array.isArray(interestIds) || interestIds.some((id) => typeof id !== "number")) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await updateUserInterests(user.id, interestIds);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in POST /me/interests:", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}