"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";

interface ProfileGeolocProps {
  city?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  onChange?: (data: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
}

export default function ProfileGeoloc({
  city: initialCity = "",
  country: initialCountry = "",
  latitude: initialLat = null,
  longitude: initialLon = null,
  onChange,
}: ProfileGeolocProps) {
  const [useGeoloc, setUseGeoloc] = useState(false);
  const [cityInput, setCityInput] = useState(initialCity);
  const [formData, setFormData] = useState({
    city: initialCity,
    country: initialCountry,
    latitude: initialLat,
    longitude: initialLon,
  });

  const { requestLocation, location, loading } = useGeolocation();

  const handleCityLookup = async () => {
    if (!cityInput) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
        cityInput
      )}&format=json&limit=1`
    );
    const data = await res.json();
    if (!data.length) {
      alert("Ville introuvable ❌");
      return;
    }
    const result = data[0];
    const newData = {
      city: cityInput,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
      country: result.display_name.split(",").pop() || "",
    };
    setFormData(newData);
    onChange?.(newData);
    alert("Ville validée ✅");
  };

  const handleGeoloc = async () => {
    requestLocation();
  };

  useEffect(() => {
    if (useGeoloc && location.latitude && location.longitude) {
      const newData = {
        city: location.city || "",
        country: location.country || "",
        latitude: location.latitude,
        longitude: location.longitude,
      };
      setFormData(newData);
      onChange?.(newData);
    }
  }, [location, useGeoloc]);

  return (
    <div className="py-4 border-b text-gray-900">
      <p className="font-medium mb-2">Localisation :</p>

      <div className="flex gap-4 mb-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={useGeoloc}
            onChange={() => setUseGeoloc(true)}
          />
          Utiliser ma position actuelle
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!useGeoloc}
            onChange={() => setUseGeoloc(false)}
          />
          Entrer une ville manuellement
        </label>
      </div>

      {useGeoloc ? (
        <div>
          <button
            type="button"
            onClick={handleGeoloc}
            disabled={loading}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Recherche en cours..." : "Me géolocaliser"}
          </button>

          {formData.city && (
            <p className="mt-2 text-sm text-gray-600">
              📍 {formData.city}, {formData.country}
            </p>
          )}
        </div>
      ) : (
        <div>
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Entrez votre ville"
            className="border rounded-lg p-2 w-full"
          />
          <button
            type="button"
            onClick={handleCityLookup}
            className="mt-2 bg-pink-500 text-white px-4 py-2 rounded-lg"
          >
            Vérifier la ville
          </button>

          {formData.city && (
            <p className="mt-2 text-sm text-gray-600">
              📍 {formData.city}, {formData.country}
            </p>
          )}
        </div>
      )}
    </div>
  );
}