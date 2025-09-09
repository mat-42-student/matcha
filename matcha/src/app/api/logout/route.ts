import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/db/session"; // 👈 tu dois avoir cette fonction

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value;

    if (sessionId) {
      // Supprimer en DB
      await deleteSession(sessionId);
    }

    // Supprimer côté navigateur
    const res = NextResponse.json({ success: true });
    res.cookies.set("session_id", "", {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0, // 👈 expire immédiatement
    });

    return res;
  } catch (err) {
    console.error("Erreur logout:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}