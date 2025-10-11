import { NextResponse } from "next/server";
import { getUserInterests, updateUserInterests } from "@/lib/db/interests";
import { getSessionUser } from "@/lib/db/session";
import { cookies } from "next/headers";

// 📜 GET — Récupérer les intérêts de l’utilisateur
export async function GET() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  if (!sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await getSessionUser(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
  }

  const interests = await getUserInterests(user.id);
  return NextResponse.json(interests);
}

// 📝 POST — Mettre à jour les intérêts de l’utilisateur
export async function POST(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  if (!sessionId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const user = await getSessionUser(sessionId);
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
  }



  const body = await req.json();
  const interestIds: number[] = body.interestIds || [];


  try {
    await updateUserInterests(user.id, interestIds);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Erreur lors de la mise à jour des intérêts :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}