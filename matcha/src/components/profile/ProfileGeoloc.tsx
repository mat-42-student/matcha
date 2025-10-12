"use client";

import { useState, useEffect } from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import toast from "react-hot-toast";

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
  onUserUpdate?: (updates: Partial<any>) => void;
}

export default function ProfileGeoloc({
  city: initialCity = "",
  country: initialCountry = "",
  latitude: initialLat = null,
  longitude: initialLon = null,
  onChange,
  onUserUpdate,
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

  // 🧭 Quand on clique sur "Me géolocaliser"
  const handleGeoloc = async () => {
    try {
      await requestLocation();
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'obtenir la position.");
    }
  };

  // 🌍 Quand la position change (via hook)
  useEffect(() => {
    if (useGeoloc && location.latitude && location.longitude) {
      const newData = {
        city: location.city || "",
        country: location.country || "",
        latitude: location.latitude,
        longitude: location.longitude,
      };
      saveAndUpdate(newData);
    }
  }, [location, useGeoloc]);

  // 🏙️ Quand on saisit manuellement une ville
  const handleCityLookup = async () => {
    if (!cityInput) return toast.error("Veuillez entrer une ville.");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(
          cityInput
        )}&format=json&limit=1`
      );
      const data = await res.json();
      if (!data.length) return toast.error("Ville introuvable ❌");

      const result = data[0];
      const newData = {
        city: cityInput,
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        country: result.display_name.split(",").pop() || "",
      };
      saveAndUpdate(newData);
      toast.success("Ville mise à jour ✅");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la recherche de la ville.");
    }
  };

  // 💾 Fonction centrale pour enregistrer + notifier
  const saveAndUpdate = async (newData: {
    city: string;
    country: string;
    latitude: number | null;
    longitude: number | null;
  }) => {
    setFormData(newData);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newData),
      });

      if (!res.ok) throw new Error("Erreur lors de la mise à jour du profil");
      toast.success("Profil géolocalisé mis à jour ✅");

      // 🔁 On notifie le parent
      onChange?.(newData);
      onUserUpdate?.(newData);
    } catch (err) {
      console.error(err);
      toast.error("Impossible de sauvegarder la localisation ❌");
    }
  };

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
