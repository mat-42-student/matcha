// matcha/src/lib/geoip.ts
import { isIP } from "net";
import { validateProfileField } from "@/lib/validators/serverValidator";
import { updateUser } from "@/lib/db/users";

export type IpLocation = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
};

/**
 * Client address set by nginx ($remote_addr, it overwrites any client supplied value)
 */
export function getClientIp(headers: Headers): string | null {
  const ip = headers.get("x-real-ip")?.trim();
  return ip && isIP(ip) ? ip : null;
}

// loopback, private and link-local ranges: the docker gateway in dev
function isPrivateIp(ip: string): boolean {
  const v4 = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
  if (isIP(v4) === 4) {
    const [a, b] = v4.split(".").map(Number);
    return a === 10 || a === 127 || (a === 169 && b === 254)
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  const lower = ip.toLowerCase();
  return lower === "::1" || lower.startsWith("fc") || lower.startsWith("fd") || lower.startsWith("fe80");
}

// city and country must fit the users table constraints, otherwise they are left empty
function safeText(field: "city" | "country", value: unknown): string {
  return typeof value === "string" && validateProfileField(field, value).valid ? value : "";
}

/**
 * Approximate location of an IP address, null if the lookup fails.
 * A private address (dev behind docker) is resolved as the server's public address.
 */
export async function locateIp(ip: string | null): Promise<IpLocation | null> {
  const target = ip && !isPrivateIp(ip) ? encodeURIComponent(ip) : "";
  try {
    const res = await fetch(`https://ipwhois.app/json/${target}`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = await res.json();
    const { latitude, longitude } = data ?? {};
    if (!data?.success
      || !validateProfileField("latitude", latitude).valid
      || !validateProfileField("longitude", longitude).valid) {
      return null;
    }
    return { latitude, longitude, city: safeText("city", data.city), country: safeText("country", data.country) };
  } catch (err) {
    console.error("IP lookup failed:", (err as Error).message);
    return null;
  }
}

/**
 * Give a user without location the approximate one of their IP (subject IV.2: located even if they refuse)
 */
export async function locateUserByIp(userId: string, headers: Headers): Promise<void> {
  const location = await locateIp(getClientIp(headers));
  if (location) await updateUser(userId, location);
}
