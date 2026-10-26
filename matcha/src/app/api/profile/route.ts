// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { isUsernameUsed, updateUser, type User } from "@/lib/db/users";
import { requireUser } from "@/lib/auth";
import { validateProfileField } from "@/lib/validators/serverValidator";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const body = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const updates: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(body)) {
      const check = validateProfileField(field, value);
      if (!check.valid) {
        return NextResponse.json({ error: check.error || "Invalid value" }, { status: 400 });
      }
      // names are stored trimmed
      updates[field] = check.value !== undefined ? check.value : value;
    }

    if (typeof updates.username === "string" && await isUsernameUsed(updates.username, user.id)) {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update given" }, { status: 400 });
    }

    // every field went through validateProfileField, which rejects anything updateUser does not expect
    await updateUser(user.id, updates as Partial<User>);

    return NextResponse.json({ success: true });
  } catch (e) {
    // unique violation: username taken by a concurrent update
    if ((e as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Username is already taken" }, { status: 409 });
    }
    console.error("Error update profile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}