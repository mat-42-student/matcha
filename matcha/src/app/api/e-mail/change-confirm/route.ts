// matcha/src/app/api/e-mail/change-confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getEmailTokenByToken, deleteEmailTokenByToken } from "@/lib/db/emails";
import { isEmailUsed, updateUserEmail } from "@/lib/db/users";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=missing", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    const record = await getEmailTokenByToken(token);
    if (!record || record.type !== "change") {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=invalid", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    if (new Date() > new Date(record.expires_at)) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=expired", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    if (!record.new_email) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=missing_email", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    // The address may have been taken since the request was made
    if (await isEmailUsed(record.new_email)) {
      await deleteEmailTokenByToken(token);
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=taken", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    await updateUserEmail(record.user_id, record.new_email);
    await deleteEmailTokenByToken(token);

    return NextResponse.redirect(
      new URL("/verify-email/success", process.env.NEXT_PUBLIC_BASE_URL)
    );
  } catch (err) {
    console.error("Error confirming email change:", err);
    return NextResponse.redirect(
      new URL("/verify-email/error?reason=server", process.env.NEXT_PUBLIC_BASE_URL)
    );
  }
}