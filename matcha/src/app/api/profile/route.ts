// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateUser, type User } from "@/lib/db/users";
import { getSessionUser } from "@/lib/db/session";
import { validateProfileField } from "@/lib/validators/serverValidator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const sessionId = req.cookies.get("session_id")?.value || null;
    if (!sessionId) {
      return NextResponse.json({ error: "Not authentificated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(body)) {
      const { valid, error } = validateProfileField(field, value);
      if (!valid) {
        return NextResponse.json({ error: error || "Invalid value" }, { status: 400 });
      }
      updates[field] = value;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update given" }, { status: 400 });
    }

    // every field went through validateProfileField, which rejects anything updateUser does not expect
    const updated = await updateUser(user.id, updates as Partial<User>);

    return NextResponse.json({ success: true, user: updated });
  } catch (e) {
    console.error("Error update profile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}