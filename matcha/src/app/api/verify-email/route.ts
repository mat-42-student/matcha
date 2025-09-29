import { NextRequest, NextResponse } from "next/server";
import { getEmailVerificationByToken, deleteEmailVerificationByToken } from "@/lib/db/emailVerifications";
import { markUserAsVerified } from "@/lib/db/users";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(new URL("/verify-email/error?reason=missing", process.env.NEXT_PUBLIC_BASE_URL));
    }

    const verification = await getEmailVerificationByToken(token);
    if (!verification) {
      return NextResponse.redirect(new URL("/verify-email/error?reason=invalid", process.env.NEXT_PUBLIC_BASE_URL));
    }

    if (new Date() > new Date(verification.expires_at)) {
      return NextResponse.redirect(new URL("/verify-email/error?reason=expired", process.env.NEXT_PUBLIC_BASE_URL));
    }

    await markUserAsVerified(verification.user_id);
    await deleteEmailVerificationByToken(token);

    return NextResponse.redirect(new URL("/verify-email/success", process.env.NEXT_PUBLIC_BASE_URL));
  } catch (err) {
    console.error("Erreur verification email :", err);
    return NextResponse.redirect(new URL("/verify-email/error?reason=server", process.env.NEXT_PUBLIC_BASE_URL));
  }
}