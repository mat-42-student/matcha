import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { getSessionUser } from "@/lib/db/session";

export async function GET(req: Request) {
  const cookies = req.cookies;
  const sessionId = cookies.get("session_id")?.value || null;

  if (!sessionId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await getSessionUser(sessionId);
  if (!user)
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });

  const result = await pool.query(
    `SELECT mime_type, encode(data, 'base64') as data
     FROM pictures WHERE user_id = $1 AND is_main = true`,
    [user.id]
  );

  if (result.rows.length === 0)
    return new NextResponse(null, { status: 204 });

  const { mime_type, data } = result.rows[0];
  return NextResponse.json({ mime_type, data });
}