// matcha/src/app/api/interests/route.ts

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { createInterest, getAllInterests } from "@/lib/db/interests";
import { cleanInterestName } from "@/lib/validators/serverValidator";
import { MAX_INTEREST_LENGTH } from "@/lib/types";

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

// Create a tag (or get the existing one with the same name): it does not select it for the user
export async function POST(req: Request) {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const body = await req.json().catch(() => null);
    const name = cleanInterestName(body?.name);
    if (!name) {
      return NextResponse.json(
        { error: `2-${MAX_INTEREST_LENGTH} letters, digits, spaces, ' & or -` },
        { status: 400 }
      );
    }

    const { interest, created } = await createInterest(name);
    return NextResponse.json(interest, { status: created ? 201 : 200 });
  } catch (err) {
    console.error("Error in POST /api/interests:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}