// matcha/src/app/api/me/pictures/main/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getMainPicture } from "@/lib/db/pictures";
import { redirectToPicture } from "@/lib/pictureUrl";

// Redirects to /api/pictures/:id, or to the default avatar if there is none
export async function GET() {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const picture = await getMainPicture(user.id);
    return redirectToPicture(picture?.id);
  } catch (err) {
    console.error("Error in GET /api/me/pictures/main:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
