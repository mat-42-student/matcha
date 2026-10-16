// matcha/src/components/profile/ProfileGeoloc.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import type { CitySuggestion } from "@/lib/geocoding";

type LocationData = {
  city: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
};

interface ProfileGeolocProps {
  city?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  onUserUpdate?: (updates: LocationData) => void;
}

const SEARCH_DELAY_MS = 300;
const MIN_SEARCH_LENGTH = 2;

function formatPlace(city: string, country: string) {
  return [city, country].filter(Boolean).join(", ");
}

export default function ProfileGeoloc({
  city,
  country,
  latitude,
  longitude,
  onUserUpdate,
}: ProfileGeolocProps) {
  const [location, setLocation] = useState<LocationData>({
    city: city ?? "",
    country: country ?? "",
    latitude: latitude ?? null,
    longitude: longitude ?? null,
  });
  const { requestLocation, loading: locating } = useGeolocation();

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [saving, setSaving] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // cancel a pending search when leaving the tab
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();
  }, []);

  const applyLocation = (data: LocationData) => {
    setLocation(data);
    onUserUpdate?.(data);
  };

  // 🧭 Browser position, or IP approximation
  const handleGeoloc = async () => {
    try {
      const { approximate, ...data } = await requestLocation();
      applyLocation(data);
      const place = formatPlace(data.city, data.country) || "your position";
      if (approximate) toast(`Approximate location from your connection: ${place}`);
      else toast.success(`Location updated: ${place}`);
    } catch (err) {
      console.error(err);
      toast.error("Unable to get your location.");
    }
  };

  // 🏙️ City search, sent once the user stops typing; a newer search cancels the previous one
  const search = async (text: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setSearching(true);
    try {
      const res = await fetch(`/api/geo/cities?q=${encodeURIComponent(text)}`, { signal: controller.signal });
      if (!res.ok) throw new Error("City search failed");
      setSuggestions(await res.json());
      setHighlighted(0);
      setOpen(true);
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error(err);
      setSuggestions([]);
      toast.error("City search is unavailable, please try again later.");
    } finally {
      if (abortRef.current === controller) setSearching(false);
    }
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setQuery(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    abortRef.current?.abort();

    if (text.trim().length < MIN_SEARCH_LENGTH) {
      setSuggestions([]);
      setOpen(false);
      setSearching(false);
      return;
    }
    timerRef.current = setTimeout(() => search(text.trim()), SEARCH_DELAY_MS);
  };

  const selectCity = async (suggestion: CitySuggestion) => {
    setOpen(false);
    setSaving(true);
    const data: LocationData = {
      city: suggestion.city,
      country: suggestion.country,
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    };
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Error updating profile location");
      applyLocation(data);
      setQuery("");
      setSuggestions([]);
      toast.success(`Location updated: ${formatPlace(data.city, data.country)}`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to save location");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Enter" && highlighted >= 0) {
      e.preventDefault();
      selectCity(suggestions[highlighted]);
    }
  };

  const currentPlace = formatPlace(location.city, location.country);
  const hasLocation = location.latitude !== null && location.longitude !== null;
  const busy = locating || saving;

  return (
    <div className="py-4 text-gray-900 flex flex-col gap-6">
      {/* current location */}
      <div className="flex items-center gap-3 rounded-xl bg-pink-50 px-4 py-3">
        <MapPin className="text-pink-600 shrink-0" size={22} />
        <div className="min-w-0">
          <p className="text-sm text-gray-500">Your location</p>
          <p className="font-medium truncate">
            {currentPlace || (hasLocation ? "Unnamed place" : "Not set yet")}
          </p>
        </div>
        {busy && <Loader2 className="ml-auto animate-spin text-pink-600 shrink-0" size={20} />}
      </div>

      {/* browser position */}
      <div>
        <button
          type="button"
          onClick={handleGeoloc}
          disabled={busy}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-lg bg-pink-600 px-4 py-2 font-semibold text-white hover:bg-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {locating ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
          {locating ? "Locating..." : "Use my current position"}
        </button>
        <p className="text-xs text-gray-500 mt-1">
          If you refuse, an approximate location is taken from your connection.
        </p>
      </div>

      <div className="flex items-center gap-3 text-sm text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        or
        <span className="h-px flex-1 bg-gray-200" />
      </div>

      {/* city search */}
      <div className="relative">
        <label htmlFor="city-search" className="block text-sm font-medium text-gray-700 mb-1">
          Search for a city
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            id="city-search"
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls="city-suggestions"
            aria-autocomplete="list"
            aria-activedescendant={open && highlighted >= 0 ? `city-option-${highlighted}` : undefined}
            autoComplete="off"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onBlur={() => setOpen(false)}
            disabled={saving}
            // the current city reads as the field value, typing replaces it
            placeholder={currentPlace || "e.g. Lyon"}
            maxLength={100}
            className={`w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50 ${
              currentPlace ? "placeholder:text-gray-700" : ""
            }`}
          />
          {searching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={18} />
          )}
        </div>

        {open && (
          <ul
            id="city-suggestions"
            role="listbox"
            className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            {suggestions.length === 0 ? (
              <li className="px-4 py-2 text-sm text-gray-500">No city found</li>
            ) : (
              suggestions.map((s, i) => (
                <li
                  key={`${s.city}|${s.region}|${s.country}`}
                  id={`city-option-${i}`}
                  role="option"
                  aria-selected={i === highlighted}
                  // mousedown fires before the input blur that closes the list
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCity(s);
                  }}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`cursor-pointer px-4 py-2 ${i === highlighted ? "bg-pink-50" : ""}`}
                >
                  <span className="font-medium">{s.city}</span>
                  <span className="text-sm text-gray-500">
                    {" "}{[s.region, s.country].filter(Boolean).join(", ")}
                  </span>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
