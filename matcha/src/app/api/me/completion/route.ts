import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";
import { cookies } from "next/headers";

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
  
  const completion = await analyzeProfileCompletion(user);
  return NextResponse.json(completion);
}