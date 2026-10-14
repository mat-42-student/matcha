// matcha/src/app/api/me/pictures/[id]/main/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { setMainPicture } from "@/lib/db/pictures";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const { id } = await context.params;
    if (!/^\d{1,9}$/.test(id)) {
      return NextResponse.json({ error: "Invalid picture ID" }, { status: 400 });
    }

    if (!(await setMainPicture(user.id, id))) {
      return NextResponse.json({ error: "Picture not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error setting main picture:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}