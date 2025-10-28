// matcha/src/app/api/e-mail/change-confirm/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getEmailChangeRequestByToken, deleteEmailChangeRequest } from "@/lib/db/emails";
import { updateUser } from "@/lib/db/users";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=missing", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    const request = await getEmailChangeRequestByToken(token);
    if (!request) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=invalid", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    if (new Date() > new Date(request.expires_at)) {
      return NextResponse.redirect(
        new URL("/verify-email/error?reason=expired", process.env.NEXT_PUBLIC_BASE_URL)
      );
    }

    await updateUser(request.user_id, { email: request.new_email });

    await deleteEmailChangeRequest(token);

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