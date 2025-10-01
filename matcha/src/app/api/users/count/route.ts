// app/api/users/count/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (!sessionId) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const me = await getSessionUser(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }

    const { rows } = await pool.query("SELECT COUNT(id) FROM users_with_interests");
    return NextResponse.json(rows);
  } catch (err) {
    console.error("Erreur /api/users:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}