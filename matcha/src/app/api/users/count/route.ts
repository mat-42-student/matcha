// matcha/src/app/api/users/count/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getUsersCount } from "@/lib/db/users";

export async function GET() {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const total = await getUsersCount();
    return NextResponse.json({ total });

  } catch (err) {
    console.error("Erreur /api/users/count:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}