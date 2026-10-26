// matcha/src/lib/auth.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/db/session";
import type { PublicUser } from "@/lib/types";
import { analyzeProfileCompletion } from "@/lib/profileCompletion";

/**
 * Resolve the user of the current request's session.
 * Returns the user, or a 401 response for the route to return as is:
 *   const me = await requireUser();
 *   if (me instanceof NextResponse) return me;
 */
export async function requireUser(): Promise<PublicUser | NextResponse> {
  const sessionId = (await cookies()).get("session_id")?.value;
  const user = sessionId ? await getSessionUser(sessionId) : null;
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  return user;
}

/**
 * Same as requireUser, for the routes the UI only opens once the profile is complete
 * (suggestions, search, profile views): 403 if a required field is missing.
 */
export async function requireCompleteUser(): Promise<PublicUser | NextResponse> {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const { missingRequired } = await analyzeProfileCompletion(user);
  if (missingRequired.length > 0) {
    return NextResponse.json(
      { error: "Complete your profile first", missing: missingRequired },
      { status: 403 }
    );
  }
  return user;
}
