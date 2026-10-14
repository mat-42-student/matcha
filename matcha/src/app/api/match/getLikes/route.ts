// matcha/src/app/api/match/getLikes/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUsersILike } from "@/lib/db/likes";
import { completeUserInfos } from "@/lib/db/db-utils";

export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const likedUsers = await getUsersILike(me.id);
    const res = await completeUserInfos(me, likedUsers);
    
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}