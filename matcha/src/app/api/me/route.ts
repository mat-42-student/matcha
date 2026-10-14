// src/app/api/me/route.ts

import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    return NextResponse.json(user);
  } catch (err) {
    console.error("Erreur /api/me:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}