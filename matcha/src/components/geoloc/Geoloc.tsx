"use client";

import { useEffect } from "react";

export default function Geoloc() {

  async function postLocationData(
    latitude: number,
    longitude: number,
    city: string,
    country: string) {

    await fetch(`/api/users/location`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ latitude, longitude, city, country })
    });
  }

  async function locateFromBrowser(position: GeolocationPosition) {
    const { latitude, longitude } = position.coords;

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await res.json();
    const city = data.address.city || data.address.town || data.address.village;
    const country = data.address.country;

    await postLocationData(latitude, longitude, city, country)
  }

  async function locateFromIp() {
    const resp = await fetch(`https://ipwhois.app/json/`);
    if (!resp.ok) {
      console.error("ipwhois fetch failed", resp.status, await resp.text());
      return
    }
    const data = await resp.json();

    if (!data.success) {
      console.log("error: IP lookup failed")
      return
    }

    const { latitude, longitude, city, country } = data;
    await postLocationData(latitude, longitude, city, country)

  }

  function requestLocation() {
    navigator.geolocation.getCurrentPosition(
      locateFromBrowser,locateFromIp);
  }


  // request location should be called in profile settings with smthing like
  // <button onClick={requestLocation}>Update my location</button>

  useEffect(requestLocation, []) // disable this one to avoid being bored by permission popups on every page load
  return null;
}