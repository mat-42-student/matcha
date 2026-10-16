// matcha/src/app/api/me/location/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getClientIp, locateIp } from "@/lib/geoip";
import { reverseGeocode } from "@/lib/geocoding";
import { updateUser } from "@/lib/db/users";
import { validateProfileField } from "@/lib/validators/serverValidator";

/**
 * Locates the user and saves it:
 * - { latitude, longitude }: browser position, named by reverse geocoding
 * - {}: approximate location of the request IP, when the browser position is refused or fails
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (user instanceof NextResponse) return user;

    const body = await req.json().catch(() => null);
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    let location;
    if (body.latitude === undefined && body.longitude === undefined) {
      location = await locateIp(getClientIp(req.headers));
      if (!location) {
        return NextResponse.json({ error: "Unable to locate your IP" }, { status: 502 });
      }
    } else {
      const { latitude, longitude } = body;
      if (!validateProfileField("latitude", latitude).valid || !validateProfileField("longitude", longitude).valid) {
        return NextResponse.json({ error: "Invalid position" }, { status: 400 });
      }
      location = { latitude, longitude, ...await reverseGeocode(latitude, longitude) };
    }

    await updateUser(user.id, location);
    return NextResponse.json(location);
  } catch (err) {
    console.error("Error in POST /me/location:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
