// matcha/src/app/api/me/pictures/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db/session";
import {
  getUserPictures,
  addUserPicture,
  countUserPictures,
} from "@/lib/db/pictures";

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

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file)
      return NextResponse.json({ error: "No file received" }, { status: 400 });

    const pictureCount = await countUserPictures(user.id);
    if (pictureCount >= 5) {
      return NextResponse.json(
        { error: "You cannot upload more than 5 pictures." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || "image/jpeg";

    const picture = await addUserPicture(user.id, buffer, mimeType);

    return NextResponse.json(picture, { status: 201 });
  } catch (err) {
    console.error("Error in POST /api/me/pictures:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
