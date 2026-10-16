// matcha/src/app/api/me/blocks/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getBlockedUsers } from "@/lib/db/blocks";

// GET users blocked by the session user
export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const blocked = await getBlockedUsers(me.id);
    return NextResponse.json(blocked);
  } catch (err) {
    console.error("Error in GET /api/me/blocks:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
