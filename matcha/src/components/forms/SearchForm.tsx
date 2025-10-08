"use client";

import { useState, useEffect } from "react";
import { SearchCriteria } from "@/types";

export default function SearchForm({ onSubmit }: { onSubmit: (criteria: SearchCriteria) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  // Activation des filtres
  const [useDistance, setUseDistance] = useState(false);
  const [useAge, setUseAge] = useState(false);
  const [useInterests, setUseInterests] = useState(false);
  const [useFame, setUseFame] = useState(false);

  // Valeurs des filtres
  const [distance, setDistance] = useState(50);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
  const [interestsMode, setInterestsMode] = useState<"atLeastOne" | "custom">("atLeastOne");
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [fame, setFame] = useState(0);

  const [allInterests, setAllInterests] = useState<string[]>([]);

  useEffect(() => {
    async function fetchInterests() {
      try {
        const res = await fetch("/api/interests");
        if (!res.ok) throw new Error("Failed to fetch interests");
        const data = await res.json();
        const names = data.map((i: any) => i.name);
        setAllInterests(names);
      } catch (err) {
        console.error(err);
      }
    }
    fetchInterests();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const criteria: SearchCriteria = {};
    if (useDistance) criteria.distance = distance;
    if (useAge) criteria.ageRange = ageRange;
    if (useInterests) {
      criteria.interests = interestsMode;
      criteria.customInterests = customInterests;
    }
    if (useFame) criteria.fame = fame;
    onSubmit(criteria);
    setCollapsed(true);
  }

  if (collapsed) {
    const displayedInterests =
    interestsMode === "custom"
      ? customInterests.slice(0, 5)
      : [];

    return (
      <div
        className="p-3 bg-blue-50 border rounded flex items-center text-sm text-black"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="mr-2">📍 {distance === 500 ? "500+ km" : `${distance} km`}</span>
        <span className="mr-2">🎂 {ageRange[0]} - {ageRange[1]} </span>
        <span className="mr-2">⭐ {fame > 0 ? `${fame}+` : "All"}</span>
        {interestsMode === "custom" && displayedInterests.length > 0 && (
          <span className="mr-2">🎯 {displayedInterests.join(", ")}</span>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 p-4 max-w-md mx-auto bg-white rounded-2xl text-black"
    >
      <div className="flex justify-between">
        <button onClick={() => setCollapsed(!collapsed)}>🔺</button>
        <span>Advanced search</span>
      </div>
      {/* Distance */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useDistance}
          onChange={() => setUseDistance(!useDistance)}
          id="distance-filter"
        />
        <label htmlFor="distance-filter" className="block font-medium mb-2">Distance (km)</label>
        <input
          type="range"
          min="0"
          max="500"
          step="5"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="flex-1"
          disabled={!useDistance}
        />
        <span className="text-sm ml-2">{distance === 500 ? "500+ km" : `${distance} km`}</span>
      </div>

      {/* Age */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useAge}
          onChange={() => setUseAge(!useAge)}
          id="age-filter"
        />
        <label htmlFor="age-filter" className="block font-medium mb-2">Âge</label>
        <input
          type="number"
          min={18}
          max={ageRange[1]}
          value={ageRange[0]}
          onChange={(e) => setAgeRange([+e.target.value, ageRange[1]])}
          className="border rounded p-2 w-20"
          disabled={!useAge}
        />
        <span>-</span>
        <input
          type="number"
          min={ageRange[0]}
          max={99}
          value={ageRange[1]}
          onChange={(e) => setAgeRange([ageRange[0], +e.target.value])}
          className="border rounded p-2 w-20"
          disabled={!useAge}
        />
      </div>

      {/* Interests */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <input
            type="checkbox"
            checked={useInterests}
            onChange={() => setUseInterests(!useInterests)}
            id="interests-filter"
          />
          <label htmlFor="interests-filter" className="font-medium">Centres d'intérêt</label>
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="interests"
              value="atLeastOne"
              checked={interestsMode === "atLeastOne"}
              onChange={() => setInterestsMode("atLeastOne")}
              disabled={!useInterests}
            />
            <span>Au moins un en commun</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="interests"
              value="custom"
              checked={interestsMode === "custom"}
              onChange={() => setInterestsMode("custom")}
              disabled={!useInterests}
            />
            <span>Parmi ceux-ci</span>
          </label>
        </div>
        {useInterests && interestsMode === "custom" && (
          <select
            multiple
            value={customInterests}
            onChange={(e) =>
              setCustomInterests(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            className="w-full border rounded p-2 mt-2 h-32"
          >
            {allInterests.map((interest) => (
              <option key={interest} value={interest}>
                {interest}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Fame */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={useFame}
          onChange={() => setUseFame(!useFame)}
          id="fame-filter"
        />
        <label htmlFor="fame-filter" className="block font-medium mb-2">Célébrité</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => useFame && setFame(star)}
              className={`cursor-pointer text-2xl ${
                fame >= star ? "text-yellow-500" : "text-gray-400"
              } ${!useFame ? "opacity-50 pointer-events-none" : ""}`}
            >
              ★
            </span>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
      >
        Rechercher
      </button>
    </form>
  );
}
