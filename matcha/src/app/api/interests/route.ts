// matcha/src/app/api/interests/route.ts

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getAllInterests } from "@/lib/db/interests";

export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const interests = await getAllInterests();
    return NextResponse.json(interests);
    
  } catch (err) {
    console.error("Error in /api/interests:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}