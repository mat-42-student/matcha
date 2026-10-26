import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";

export async function GET() {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const completion = await analyzeProfileCompletion(user);
    return NextResponse.json(completion);
  } catch (err) {
    console.error("Error in GET /me/completion:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
