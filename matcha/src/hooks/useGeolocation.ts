// src/hooks/useGeolocation.ts
"use client";

import { useState } from "react";

export type GeoLocation = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
};

// Without a timeout the browser can wait indefinitely for a position;
// a recent one (moved less than a few minutes ago) is good enough.
const POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 10 * 60 * 1000,
};

function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation unsupported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, POSITION_OPTIONS);
  });
}

// The server names the position (or locates the request IP when no position is given) and saves it
async function saveLocation(position?: { latitude: number; longitude: number }): Promise<GeoLocation> {
  const res = await fetch("/api/me/location", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(position ?? {}),
  });
  if (!res.ok) throw new Error("Location failed");
  return res.json();
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false);

  // Saves the browser position, or an IP based approximation if it is refused or fails
  async function requestLocation(): Promise<GeoLocation & { approximate: boolean }> {
    setLoading(true);
    try {
      let position: GeolocationPosition | null = null;
      try {
        position = await getBrowserPosition();
      } catch {
        // refused, unavailable or too slow: fall back on the IP
      }
      if (position) {
        const { latitude, longitude } = position.coords;
        return { ...await saveLocation({ latitude, longitude }), approximate: false };
      }
      return { ...await saveLocation(), approximate: true };
    } finally {
      setLoading(false);
    }
  }

  return { requestLocation, loading };
}
