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
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await getSessionUser(sessionId);
  if (!user)
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });

  const { id } = params;

  await pool.query(
    `DELETE FROM pictures WHERE id = $1 AND user_id = $2`,
    [id, user.id]
  );

  return NextResponse.json({ success: true });
}