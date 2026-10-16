// matcha/src/app/api/match/getLikes/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUsersILike } from "@/lib/db/likes";
import { rankUsers } from "@/lib/matching";

export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const likedUsers = await getUsersILike(me.id);
    const res = rankUsers(me, likedUsers);
    
    return NextResponse.json(res);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}