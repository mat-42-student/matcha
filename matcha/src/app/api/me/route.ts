import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getUserByIdFromSession } from "@/lib/db/session"; 
// ⬆️ tu peux créer ça dans lib/db/sessions.ts pour relier session_id → user

export async function GET() {
  try {
    // Lire le cookie
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;
    
    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier la session en DB → retrouver le user_id associé
    const user = await getUserByIdFromSession(sessionId);
    if (!user) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    // Retourner seulement les infos safe
    return NextResponse.json({
      id: user.id,
      email: user.email,
      username: user.username,
    });
  } catch (err) {
    console.error("Erreur /api/me:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}