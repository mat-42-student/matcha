// app/api/users/[userId]/pics/route.ts
import { NextResponse } from "next/server";
import { getMainPicture } from "@/lib/db/pictures";

/**
 * GET main picture of a user.
 * Returns JSON: { mime_type, data } where data is base64 encoded.
 */
export async function GET(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const picture = await getMainPicture(userId);

    // If no main picture found → 204 No Content
    if (!picture) {
      return new NextResponse(null, { status: 204 });
    }

    // Return JSON with base64 data
    return NextResponse.json({
      mime_type: picture.mime_type ?? "image/jpeg",
      data: picture.data,
    });
  } catch (err) {
    console.error("Error fetching main picture:", err);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}


