import { NextRequest, NextResponse } from "next/server";
import { getEmailVerificationByToken, deleteEmailVerificationByToken } from "@/lib/db/emailVerifications";
import { markUserAsVerified } from "@/lib/db/users";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ success: false, error: "Token manquant" }, { status: 400 });
    }

    const verification = await getEmailVerificationByToken(token);
    if (!verification) {
      return NextResponse.json({ success: false, error: "Token invalide" }, { status: 400 });
    }

    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.json({ success: false, error: "Token expiré" }, { status: 400 });
    }

    await markUserAsVerified(verification.user_id);
    await deleteEmailVerificationByToken(token);

    return NextResponse.json({ success: true, message: "Email vérifié avec succès ✅" });
  } catch (err) {
    console.error("Erreur verification email :", err);
    return NextResponse.json({ success: false, error: "Erreur serveur" }, { status: 500 });
  }
}