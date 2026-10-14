// matcha/src/app/api/match/getLikeMe/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUsersWhoLikedMe } from "@/lib/db/likes";
import { completeUserInfos } from "@/lib/db/db-utils";

export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const likedBy = await getUsersWhoLikedMe(me.id);
    const res = await completeUserInfos(me, likedBy);
    
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}