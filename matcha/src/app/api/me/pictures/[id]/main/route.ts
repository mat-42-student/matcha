import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { getSessionUser } from "@/lib/db/session";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookies = req.cookies;
  const sessionId = cookies.get("session_id")?.value || null;

  if (!sessionId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await getSessionUser(sessionId);
  if (!user)
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });

  const { id } = params;

  // On retire le flag "is_main" des autres images
  await pool.query(
    `UPDATE pictures SET is_main = false WHERE user_id = $1`,
    [user.id]
  );

  // On définit celle-ci comme principale
  await pool.query(
    `UPDATE pictures SET is_main = true WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );

  return NextResponse.json({ success: true });
}