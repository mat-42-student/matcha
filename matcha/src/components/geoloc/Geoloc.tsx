"use client";
import { useEffect } from "react";

export default function Geoloc({ userId }: { userId: string }) {

  async function handlePosition(position: GeolocationPosition) {
    const { latitude, longitude } = position.coords;

    // Reverse geocoding si nécessaire
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await res.json();
    const city = data.address.city || data.address.town || data.address.village;
    const country = data.address.country;

    await fetch(`/api/users/${userId}/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, city, country })
    });
  }

  async function locateFromIp() {
    fetch(`/api/users/${userId}/location-ip`);
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      console.warn("Geolocation unsupported");
      locateFromIp();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      handlePosition,
      (error) => {
        console.warn("Unable to locate user : " + error.message);
        locateFromIp();
      }
    );
  }

  useEffect(() => {
    requestLocation();
  }, []);

  return null;
}