// src/hooks/useGeolocation.ts
"use client";

import { useState } from "react";

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude?: number;
    longitude?: number;
    city?: string;
    country?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);

  async function locateFromBrowser(position: GeolocationPosition) {
    const { latitude, longitude } = position.coords;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await res.json();
    const city = data.address.city || data.address.town || data.address.village;
    const country = data.address.country;
    setLocation({ latitude, longitude, city, country });
  }

  async function locateFromIp() {
    const res = await fetch(`https://ipwhois.app/json/`);
    const data = await res.json();
    if (!data.success) throw new Error("IP lookup failed");
    const { latitude, longitude, city, country } = data;
    setLocation({ latitude, longitude, city, country });
  }

  function requestLocation() {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await locateFromBrowser(pos);
        setLoading(false);
      },
      async () => {
        await locateFromIp();
        setLoading(false);
      }
    );
  }

  return { requestLocation, location, loading, error };
}