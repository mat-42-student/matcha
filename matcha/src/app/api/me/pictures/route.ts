// matcha/src/app/api/me/pictures/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  getUserPictures,
  addUserPicture,
  countUserPictures,
  MAX_PICTURES,
} from "@/lib/db/pictures";
import { MAX_IMAGE_SIZE, detectImageMimeType } from "@/lib/validators/imageValidator";

export async function GET() {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

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
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const formData = await req.formData().catch(() => null);
    const file = formData?.get("file");
    if (!(file instanceof File))
      return NextResponse.json({ error: "No file received" }, { status: 400 });

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE)
      return NextResponse.json(
        { error: `Picture must be non-empty and at most ${MAX_IMAGE_SIZE / 1024 / 1024} MB.` },
        { status: 413 }
      );

    const tooMany = () => NextResponse.json(
      { error: `You cannot upload more than ${MAX_PICTURES} pictures.` },
      { status: 400 }
    );
    // early exit before reading the file; addUserPicture re-checks under lock
    if ((await countUserPictures(user.id)) >= MAX_PICTURES)
      return tooMany();

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectImageMimeType(buffer);
    if (!mimeType)
      return NextResponse.json(
        { error: "Only JPEG, PNG and WebP pictures are allowed." },
        { status: 415 }
      );

    const picture = await addUserPicture(user.id, buffer, mimeType);
    if (!picture)
      return tooMany();

    return NextResponse.json(picture, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/me/pictures:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
