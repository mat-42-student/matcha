// matcha/src/app/api/me/pictures/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import {
  getUserPictures,
  addUserPicture,
  countUserPictures,
} from "@/lib/db/pictures";
import { MAX_IMAGE_SIZE, detectImageMimeType } from "@/lib/validators/imageValidator";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await getSessionUser(sessionId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 401 });

    const pictures = await getUserPictures(user.id);

    if (pictures.length === 0)
      return new NextResponse(null, { status: 204 });

    return NextResponse.json(pictures);
  } catch (err) {
    console.error("Error in GET /api/me/pictures:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get("session_id")?.value || null;

    if (!sessionId)
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const user = await getSessionUser(sessionId);
    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 400 });

    const formData = await req.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "No file received" }, { status: 400 });

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE)
      return NextResponse.json(
        { error: `Picture must be non-empty and at most ${MAX_IMAGE_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      );

    const pictureCount = await countUserPictures(user.id);
    if (pictureCount >= 5) {
      return NextResponse.json(
        { error: "You cannot upload more than 5 pictures." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectImageMimeType(buffer);
    if (!mimeType)
      return NextResponse.json(
        { error: "Only JPEG, PNG and WebP pictures are allowed." },
        { status: 415 }
      );

    const picture = await addUserPicture(user.id, buffer, mimeType);

    return NextResponse.json(picture, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/me/pictures:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
