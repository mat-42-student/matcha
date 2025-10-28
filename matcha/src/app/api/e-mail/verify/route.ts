// matcha/src/app/api/e-mail/verify/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getEmailTokenByToken, deleteEmailTokenByToken } from "@/lib/db/emails";
import { markUserAsVerified } from "@/lib/db/users";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=missing", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    const record = await getEmailTokenByToken(token);
    if (!record || record.type !== "verify") {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=invalid", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=expired", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    await markUserAsVerified(record.user_id);
    await deleteEmailTokenByToken(token);

    return NextResponse.redirect(
      new URL("/verify-email/success", process.env.NEXT_PUBLIC_BASE_URL)
    );
  } catch (err) {
    console.error("Error verifying email:", err);
    return NextResponse.redirect(
      new URL("/verify-email/error?reason=server", process.env.NEXT_PUBLIC_BASE_URL)
    );
  }
}