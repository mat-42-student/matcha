interface GeoFeature {
  properties: { city: string };
  geometry: { coordinates: [number, number] };
}

export async function getGPSFromCityName(city: string): Promise<{ lat: number, lon: number } | null> {
  const res = await fetch(`https://data.geopf.fr/geocodage/search?q=${city}`);
  const data = await res.json();
  const match = data.features.find((f: GeoFeature) => f.properties.city.toLowerCase() === city.toLowerCase());

  if (match) {
    const [lon, lat] = match.geometry.coordinates;
    return { lat, lon };
  }
  return null;
}

export async function getCityNameFromGPS(lat: number, lon: number): Promise<string | null> {
  const res = await fetch(`https://data.geopf.fr/geocodage/reverse?lat=${lat}&lon=${lon}`);
  if (!res.ok) {
    console.error("Error API geopf:", res.statusText);
    return null;
  }
  const data = await res.json();

  if (data.features?.length > 0) {
    return data.features[0].properties.city || null;
  }
  return null;
}