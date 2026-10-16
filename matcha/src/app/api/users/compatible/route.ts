// matcha/src/app/api/users/compatible/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getCompatibleUsers } from "@/lib/db/search";
import { rankUsers } from "@/lib/matching";

export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const users = await getCompatibleUsers(me.id);
    const res = rankUsers(me, users)

    return NextResponse.json(res);

  } catch (err) {
    console.error("Erreur /api/users/compatible:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}