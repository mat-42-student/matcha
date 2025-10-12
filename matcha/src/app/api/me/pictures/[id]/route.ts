import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { getSessionUser } from "@/lib/db/session";
import { cookies } from "next/headers";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

  if (!sessionId)
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const user = await getSessionUser(sessionId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 401 });

  const { id } = params;

  // Vérifie si la photo supprimée est la principale
  const mainCheckRes = await pool.query(
    `SELECT is_main FROM pictures WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );
  const isMain = mainCheckRes.rows[0]?.is_main;

  // Supprime la photo
  await pool.query(`DELETE FROM pictures WHERE id = $1 AND user_id = $2`, [
    id,
    user.id,
  ]);

  // Si c'était la photo principale, en choisir une autre
  if (isMain) {
    const res = await pool.query(
      `SELECT id FROM pictures WHERE user_id = $1 LIMIT 1`,
      [user.id]
    );
    const newMainId = res.rows[0]?.id;

    if (newMainId) {
      await pool.query(
        `UPDATE pictures SET is_main = TRUE WHERE id = $1`,
        [newMainId]
      );
    }
  }

  return NextResponse.json({ success: true });
}