"use client";
import { useEffect, useState } from "react";

export default function Geoloc({ userId }: { userId: string}) {
  const [status, setStatus] = useState<string>("");

  function requestLocation() {
    if (!navigator.geolocation) {
      console.log("La géolocalisation n'est pas supportée par ce navigateur.");
      ipLocalise(userId);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log(`Position : ${latitude}, ${longitude}`);

        await fetch(`/api/users/${userId}/location`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude }),
        });
      },
      (error) => {
        setStatus("Impossible d’obtenir la géolocalisation : " + error.message);
      }
    );
  };

  requestLocation();

  return null;
}

function ipLocalise(userId: string) {
}