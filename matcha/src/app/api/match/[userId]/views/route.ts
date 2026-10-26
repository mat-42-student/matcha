// matcha/src/app/api/match/[userId]/views/route.ts
import { NextResponse } from "next/server";
import { requireCompleteUser } from "@/lib/auth";
import { recordProfileView } from "@/lib/db/views";
import { getFame } from "@/lib/db/users";
import { send, toSocketUser } from "@/lib/socket/socket";
import { NotifPayload } from "@/lib/types";
import { isValidUuid } from "@/lib/validators/serverValidator";

/**
 * POST /api/match/[userId]/views
 * Records that the current user viewed another user's profile.
 */
export async function POST(
  req: Request,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    // an incomplete profile cannot browse, so it cannot visit either
    const viewer = await requireCompleteUser();
    if (viewer instanceof NextResponse) return viewer;

    if (!isValidUuid(userId)) {
      return NextResponse.json({ error: "Invalid user id" }, { status: 400 });
    }

    if (viewer.id === userId) {
      return NextResponse.json({ error: "You cannot view your own profile" }, { status: 400 });
    }

    const scored: boolean = await recordProfileView(userId, viewer.id);
    if (scored) {
      send<NotifPayload>(userId, "notif", {
        from: toSocketUser(viewer),
        msg: "view",
      });
    }

    return NextResponse.json({ scored, fame: await getFame(userId) });
  } catch (err) {
    console.error("Error in POST /api/match/[userId]/views:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}