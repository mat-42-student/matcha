// matcha/src/app/api/me/pictures/[id]/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteUserPicture } from "@/lib/db/pictures";

export async function DELETE(
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

    if (!(await deleteUserPicture(user.id, id))) {
      return NextResponse.json({ error: "Picture not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Error deleting picture:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}