// matcha/src/app/api/me/interests/route.ts

import { NextResponse } from "next/server";
import { getUserInterests, updateUserInterests } from "@/lib/db/interests";
import { requireUser } from "@/lib/auth";


export async function GET() {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const interests = await getUserInterests(user.id);
    return NextResponse.json(interests);
  } catch (err) {
    console.error("Error in GET /me/interests:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const body = await req.json();
    const interestIds: number[] = Array.isArray(body.interestIds) ? body.interestIds : [];

    if (!Array.isArray(interestIds) || interestIds.some((id) => typeof id !== "number")) {
      return NextResponse.json({ error: "Invalid data format" }, { status: 400 });
    }

    await updateUserInterests(user.id, interestIds);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error in POST /me/interests:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}