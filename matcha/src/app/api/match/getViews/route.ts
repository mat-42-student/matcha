// matcha/src/app/api/match/getViews/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getViewsForUser } from "@/lib/db/views";
import { rankUsers } from "@/lib/matching";

export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const stalkers = await getViewsForUser(me.id);
    const res = rankUsers(me, stalkers);
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}