// src/hooks/useGeolocation.ts
"use client";

import { useState } from "react";

export type GeoLocation = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
};

async function locateFromBrowser(position: GeolocationPosition): Promise<GeoLocation> {
  const { latitude, longitude } = position.coords;
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
  );
  const data = await res.json();
  const city = data.address.city || data.address.town || data.address.village || "";
  const country = data.address.country || "";
  return { latitude, longitude, city, country };
}

// done by the server from the request IP (no third party call from the browser)
async function locateFromIp(): Promise<GeoLocation> {
  const res = await fetch("/api/me/location");
  if (!res.ok) throw new Error("IP lookup failed");
  return res.json();
}

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject)
  );
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);

  // Resolves with the browser position, or an IP based approximation if it is refused or fails
  async function requestLocation(): Promise<GeoLocation> {
    setLoading(true);
    try {
      try {
        return await locateFromBrowser(await getBrowserPosition());
      } catch {
        return await locateFromIp();
      }
    } finally {
      setLoading(false);
    }
  }

  return { requestLocation, loading };
}
