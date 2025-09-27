"use client";

import { useState, useEffect } from "react";

type SearchCriteria = {
  gender: "male" | "female" | "any";
  distance: number;
  ageRange: [number, number];
  interests: "atLeastOne" | "custom";
  customInterests: string[];
  fame: number;
};

export default function SearchForm({ onSubmit }: { onSubmit: (criteria: SearchCriteria) => void }) {
  const [collapsed, setCollapsed] = useState(false);

  const [gender, setGender] = useState<SearchCriteria["gender"]>("any");
  const [distance, setDistance] = useState(50);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 99]);
  const [interestsMode, setInterestsMode] = useState<"atLeastOne" | "custom">("atLeastOne");
  const [customInterests, setCustomInterests] = useState<string[]>([]);
  const [fame, setFame] = useState(0);

  const [allInterests, setAllInterests] = useState<string[]>([]);

  // Charger la liste des intérêts depuis ton API
  useEffect(() => {
    async function fetchInterests() {
      try {
        const res = await fetch("/api/interests");
        if (!res.ok) throw new Error("Failed to fetch interests");
        const data = await res.json();
        // ⚠️ j’imagine que ton API renvoie un tableau d’objets { id, name }
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
    const criteria: SearchCriteria = { gender, distance, ageRange, interests: interestsMode, customInterests, fame };
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
        <span className="mr-2">👤 {gender === "any" ? "Both" : gender}</span>
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
      className="space-y-6 p-4 max-w-md mx-auto bg-white -md rounded-2xl text-black"
    >
      {/* Gender */}
      <div>
        <label className="block font-medium mb-2"
               onClick={() => setCollapsed(!collapsed)}
        >Gender</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as any)}
          className="w-full border rounded p-2"
        >
          <option value="any">Both</option>
          <option value="male">Men</option>
          <option value="female">Women</option>
        </select>
      </div>

      {/* Distance */}
      <div>
        <label className="block font-medium mb-2">Distance (km)</label>
        <input
          type="range"
          min="0"
          max="500"
          step="5"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="w-full"
        />
        <p className="text-sm mt-1">{distance === 500 ? "500+ km" : `${distance} km`}</p>
      </div>

      {/* Age */}
      <div>
        <label className="block font-medium mb-2">Age</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={18}
            max={ageRange[1]}
            value={ageRange[0]}
            onChange={(e) => setAgeRange([+e.target.value, ageRange[1]])}
            className="w-1/2 border rounded p-2"
          />
          <input
            type="number"
            min={ageRange[0]}
            max={99}
            value={ageRange[1]}
            onChange={(e) => setAgeRange([ageRange[0], +e.target.value])}
            className="w-1/2 border rounded p-2"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="block font-medium mb-2">Interested in people who</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="interests"
              value="atLeastOne"
              checked={interestsMode === "atLeastOne"}
              onChange={() => setInterestsMode("atLeastOne")}
            />
            <span>Share at least one interest with me</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="interests"
              value="custom"
              checked={interestsMode === "custom"}
              onChange={() => setInterestsMode("custom")}
            />
            <span>Have at least one of these</span>
          </label>
        </div>
        {interestsMode === "custom" && (
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
      <div>
        <label className="block font-medium mb-2">Fame</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              onClick={() => setFame(star)}
              className={`cursor-pointer text-2xl ${
                fame >= star ? "text-yellow-500" : "text-gray-400"
              }`}
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
