// app/api/pictures/[id]/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getVisiblePictureData } from "@/lib/db/pictures";
import { detectImageMimeType } from "@/lib/validators/imageValidator";

/**
 * GET the binary content of a picture, usable directly as an <img> src.
 * The content of a picture id never changes, so the browser may cache it.
 * 404 if it does not exist or if either user blocked the other.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const me = await requireUser();
    if (me instanceof NextResponse) return me;

    const { id } = await context.params;
    if (!/^\d{1,9}$/.test(id)) {
      return NextResponse.json({ error: "Invalid picture ID" }, { status: 400 });
    }

    const picture = await getVisiblePictureData(id, me.id);
    if (!picture?.data) {
      return NextResponse.json({ error: "Picture not found" }, { status: 404 });
    }

    // Content-Type from the bytes themselves, never from the stored value
    const mimeType = detectImageMimeType(picture.data);
    if (!mimeType) {
      return NextResponse.json({ error: "Picture not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(picture.data), {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": String(picture.data.length),
        // short lifetime: ids are reused after a database reset
        "Cache-Control": "private, max-age=3600",
        // another account logging in on the same browser must not reuse it
        "Vary": "Cookie",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Error fetching picture:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
