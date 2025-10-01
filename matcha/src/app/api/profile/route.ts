// app/api/profile/route.ts
import { NextRequest, NextResponse } from "next/server";
import { updateUser } from "@/lib/db/users";
import { getSessionUser } from "@/lib/db/session";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Récupérer l’utilisateur depuis la session
    const cookies = req.cookies;
    const sessionId = cookies.get("session_id")?.value || null;
    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getSessionUser(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
    }

    const updated = await updateUser(user.id, body);

    return NextResponse.json(updated);
  } catch (e) {
    console.error("Erreur update profile:", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}