// app/api/users/compatible/route.ts
import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import { PublicUser } from "@/types";

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

    const query = "SELECT * FROM compatible_users_from($1);";
    const params = [me.id];
    const res = await pool.query(query, params);
    const users: PublicUser[] = res.rows;

    return NextResponse.json(users);
  } catch (err) {
    console.error("Erreur /api/users:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}