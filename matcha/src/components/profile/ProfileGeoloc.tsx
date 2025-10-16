// matcha/src/components/profile/ProfileGeoloc.tsx

"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import toast from "react-hot-toast";

interface ProfileGeolocProps {
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  onChange?: (data: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
  onUserUpdate?: (updates: Partial<any>) => void;
}

export default function ProfileGeoloc({
  city: initialCity,
  country: initialCountry,
  latitude: initialLat,
  longitude: initialLon,
  onChange,
  onUserUpdate,
}: ProfileGeolocProps) {
  const [useGeoloc, setUseGeoloc] = useState(false);
  const [cityInput, setCityInput] = useState(initialCity ?? "");
  const [locationData, setLocationData] = useState({
    city: initialCity ?? "",
    country: initialCountry ?? "",
    latitude: initialLat ?? null,
    longitude: initialLon ?? null,
  });

  const { requestLocation, location, loading } = useGeolocation();

  // 💾 Save & notify parent
  const saveAndUpdate = async (newData: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  }) => {
    const safeData = {
      city: newData.city ?? "",
      country: newData.country ?? "",
      latitude: newData.latitude ?? null,
      longitude: newData.longitude ?? null,
    };

    setLocationData(safeData);
    setCityInput(safeData.city);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(safeData),
      });

      if (!res.ok) throw new Error("Error updating profile location");
      toast.success("Profile location updated");

      onChange?.(safeData);
      onUserUpdate?.(safeData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save location");
    }
  };

  // 🧭 Handle geolocation
  const handleGeoloc = async () => {
    try {
      await requestLocation();
    } catch (err) {
      console.error(err);
      toast.error("Unable to get your location.");
    }
  };

  // 🏙️ Handle manual city lookup
  const handleCityLookup = async () => {
    const city = cityInput.trim();
    if (!city) return toast.error("Please enter a city.");

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
          city
        )}&format=json&limit=1`
      );
      const data = await res.json();
      if (!data.length) return toast.error("City not found ❌");

      const result = data[0];
      const newData = {
        city,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        country: result.display_name.split(",").pop() ?? "",
      };
      saveAndUpdate(newData);
      toast.success("City updated");
    } catch (err) {
      console.error(err);
      toast.error("City lookup failed");
    }
  };

  // 🔄 Update when geolocation changes
  useEffect(() => {
    if (useGeoloc && location.latitude != null && location.longitude != null) {
      saveAndUpdate({
        city: location.city ?? "",
        country: location.country ?? "",
        latitude: location.latitude,
        longitude: location.longitude,
      });
    }
  }, [location, useGeoloc]);

  return (
    <div className="py-4 border-b text-gray-900">
      <p className="font-medium mb-2">Location:</p>

      <div className="flex gap-4 mb-3">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={useGeoloc}
            onChange={() => setUseGeoloc(true)}
          />
          Use my current position
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            checked={!useGeoloc}
            onChange={() => setUseGeoloc(false)}
          />
          Enter a city manually
        </label>
      </div>

      {useGeoloc ? (
        <button
          type="button"
          onClick={handleGeoloc}
          disabled={loading}
          className="bg-pink-500 text-white px-4 py-2 rounded-lg"
        >
          {loading ? "Searching..." : "Use my location"}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={cityInput ?? ""}
            onChange={(e) => setCityInput(e.target.value)}
            placeholder="Enter your city"
            className="border rounded-lg p-2 w-full"
          />
          <button
            type="button"
            onClick={handleCityLookup}
            className="bg-pink-500 text-white px-4 py-2 rounded-lg"
          >
            Verify the city
          </button>
        </div>
      )}

      {(locationData.city || locationData.country) && (
        <p className="mt-2 text-sm text-gray-600">
          📍 {locationData.city}, {locationData.country}
        </p>
      )}
    </div>
  );
}