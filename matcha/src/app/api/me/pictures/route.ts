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
    `SELECT id, mime_type, encode(data, 'base64') AS data, is_main
     FROM pictures WHERE user_id = $1`,
    [user.id]
  );

  if (result.rows.length === 0)
    return new NextResponse(null, { status: 204 });

  return NextResponse.json(result.rows);
}

export async function POST(req: Request) {
  const cookies = req.cookies;
  const sessionId = cookies.get("session_id")?.value || null;

  if (!sessionId)
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const user = await getSessionUser(sessionId);
  if (!user)
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file)
    return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "image/jpeg";

  const result = await pool.query(
    `INSERT INTO pictures (user_id, data, mime_type, is_main)
     VALUES ($1, $2, $3, false)
     RETURNING id, mime_type, encode(data, 'base64') as data, is_main`,
    [user.id, buffer, mimeType]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}