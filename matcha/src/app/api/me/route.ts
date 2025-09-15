// src/app/api/me/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const user = await getUserByIdFromSession(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    return NextResponse.json(user); // 👈 safe: PublicUser
  } catch (err) {
    console.error("Erreur /api/me:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}