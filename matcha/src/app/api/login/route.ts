import { NextResponse, NextRequest } from "next/server";
import { loginUser, createSession } from "@/server/routes/login";
import type { User } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Champs manquants" },
        { status: 400 }
      );
    }

    // Vérifier utilisateur
    const user: User = await loginUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Identifiants invalides" },
        { status: 401 }
      );
    }

    // Créer une session en DB
    const sessionId = await createSession(user.id);

    // Réponse JSON + cookie
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, username: user.username } });
    res.cookies.set("session_id", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    });

    return res;
  } catch (err) {
    console.error("Erreur login:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}