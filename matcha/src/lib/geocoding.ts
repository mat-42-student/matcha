// matcha/src/lib/geocoding.ts
// City search through Photon (built for search-as-you-type, which the Nominatim policy forbids)
// and reverse geocoding through Nominatim (one request per click is within its policy).
// Both serve OpenStreetMap data.
import { safePlaceName } from "@/lib/geoip";
import { validateProfileField } from "@/lib/validators/serverValidator";

const PHOTON_URL = "https://photon.komoot.io";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org";
// required by the Nominatim usage policy
const USER_AGENT = "Matcha (42 school project)";
const TIMEOUT_MS = 5000;

export type CitySuggestion = {
  city: string;
  region: string;
  country: string;
  latitude: number;
  longitude: number;
};

type PhotonFeature = {
  properties?: { name?: unknown; state?: unknown; country?: unknown };
  geometry?: { coordinates?: unknown };
};

async function photonSearch(text: string, limit: number): Promise<PhotonFeature[] | null> {
  const query = new URLSearchParams({ q: text, limit: String(limit), lang: "en", layer: "city" });
  try {
    const res = await fetch(`${PHOTON_URL}/api/?${query}`, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.features) ? data.features : null;
  } catch (err) {
    console.error("City search failed:", (err as Error).message);
    return null;
  }
}

// null if the place cannot be stored: its name or coordinates do not fit the users table
function toSuggestion(feature: PhotonFeature): CitySuggestion | null {
  const [longitude, latitude] = Array.isArray(feature.geometry?.coordinates) ? feature.geometry.coordinates : [];
  const city = safePlaceName("city", feature.properties?.name);
  if (!city || typeof latitude !== "number" || typeof longitude !== "number"
    || !validateProfileField("latitude", latitude).valid
    || !validateProfileField("longitude", longitude).valid) {
    return null;
  }
  const region = typeof feature.properties?.state === "string" ? feature.properties.state : "";
  return {
    city,
    region,
    country: safePlaceName("country", feature.properties?.country),
    latitude,
    longitude,
  };
}

/**
 * Cities matching what the user typed so far, null if the service is unreachable
 */
export async function searchCities(text: string, limit = 5): Promise<CitySuggestion[] | null> {
  const features = await photonSearch(text, limit * 2);
  if (!features) return null;

  // the same city can come both as a node and as a boundary
  const seen = new Set<string>();
  const cities: CitySuggestion[] = [];
  for (const feature of features) {
    const city = toSuggestion(feature);
    const key = city && `${city.city}|${city.region}|${city.country}`;
    if (!city || !key || seen.has(key)) continue;
    seen.add(key);
    cities.push(city);
    if (cities.length === limit) break;
  }
  return cities;
}

/**
 * City and country of a position, empty strings if unknown (the position itself is still valid)
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; country: string }> {
  // zoom 10: city level
  const query = new URLSearchParams({
    format: "jsonv2",
    lat: String(latitude),
    lon: String(longitude),
    zoom: "10",
    "accept-language": "en",
  });
  try {
    const res = await fetch(`${NOMINATIM_URL}/reverse?${query}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const address = (await res.json())?.address ?? {};
    return {
      city: safePlaceName("city", address.city || address.town || address.village || address.municipality),
      country: safePlaceName("country", address.country),
    };
  } catch (err) {
    console.error("Reverse geocoding failed:", (err as Error).message);
    return { city: "", country: "" };
  }
}
