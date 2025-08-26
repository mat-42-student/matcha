import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { users } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(req: Request) {
  const formData = await req.formData();
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // Vérifie que tous les champs sont fournis
  if (!email || !password) {
    return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });
  }

  // Vérifie que l'utilisateur n'existe pas déjà
  const existingUser = users.find((u) => u.email === email);
  if (existingUser) {
    return NextResponse.json({ error: "Cet email est déjà utilisé" }, { status: 409 });
  }

  // Hash du mot de passe
  const passwordHash = await bcrypt.hash(password, 10);

  // Création de l'utilisateur (fake DB)
  const newUser = {
    id: (users.length + 1).toString(),
    email,
    passwordHash,
  };
  users.push(newUser);

  // Création d'une session
  const sessionId = await createSession(newUser.id);

  // Redirection vers la home avec cookie de session
  const res = NextResponse.redirect(new URL("/", req.url));
  res.cookies.set("session_id", sessionId, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}