// matcha/src/app/api/me/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getClientIp, locateIp } from "@/lib/geoip";

// Approximate location from the request IP, used when the browser position is refused
export async function GET(req: NextRequest) {
  const user = await requireUser();
  if (user instanceof NextResponse) return user;

  const location = await locateIp(getClientIp(req.headers));
  if (!location) {
    return NextResponse.json({ error: "Unable to locate your IP" }, { status: 502 });
  }
  return NextResponse.json(location);
}
