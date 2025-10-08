import { NextResponse } from "next/server";
import { pool } from "@/lib/db/db-utils";
import { getSessionUser } from "@/lib/db/session";
import { cookies } from "next/headers";


export async function GET(req: Request) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

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
  const cookieStore = await cookies();
  const sessionId = cookieStore.get("session_id")?.value || null;

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

  // 🧠 Vérifier si l'utilisateur a déjà une photo principale
  const { rows: existingMain } = await pool.query(
    `SELECT id FROM pictures WHERE user_id = $1 AND is_main = true`,
    [user.id]
  );

  // Si aucune photo principale n'existe, celle-ci le devient automatiquement
  const isMain = existingMain.length === 0;

  // 📸 Insérer la nouvelle photo
  const result = await pool.query(
    `INSERT INTO pictures (user_id, data, mime_type, is_main)
     VALUES ($1, $2, $3, $4)
     RETURNING id, mime_type, encode(data, 'base64') as data, is_main`,
    [user.id, buffer, mimeType, isMain]
  );

  return NextResponse.json(result.rows[0], { status: 201 });
}