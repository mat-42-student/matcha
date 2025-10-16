// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "@/lib/db/users";
import { getSessionUser } from "@/lib/db/session";
import { validateProfileField } from "@/lib/validators/serverValidator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Récupérer l’utilisateur depuis la session
    const sessionId = req.cookies.get("session_id")?.value || null;
    if (!sessionId) {
      return NextResponse.json({ error: "Not authentificated" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    const updates: Record<string, any> = {};
    for (const [field, value] of Object.entries(body)) {
      const { valid, error } = validateProfileField(field, value);
      if (!valid) {
        return NextResponse.json({ error: error || "Valeur invalide" }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No update given" }, { status: 400 });
    }

    const updated = await updateUser(user.id, updates);

    return NextResponse.json({ success: true, user: updated });
  } catch (e) {
    console.error("Erreur update profile:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}